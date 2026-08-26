-- HOTEL OS — FASE 16: PDV + TABLET
-- Migration aditiva. Validar contra o schema atual antes de produção.

CREATE TABLE IF NOT EXISTS public.pdv_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hoteis(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT,
  preco NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (preco >= 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  controla_estoque BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdv_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT REFERENCES public.quartos(id) ON DELETE SET NULL,
  usuario_id UUID,
  dispositivo_id UUID,
  status TEXT NOT NULL DEFAULT 'recebido' CHECK (status IN ('rascunho','recebido','em_preparo','pronto','entregue','cancelado','fechado')),
  origem TEXT NOT NULL DEFAULT 'pdv' CHECK (origem IN ('pdv','tablet_quarto','recepcao','room_service','outro')),
  observacao TEXT,
  total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.pdv_pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pdv_pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.pdv_produtos(id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(12,2) NOT NULL CHECK (preco_unitario >= 0),
  observacao TEXT,
  total NUMERIC(12,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

CREATE TABLE IF NOT EXISTS public.pdv_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pdv_pedidos(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES public.hoteis(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL CHECK (metodo IN ('dinheiro','pix','cartao_credito','cartao_debito','conta_quarto','outro')),
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','cancelado','estornado')),
  referencia_externa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tablet_dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT REFERENCES public.quartos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  device_key_hash TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tablet_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id UUID NOT NULL REFERENCES public.tablet_dispositivos(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES public.hoteis(id) ON DELETE CASCADE,
  quarto_id TEXT REFERENCES public.quartos(id) ON DELETE CASCADE,
  reserva_id TEXT REFERENCES public.reservas(id) ON DELETE SET NULL,
  inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fim TIMESTAMPTZ,
  ativa BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.pdv_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdv_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablet_dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tablet_sessoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pdv_produtos_hotel ON public.pdv_produtos(hotel_id);
CREATE INDEX IF NOT EXISTS idx_pdv_pedidos_hotel_status ON public.pdv_pedidos(hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_pdv_pedidos_quarto ON public.pdv_pedidos(quarto_id);
CREATE INDEX IF NOT EXISTS idx_pdv_itens_pedido ON public.pdv_pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pdv_pagamentos_pedido ON public.pdv_pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_tablet_dispositivos_hotel_quarto ON public.tablet_dispositivos(hotel_id, quarto_id);
CREATE INDEX IF NOT EXISTS idx_tablet_sessoes_ativas ON public.tablet_sessoes(hotel_id, quarto_id, ativa);
