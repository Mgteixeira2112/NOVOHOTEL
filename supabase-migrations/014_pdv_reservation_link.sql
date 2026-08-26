-- HOTEL OS — PDV: vinculação segura do pedido à hospedagem.
-- A partir desta fase, pedidos destinados à conta do quarto devem carregar a reserva.

ALTER TABLE public.pdv_pedidos
  ADD CONSTRAINT pdv_pedido_quarto_reserva_consistencia
  CHECK (quarto_id IS NULL OR reserva_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.criar_pedido_pdv(
  p_hotel_id UUID, p_quarto_id TEXT, p_origem TEXT, p_itens JSONB,
  p_observacao TEXT DEFAULT NULL, p_idempotency_key TEXT DEFAULT NULL,
  p_reserva_id TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pedido_id UUID; v_item JSONB; v_produto public.pdv_produtos%ROWTYPE;
  v_quantidade NUMERIC; v_total NUMERIC(12,2) := 0;
BEGIN
  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;
  IF p_origem NOT IN ('pdv','tablet_quarto','recepcao','cozinha','outro') THEN RAISE EXCEPTION 'Origem de pedido inválida'; END IF;
  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) = 0 THEN RAISE EXCEPTION 'O pedido precisa conter itens'; END IF;

  IF p_quarto_id IS NOT NULL THEN
    IF p_reserva_id IS NULL THEN RAISE EXCEPTION 'Pedido de quarto exige reserva'; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.id = p_reserva_id AND r.hotel_id = p_hotel_id AND r.quarto_id = p_quarto_id
        AND r.status NOT IN ('cancelada','cancelado')
        AND r.checkin <= NOW() AND r.checkout > NOW()
    ) THEN
      RAISE EXCEPTION 'Não existe hospedagem ativa para este quarto';
    END IF;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_pedido_id FROM public.pdv_pedidos
    WHERE hotel_id = p_hotel_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN v_pedido_id; END IF;
  END IF;

  INSERT INTO public.pdv_pedidos
    (hotel_id, quarto_id, reserva_id, origem, observacoes, status, criado_por, total, idempotency_key)
  VALUES
    (p_hotel_id, p_quarto_id, p_reserva_id, p_origem, p_observacao, 'recebido', auth.uid(), 0, p_idempotency_key)
  RETURNING id INTO v_pedido_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens) LOOP
    v_quantidade := COALESCE((v_item->>'quantidade')::NUMERIC, 0);
    IF v_quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade de item inválida'; END IF;
    SELECT * INTO v_produto FROM public.pdv_produtos
    WHERE id = (v_item->>'produto_id')::UUID AND hotel_id = p_hotel_id AND ativo = TRUE FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado ou inativo'; END IF;
    INSERT INTO public.pdv_itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, observacao)
    VALUES (v_pedido_id, v_produto.id, v_quantidade, v_produto.preco, v_item->>'observacao');
    v_total := v_total + (v_produto.preco * v_quantidade);
  END LOOP;

  UPDATE public.pdv_pedidos SET total = v_total, atualizado_em = NOW() WHERE id = v_pedido_id;
  RETURN v_pedido_id;
EXCEPTION
  WHEN unique_violation THEN
    IF p_idempotency_key IS NOT NULL THEN
      SELECT id INTO v_pedido_id FROM public.pdv_pedidos WHERE hotel_id = p_hotel_id AND idempotency_key = p_idempotency_key;
      IF FOUND THEN RETURN v_pedido_id; END IF;
    END IF;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_pedido_pdv(UUID,TEXT,TEXT,JSONB,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_pedido_pdv(UUID,TEXT,TEXT,JSONB,TEXT,TEXT,TEXT) TO authenticated;
