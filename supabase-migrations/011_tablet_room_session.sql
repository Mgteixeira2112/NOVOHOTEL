-- HOTEL OS — TABLET: sessão segura vinculada a hotel, quarto e reserva.

CREATE OR REPLACE FUNCTION public.iniciar_sessao_tablet_quarto(
  p_dispositivo_id UUID,
  p_hotel_id UUID,
  p_quarto_id TEXT,
  p_reserva_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessao_id UUID;
BEGIN
  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dispositivos_hotel d
    WHERE d.id = p_dispositivo_id
      AND d.hotel_id = p_hotel_id
      AND d.quarto_id = p_quarto_id
      AND d.ativo = TRUE
  ) THEN
    RAISE EXCEPTION 'Dispositivo não autorizado para este quarto';
  END IF;

  IF p_reserva_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.id = p_reserva_id
      AND r.hotel_id = p_hotel_id
      AND r.quarto_id = p_quarto_id
      AND r.status NOT IN ('cancelada','cancelado')
  ) THEN
    RAISE EXCEPTION 'Reserva inválida para este quarto';
  END IF;

  UPDATE public.sessoes_tablet_quarto
  SET ativa = FALSE, encerrada_em = NOW()
  WHERE dispositivo_id = p_dispositivo_id AND ativa = TRUE;

  INSERT INTO public.sessoes_tablet_quarto (
    dispositivo_id, hotel_id, quarto_id, reserva_id, ativa
  ) VALUES (
    p_dispositivo_id, p_hotel_id, p_quarto_id, p_reserva_id, TRUE
  )
  RETURNING id INTO v_sessao_id;

  UPDATE public.dispositivos_hotel
  SET ultimo_acesso = NOW()
  WHERE id = p_dispositivo_id;

  RETURN v_sessao_id;
END;
$$;

REVOKE ALL ON FUNCTION public.iniciar_sessao_tablet_quarto(UUID,UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.iniciar_sessao_tablet_quarto(UUID,UUID,TEXT,TEXT) TO authenticated;
