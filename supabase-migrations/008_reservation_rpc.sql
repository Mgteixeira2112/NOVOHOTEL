-- HOTEL OS — RESERVA: criação transacional.
-- A operação valida autorização, datas, quarto, capacidade e conflitos antes do INSERT.
-- Ajustar nomes/colunas se o schema de produção diferir do schema atual.

CREATE OR REPLACE FUNCTION public.criar_reserva_segura(
  p_hotel_id UUID,
  p_quarto_id TEXT,
  p_checkin TIMESTAMPTZ,
  p_checkout TIMESTAMPTZ,
  p_hospedes INTEGER DEFAULT 1,
  p_reserva_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva_id TEXT;
  v_capacidade INTEGER;
BEGIN
  IF p_checkout <= p_checkin THEN
    RAISE EXCEPTION 'Período de hospedagem inválido';
  END IF;

  IF p_hospedes < 1 THEN
    RAISE EXCEPTION 'Quantidade de hóspedes inválida';
  END IF;

  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  SELECT q.capacidade
    INTO v_capacidade
  FROM public.quartos q
  WHERE q.id = p_quarto_id
    AND q.hotel_id = p_hotel_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quarto não encontrado para este hotel';
  END IF;

  IF COALESCE(v_capacidade, 0) < p_hospedes THEN
    RAISE EXCEPTION 'Capacidade do quarto insuficiente';
  END IF;

  IF NOT public.validar_disponibilidade_quarto(
    p_hotel_id, p_quarto_id, p_checkin, p_checkout, p_reserva_id
  ) THEN
    RAISE EXCEPTION 'Quarto indisponível para o período informado';
  END IF;

  v_reserva_id := COALESCE(p_reserva_id, gen_random_uuid()::text);

  INSERT INTO public.reservas (
    id, hotel_id, quarto_id, checkin, checkout, status
  ) VALUES (
    v_reserva_id, p_hotel_id, p_quarto_id, p_checkin, p_checkout, 'confirmada'
  );

  RETURN v_reserva_id;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_reserva_segura(UUID,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_reserva_segura(UUID,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,INTEGER,TEXT) TO authenticated;
