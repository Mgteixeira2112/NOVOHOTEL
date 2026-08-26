-- HOTEL OS — ESTOQUE DO PDV
-- Ledger de movimentações + saldo atual. A baixa é server-side e idempotente por pedido.

CREATE TABLE IF NOT EXISTS public.pdv_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.pdv_produtos(id) ON DELETE RESTRICT,
  quantidade NUMERIC(12,3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,3) NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id, produto_id),
  CHECK (estoque_minimo >= 0)
);

CREATE TABLE IF NOT EXISTS public.pdv_estoque_movimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.pdv_produtos(id) ON DELETE RESTRICT,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','estorno')),
  quantidade NUMERIC(12,3) NOT NULL CHECK (quantidade > 0),
  referencia_id UUID,
  observacao TEXT,
  criado_por UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdv_estoque_hotel_produto ON public.pdv_estoque(hotel_id, produto_id);
CREATE INDEX IF NOT EXISTS idx_pdv_estoque_movimentos_produto ON public.pdv_estoque_movimentos(hotel_id, produto_id, criado_em);

ALTER TABLE public.pdv_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_estoque_movimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pdv_estoque_hotel_access ON public.pdv_estoque;
CREATE POLICY pdv_estoque_hotel_access ON public.pdv_estoque
FOR ALL TO authenticated USING (public.usuario_pode_hotel(hotel_id)) WITH CHECK (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS pdv_estoque_movimentos_hotel_access ON public.pdv_estoque_movimentos;
CREATE POLICY pdv_estoque_movimentos_hotel_access ON public.pdv_estoque_movimentos
FOR ALL TO authenticated USING (public.usuario_pode_hotel(hotel_id)) WITH CHECK (public.usuario_pode_hotel(hotel_id));

CREATE OR REPLACE FUNCTION public.baixar_estoque_pedido_pdv(p_pedido_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pedido public.pdv_pedidos%ROWTYPE;
  v_item RECORD;
  v_saldo NUMERIC(12,3);
BEGIN
  SELECT * INTO v_pedido FROM public.pdv_pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF NOT public.usuario_pode_hotel(v_pedido.hotel_id) THEN RAISE EXCEPTION 'Usuário sem acesso ao hotel'; END IF;
  IF v_pedido.status NOT IN ('entregue','fechado') THEN RAISE EXCEPTION 'Somente pedido entregue ou fechado pode baixar estoque'; END IF;

  FOR v_item IN
    SELECT i.produto_id, i.quantidade
    FROM public.pdv_itens_pedido i
    WHERE i.pedido_id = v_pedido.id
  LOOP
    INSERT INTO public.pdv_estoque (hotel_id, produto_id, quantidade)
    VALUES (v_pedido.hotel_id, v_item.produto_id, 0)
    ON CONFLICT (hotel_id, produto_id) DO NOTHING;

    SELECT quantidade INTO v_saldo
    FROM public.pdv_estoque
    WHERE hotel_id = v_pedido.hotel_id AND produto_id = v_item.produto_id
    FOR UPDATE;

    IF v_saldo < v_item.quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %', v_item.produto_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.pdv_estoque_movimentos m
      WHERE m.hotel_id = v_pedido.hotel_id AND m.produto_id = v_item.produto_id
        AND m.tipo = 'saida' AND m.referencia_id = v_pedido.id
    ) THEN
      CONTINUE;
    END IF;

    UPDATE public.pdv_estoque
    SET quantidade = quantidade - v_item.quantidade, atualizado_em = NOW()
    WHERE hotel_id = v_pedido.hotel_id AND produto_id = v_item.produto_id;

    INSERT INTO public.pdv_estoque_movimentos
      (hotel_id, produto_id, tipo, quantidade, referencia_id, observacao, criado_por)
    VALUES
      (v_pedido.hotel_id, v_item.produto_id, 'saida', v_item.quantidade, v_pedido.id, 'Baixa do pedido PDV', auth.uid());
  END LOOP;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.baixar_estoque_pedido_pdv(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.baixar_estoque_pedido_pdv(UUID) TO authenticated;
