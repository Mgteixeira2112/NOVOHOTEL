-- HOTEL OS — FASES 8/11/16: PDV, tablet do quarto e reservas inteligentes
-- Executar em STAGING antes de produção.

CREATE TABLE IF NOT EXISTS public.pdv_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral',
  preco NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  controla_estoque BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdv_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT REFERENCES public.quartos(id) ON DELETE SET NULL,
  reserva_id TEXT REFERENCES public.reservas(id) ON DELETE SET NULL,
  origem TEXT NOT NULL DEFAULT 'pdv' CHECK (origem IN ('pdv','tablet_quarto','recepcao','cozinha','outro')),
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('rascunho','recebido','em_preparo','pronto','entregue','cancelado','fechado')),
  observacoes TEXT,
  criado_por UUID,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdv_itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pdv_pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.pdv_produtos(id) ON DELETE RESTRICT,
  quantidade NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(12,2) NOT NULL CHECK (preco_unitario >= 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdv_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pdv_pedidos(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  metodo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','negado','estornado','cancelado')),
  codigo_transacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispositivos_hotel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT REFERENCES public.quartos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('tablet_quarto','pdv','kds','recepcao','outro')),
  nome TEXT NOT NULL,
  device_key_hash TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id, device_key_hash)
);

CREATE TABLE IF NOT EXISTS public.sessoes_tablet_quarto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id UUID NOT NULL REFERENCES public.dispositivos_hotel(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT NOT NULL REFERENCES public.quartos(id) ON DELETE CASCADE,
  reserva_id TEXT REFERENCES public.reservas(id) ON DELETE SET NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  encerrada_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pdv_produtos_hotel_ativo ON public.pdv_produtos(hotel_id, ativo);
CREATE INDEX IF NOT EXISTS idx_pdv_pedidos_hotel_status ON public.pdv_pedidos(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_pdv_pedidos_quarto ON public.pdv_pedidos(quarto_id);
CREATE INDEX IF NOT EXISTS idx_pdv_itens_pedido_pedido ON public.pdv_itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pdv_pagamentos_pedido ON public.pdv_pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_hotel_quarto ON public.dispositivos_hotel(hotel_id, quarto_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_tablet_quarto_ativa ON public.sessoes_tablet_quarto(hotel_id, quarto_id, ativa);

ALTER TABLE public.pdv_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos_hotel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes_tablet_quarto ENABLE ROW LEVEL SECURITY;

-- Busca estruturada de quartos para a reserva online.
CREATE OR REPLACE FUNCTION public.buscar_quartos_disponiveis(
  p_hotel_id UUID,
  p_checkin DATE,
  p_checkout DATE,
  p_hospedes INTEGER DEFAULT 1,
  p_tipo_cama TEXT DEFAULT NULL
)
RETURNS TABLE (
  quarto_id TEXT,
  numero TEXT,
  nome TEXT,
  tipo_quarto_id TEXT,
  capacidade INTEGER,
  valor_diaria NUMERIC,
  camas JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    q.id,
    q.numero,
    q.nome,
    q.tipo_quarto_id,
    q.capacidade,
    q.valor_diaria,
    COALESCE(
      jsonb_agg(jsonb_build_object('tipo', qc.tipo, 'quantidade', qc.quantidade))
        FILTER (WHERE qc.id IS NOT NULL),
      '[]'::jsonb
    ) AS camas
  FROM public.quartos q
  LEFT JOIN public.quarto_camas qc ON qc.quarto_id = q.id
  WHERE q.hotel_id = p_hotel_id
    AND q.ativo = TRUE
    AND q.status = 'disponivel'
    AND q.capacidade >= p_hospedes
    AND (
      p_tipo_cama IS NULL OR EXISTS (
        SELECT 1 FROM public.quarto_camas qcx
        WHERE qcx.quarto_id = q.id AND qcx.tipo = p_tipo_cama
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.hotel_id = p_hotel_id
        AND r.quarto_id = q.id
        AND r.status NOT IN ('cancelada','cancelado')
        AND r.checkin < p_checkout
        AND r.checkout > p_checkin
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.bloqueios b
      WHERE b.hotel_id = p_hotel_id
        AND b.quarto_id = q.id
        AND b.data_inicio < p_checkout
        AND b.data_fim > p_checkin
    )
  GROUP BY q.id, q.numero, q.nome, q.tipo_quarto_id, q.capacidade, q.valor_diaria
  ORDER BY q.capacidade ASC, q.valor_diaria ASC, q.numero ASC;
$$;

COMMENT ON FUNCTION public.buscar_quartos_disponiveis IS 'Base para o buscador online: capacidade, camas estruturadas, bloqueios e conflitos de reserva.';
