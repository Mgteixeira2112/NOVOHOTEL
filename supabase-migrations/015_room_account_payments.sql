-- HOTEL OS — FINANCEIRO: pagamentos e fechamento da conta do quarto.

ALTER TABLE public.contas_quarto_lancamentos
  ADD CONSTRAINT contas_quarto_lancamentos_valor_positivo CHECK (valor > 0);

CREATE TABLE IF NOT EXISTS public.contas_quarto_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID NOT NULL REFERENCES public.contas_quarto(id) ON DELETE RESTRICT,
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  metodo TEXT NOT NULL CHECK (metodo IN ('pix','dinheiro','debito','credito','transferencia','outro')),
  status TEXT NOT NULL DEFAULT 'aprovado' CHECK (status IN ('pendente','aprovado','negado','estornado','cancelado')),
  idempotency_key TEXT,
  codigo_transacao TEXT,
  criado_por UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_contas_quarto_pagamentos_conta ON public.contas_quarto_pagamentos(conta_id, criado_em);

ALTER TABLE public.contas_quarto_pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contas_quarto_pagamentos_hotel_access ON public.contas_quarto_pagamentos;
CREATE POLICY contas_quarto_pagamentos_hotel_access ON public.contas_quarto_pagamentos
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

CREATE OR REPLACE FUNCTION public.registrar_pagamento_conta_quarto(
  p_conta_id UUID,
  p_valor NUMERIC,
  p_metodo TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_codigo_transacao TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conta public.contas_quarto%ROWTYPE;
  v_pagamento UUID;
BEGIN
  SELECT * INTO v_conta FROM public.contas_quarto WHERE id = p_conta_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
  IF NOT public.usuario_pode_hotel(v_conta.hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;
  IF v_conta.status <> 'aberta' THEN RAISE EXCEPTION 'Conta não está aberta'; END IF;
  IF p_valor <= 0 THEN RAISE EXCEPTION 'Valor de pagamento inválido'; END IF;
  IF p_metodo NOT IN ('pix','dinheiro','debito','credito','transferencia','outro') THEN RAISE EXCEPTION 'Método de pagamento inválido'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_pagamento FROM public.contas_quarto_pagamentos
    WHERE hotel_id = v_conta.hotel_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_pagamento; END IF;
  END IF;

  INSERT INTO public.contas_quarto_pagamentos
    (conta_id, hotel_id, valor, metodo, status, idempotency_key, codigo_transacao, criado_por)
  VALUES
    (v_conta.id, v_conta.hotel_id, p_valor, p_metodo, 'aprovado', p_idempotency_key, p_codigo_transacao, auth.uid())
  RETURNING id INTO v_pagamento;

  INSERT INTO public.contas_quarto_lancamentos
    (conta_id, hotel_id, tipo, referencia_id, descricao, valor, criado_por)
  VALUES
    (v_conta.id, v_conta.hotel_id, 'pagamento', v_pagamento, 'Pagamento ' || p_metodo, p_valor, auth.uid());

  RETURN v_pagamento;
EXCEPTION
  WHEN unique_violation THEN
    IF p_idempotency_key IS NOT NULL THEN
      SELECT id INTO v_pagamento FROM public.contas_quarto_pagamentos
      WHERE hotel_id = v_conta.hotel_id AND idempotency_key = p_idempotency_key;
      IF FOUND THEN RETURN v_pagamento; END IF;
    END IF;
    RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.fechar_conta_quarto(p_conta_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_conta public.contas_quarto%ROWTYPE;
  v_debitos NUMERIC(12,2);
  v_pagamentos NUMERIC(12,2);
BEGIN
  SELECT * INTO v_conta FROM public.contas_quarto WHERE id = p_conta_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conta não encontrada'; END IF;
  IF NOT public.usuario_pode_hotel(v_conta.hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;
  IF v_conta.status <> 'aberta' THEN RAISE EXCEPTION 'Conta já está fechada ou cancelada'; END IF;

  SELECT COALESCE(SUM(valor),0) INTO v_debitos
  FROM public.contas_quarto_lancamentos
  WHERE conta_id = p_conta_id AND tipo IN ('pdv','diaria','taxa','ajuste');

  SELECT COALESCE(SUM(valor),0) INTO v_pagamentos
  FROM public.contas_quarto_pagamentos
  WHERE conta_id = p_conta_id AND status = 'aprovado';

  IF v_pagamentos < v_debitos THEN
    RAISE EXCEPTION 'Conta possui saldo pendente de R$ %', (v_debitos - v_pagamentos);
  END IF;

  UPDATE public.contas_quarto SET status = 'fechada', fechado_em = NOW() WHERE id = p_conta_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_pagamento_conta_quarto(UUID,NUMERIC,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_pagamento_conta_quarto(UUID,NUMERIC,TEXT,TEXT,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.fechar_conta_quarto(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fechar_conta_quarto(UUID) TO authenticated;
