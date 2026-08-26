-- HOTEL OS — PDV/CONTA: lançamento automático e idempotente de pedido entregue.

CREATE OR REPLACE FUNCTION public.lancar_pedido_entregue_na_conta(p_pedido_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pedido public.pdv_pedidos%ROWTYPE;
  v_conta public.contas_quarto%ROWTYPE;
  v_lancamento UUID;
BEGIN
  SELECT * INTO v_pedido FROM public.pdv_pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF NOT public.usuario_pode_hotel(v_pedido.hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;
  IF v_pedido.status <> 'entregue' THEN RAISE EXCEPTION 'Somente pedidos entregues podem ser lançados na conta'; END IF;
  IF v_pedido.quarto_id IS NULL OR v_pedido.reserva_id IS NULL THEN RAISE EXCEPTION 'Pedido não está vinculado a quarto e reserva'; END IF;

  SELECT * INTO v_conta
  FROM public.contas_quarto
  WHERE hotel_id = v_pedido.hotel_id
    AND quarto_id = v_pedido.quarto_id
    AND reserva_id = v_pedido.reserva_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Conta da reserva não encontrada'; END IF;
  IF v_conta.status <> 'aberta' THEN RAISE EXCEPTION 'Conta da reserva não está aberta'; END IF;

  SELECT id INTO v_lancamento
  FROM public.contas_quarto_lancamentos
  WHERE conta_id = v_conta.id AND referencia_id = v_pedido.id AND tipo = 'pdv'
  LIMIT 1;
  IF FOUND THEN RETURN v_lancamento; END IF;

  INSERT INTO public.contas_quarto_lancamentos
    (conta_id, hotel_id, tipo, referencia_id, descricao, valor, criado_por)
  VALUES
    (v_conta.id, v_conta.hotel_id, 'pdv', v_pedido.id,
     'Pedido PDV #' || v_pedido.id, v_pedido.total, auth.uid())
  RETURNING id INTO v_lancamento;

  RETURN v_lancamento;
END;
$$;

REVOKE ALL ON FUNCTION public.lancar_pedido_entregue_na_conta(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lancar_pedido_entregue_na_conta(UUID) TO authenticated;
