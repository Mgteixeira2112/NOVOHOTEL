-- HOTEL OS — GOVERNANÇA: fluxo de limpeza e liberação de quartos.
-- Mantém o status operacional fora da tabela legada de quartos para reduzir risco de quebra.

CREATE TABLE IF NOT EXISTS public.governanca_tarefas_quarto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT NOT NULL REFERENCES public.quartos(id) ON DELETE CASCADE,
  reserva_id TEXT,
  tipo TEXT NOT NULL DEFAULT 'limpeza_checkout'
    CHECK (tipo IN ('limpeza_checkout','limpeza_extra','inspecao','manutencao')),
  status TEXT NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando','em_limpeza','aguardando_inspecao','aprovado','reprovado','cancelado')),
  prioridade INTEGER NOT NULL DEFAULT 0 CHECK (prioridade BETWEEN 0 AND 100),
  observacoes TEXT,
  atribuido_a UUID,
  criado_por UUID,
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  inspecionado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governanca_quarto_status
  ON public.governanca_tarefas_quarto(hotel_id, quarto_id, status);
CREATE INDEX IF NOT EXISTS idx_governanca_kanban
  ON public.governanca_tarefas_quarto(hotel_id, status, prioridade DESC, criado_em);

ALTER TABLE public.governanca_tarefas_quarto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS governanca_tarefas_hotel_access ON public.governanca_tarefas_quarto;
CREATE POLICY governanca_tarefas_hotel_access
ON public.governanca_tarefas_quarto
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

CREATE OR REPLACE FUNCTION public.criar_tarefa_limpeza_checkout(
  p_hotel_id UUID,
  p_quarto_id TEXT,
  p_reserva_id TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.quartos
    WHERE id = p_quarto_id AND hotel_id = p_hotel_id
  ) THEN
    RAISE EXCEPTION 'Quarto não pertence ao hotel';
  END IF;

  SELECT id INTO v_id
  FROM public.governanca_tarefas_quarto
  WHERE hotel_id = p_hotel_id
    AND quarto_id = p_quarto_id
    AND status IN ('aguardando','em_limpeza','aguardando_inspecao','reprovado')
  ORDER BY criado_em DESC
  LIMIT 1;

  IF FOUND THEN RETURN v_id; END IF;

  INSERT INTO public.governanca_tarefas_quarto
    (hotel_id, quarto_id, reserva_id, tipo, status, observacoes, criado_por)
  VALUES
    (p_hotel_id, p_quarto_id, p_reserva_id, 'limpeza_checkout', 'aguardando', p_observacoes, auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_tarefa_governanca(
  p_tarefa_id UUID,
  p_novo_status TEXT,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tarefa public.governanca_tarefas_quarto%ROWTYPE;
  v_ok BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_tarefa FROM public.governanca_tarefas_quarto WHERE id = p_tarefa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tarefa não encontrada'; END IF;
  IF NOT public.usuario_pode_hotel(v_tarefa.hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;

  v_ok :=
    (v_tarefa.status = 'aguardando' AND p_novo_status IN ('em_limpeza','cancelado')) OR
    (v_tarefa.status = 'em_limpeza' AND p_novo_status IN ('aguardando_inspecao','cancelado')) OR
    (v_tarefa.status = 'aguardando_inspecao' AND p_novo_status IN ('aprovado','reprovado')) OR
    (v_tarefa.status = 'reprovado' AND p_novo_status = 'em_limpeza');

  IF NOT v_ok THEN
    RAISE EXCEPTION 'Transição de governança não permitida: % -> %', v_tarefa.status, p_novo_status;
  END IF;

  UPDATE public.governanca_tarefas_quarto
  SET status = p_novo_status,
      observacoes = COALESCE(p_observacoes, observacoes),
      iniciado_em = CASE WHEN p_novo_status = 'em_limpeza' AND iniciado_em IS NULL THEN NOW() ELSE iniciado_em END,
      concluido_em = CASE WHEN p_novo_status = 'aguardando_inspecao' THEN NOW() ELSE concluido_em END,
      inspecionado_em = CASE WHEN p_novo_status IN ('aprovado','reprovado') THEN NOW() ELSE inspecionado_em END,
      atualizado_em = NOW()
  WHERE id = p_tarefa_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_tarefa_limpeza_checkout(UUID,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_tarefa_limpeza_checkout(UUID,TEXT,TEXT,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.atualizar_tarefa_governanca(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_tarefa_governanca(UUID,TEXT,TEXT) TO authenticated;
