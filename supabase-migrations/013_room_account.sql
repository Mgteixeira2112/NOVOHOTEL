-- HOTEL OS — CONTA DO QUARTO / FOLIO
-- Mantém consumos do PDV vinculados à hospedagem e preparados para checkout.

CREATE TABLE IF NOT EXISTS public.contas_quarto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT NOT NULL REFERENCES public.quartos(id) ON DELETE RESTRICT,
  reserva_id TEXT NOT NULL REFERENCES public.reservas(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','fechada','cancelada')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechado_em TIMESTAMPTZ,
  UNIQUE (hotel_id, reserva_id)
);

CREATE TABLE IF NOT EXISTS public.contas_quarto_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID NOT NULL REFERENCES public.contas_quarto(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pdv','diaria','taxa','ajuste','pagamento','estorno')),
  referencia_id UUID,
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  criado_por UUID
);

CREATE INDEX IF NOT EXISTS idx_contas_quarto_hotel_reserva ON public.contas_quarto(hotel_id, reserva_id);
CREATE INDEX IF NOT EXISTS idx_contas_quarto_lancamentos_conta ON public.contas_quarto_lancamentos(conta_id, criado_em);

ALTER TABLE public.contas_quarto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_quarto_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contas_quarto_hotel_access ON public.contas_quarto;
CREATE POLICY contas_quarto_hotel_access ON public.contas_quarto
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS contas_quarto_lancamentos_hotel_access ON public.contas_quarto_lancamentos;
CREATE POLICY contas_quarto_lancamentos_hotel_access ON public.contas_quarto_lancamentos
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

CREATE OR REPLACE FUNCTION public.obter_ou_criar_conta_quarto(
  p_hotel_id UUID,
  p_quarto_id TEXT,
  p_reserva_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_conta_id UUID;
BEGIN
  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = p_reserva_id
      AND r.hotel_id = p_hotel_id
      AND r.quarto_id = p_quarto_id
      AND r.status NOT IN ('cancelada','cancelado')
  ) THEN
    RAISE EXCEPTION 'Reserva inválida para a conta do quarto';
  END IF;

  INSERT INTO public.contas_quarto (hotel_id, quarto_id, reserva_id)
  VALUES (p_hotel_id, p_quarto_id, p_reserva_id)
  ON CONFLICT (hotel_id, reserva_id) DO UPDATE SET status = contas_quarto.status
  RETURNING id INTO v_conta_id;

  RETURN v_conta_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.lancar_pedido_na_conta_quarto(p_pedido_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pedido public.pdv_pedidos%ROWTYPE;
  v_conta_id UUID;
BEGIN
  SELECT * INTO v_pedido FROM public.pdv_pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF NOT public.usuario_pode_hotel(v_pedido.hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;
  IF v_pedido.quarto_id IS NULL OR v_pedido.reserva_id IS NULL THEN RAISE EXCEPTION 'Pedido não está vinculado a quarto e reserva'; END IF;
  IF v_pedido.status NOT IN ('entregue','fechado') THEN RAISE EXCEPTION 'Pedido ainda não pode ser lançado na conta'; END IF;

  v_conta_id := public.obter_ou_criar_conta_quarto(v_pedido.hotel_id, v_pedido.quarto_id, v_pedido.reserva_id);

  INSERT INTO public.contas_quarto_lancamentos
    (conta_id, hotel_id, tipo, referencia_id, descricao, valor, criado_por)
  SELECT v_conta_id, v_pedido.hotel_id, 'pdv', v_pedido.id,
         'Pedido PDV ' || v_pedido.id::text, v_pedido.total, auth.uid()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.contas_quarto_lancamentos l
    WHERE l.conta_id = v_conta_id AND l.tipo = 'pdv' AND l.referencia_id = v_pedido.id
  );

  RETURN v_conta_id;
END;
$$;

REVOKE ALL ON FUNCTION public.obter_ou_criar_conta_quarto(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obter_ou_criar_conta_quarto(UUID,TEXT,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.lancar_pedido_na_conta_quarto(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lancar_pedido_na_conta_quarto(UUID) TO authenticated;
