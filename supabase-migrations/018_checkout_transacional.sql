-- HOTEL OS — CHECKOUT: finaliza a hospedagem somente com conta quitada
-- e encaminha o quarto automaticamente para governança.

CREATE OR REPLACE FUNCTION public.finalizar_checkout_reserva(p_reserva_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva public.reservas%ROWTYPE;
  v_conta public.contas_quarto%ROWTYPE;
  v_debitos NUMERIC(12,2) := 0;
  v_pagamentos NUMERIC(12,2) := 0;
BEGIN
  SELECT * INTO v_reserva
  FROM public.reservas
  WHERE id = p_reserva_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada';
  END IF;

  IF NOT public.usuario_pode_hotel(v_reserva.hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  IF v_reserva.status IN ('cancelada','cancelado','checkout_concluido','finalizada') THEN
    RAISE EXCEPTION 'Reserva não está disponível para checkout';
  END IF;

  SELECT * INTO v_conta
  FROM public.contas_quarto
  WHERE hotel_id = v_reserva.hotel_id
    AND reserva_id = v_reserva.id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.contas_quarto (hotel_id, quarto_id, reserva_id, status)
    VALUES (v_reserva.hotel_id, v_reserva.quarto_id, v_reserva.id, 'aberta')
    RETURNING * INTO v_conta;
  END IF;

  IF v_conta.status = 'cancelada' THEN
    RAISE EXCEPTION 'Conta da hospedagem está cancelada';
  END IF;

  SELECT COALESCE(SUM(valor), 0)
    INTO v_debitos
  FROM public.contas_quarto_lancamentos
  WHERE conta_id = v_conta.id
    AND tipo IN ('pdv','diaria','taxa','ajuste');

  SELECT COALESCE(SUM(valor), 0)
    INTO v_pagamentos
  FROM public.contas_quarto_pagamentos
  WHERE conta_id = v_conta.id
    AND status = 'aprovado';

  IF v_pagamentos < v_debitos THEN
    RAISE EXCEPTION 'Checkout bloqueado: saldo pendente de R$ %',
      (v_debitos - v_pagamentos);
  END IF;

  UPDATE public.contas_quarto
  SET status = 'fechada', fechado_em = NOW()
  WHERE id = v_conta.id;

  UPDATE public.reservas
  SET status = 'checkout_concluido'
  WHERE id = v_reserva.id;

  IF v_reserva.quarto_id IS NOT NULL THEN
    UPDATE public.quartos
    SET status = 'sujo', updated_at = NOW()
    WHERE id = v_reserva.quarto_id
      AND hotel_id = v_reserva.hotel_id;

    PERFORM public.criar_tarefa_limpeza_checkout(
      v_reserva.hotel_id,
      v_reserva.quarto_id,
      v_reserva.id,
      'Checkout concluído automaticamente; quarto encaminhado para limpeza.'
    );
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.finalizar_checkout_reserva(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalizar_checkout_reserva(TEXT) TO authenticated;
