-- HOTEL OS — PDV/KDS: transições de status controladas no servidor.

CREATE OR REPLACE FUNCTION public.atualizar_status_pedido_pdv(
  p_pedido_id UUID,
  p_novo_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hotel_id UUID;
  v_status TEXT;
  v_permitido BOOLEAN := FALSE;
BEGIN
  SELECT hotel_id, status INTO v_hotel_id, v_status
  FROM public.pdv_pedidos
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  IF NOT public.usuario_pode_hotel(v_hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  IF p_novo_status NOT IN ('recebido','em_preparo','pronto','entregue','cancelado') THEN
    RAISE EXCEPTION 'Status de pedido inválido';
  END IF;

  v_permitido :=
    (v_status = 'recebido' AND p_novo_status IN ('em_preparo','cancelado')) OR
    (v_status = 'em_preparo' AND p_novo_status IN ('pronto','cancelado')) OR
    (v_status = 'pronto' AND p_novo_status IN ('entregue')) OR
    (v_status = 'entregue' AND p_novo_status = 'entregue');

  IF NOT v_permitido THEN
    RAISE EXCEPTION 'Transição de status não permitida: % -> %', v_status, p_novo_status;
  END IF;

  UPDATE public.pdv_pedidos
  SET status = p_novo_status, updated_at = NOW()
  WHERE id = p_pedido_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.atualizar_status_pedido_pdv(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atualizar_status_pedido_pdv(UUID,TEXT) TO authenticated;
