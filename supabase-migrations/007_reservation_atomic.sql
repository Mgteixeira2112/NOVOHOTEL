-- HOTEL OS — FASE RESERVAS: proteção contra overbooking concorrente.
-- A validação final deve ocorrer dentro da mesma transação que grava a reserva.

CREATE OR REPLACE FUNCTION public.validar_disponibilidade_quarto(
  p_hotel_id UUID,
  p_quarto_id TEXT,
  p_checkin TIMESTAMPTZ,
  p_checkout TIMESTAMPTZ,
  p_reserva_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_checkout <= p_checkin THEN
    RAISE EXCEPTION 'checkout deve ser posterior ao checkin';
  END IF;

  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'usuário sem acesso ao hotel';
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.reservas r
    WHERE r.hotel_id = p_hotel_id
      AND r.quarto_id = p_quarto_id
      AND COALESCE(r.status, '') NOT IN ('cancelada','cancelado')
      AND (p_reserva_id IS NULL OR r.id <> p_reserva_id)
      AND r.checkin < p_checkout
      AND r.checkout > p_checkin
  );
END;
$$;

-- Índice para acelerar a verificação de conflitos.
CREATE INDEX IF NOT EXISTS idx_reservas_quarto_hotel_periodo_status
ON public.reservas(hotel_id, quarto_id, checkin, checkout, status);

COMMENT ON FUNCTION public.validar_disponibilidade_quarto(UUID,TEXT,TIMESTAMPTZ,TIMESTAMPTZ,TEXT)
IS 'Guarda de disponibilidade. A confirmação da reserva deve chamar esta função e inserir a reserva na mesma transação RPC para evitar overbooking concorrente.';
