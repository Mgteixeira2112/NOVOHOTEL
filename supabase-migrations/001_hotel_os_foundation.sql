-- HOTEL OS — FASES 1/3/13: fundação de segurança, multi-hotel e quartos
-- IMPORTANTE: executar em staging antes de produção.
-- Esta migration é aditiva e não substitui as policies legadas automaticamente.
-- A remoção das policies permissivas deve ocorrer somente após a migração da autenticação.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.organizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hoteis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  moeda TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_hoteis_organizacao_slug UNIQUE (organizacao_id, slug)
);

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS organizacao_id UUID;

ALTER TABLE public.hotel_config ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.tipos_quarto ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.quartos ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.hospedes ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.bloqueios ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.automacoes ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE public.logs_seguranca ADD COLUMN IF NOT EXISTS hotel_id UUID;

CREATE TABLE IF NOT EXISTS public.quarto_camas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarto_id TEXT NOT NULL REFERENCES public.quartos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('king','queen','casal','solteiro','beliche','sofa_cama','berco','outro')),
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hoteis_organizacao ON public.hoteis(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_hotel ON public.usuarios(hotel_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacao ON public.usuarios(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_quartos_hotel ON public.quartos(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tipos_quarto_hotel ON public.tipos_quarto(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hospedes_hotel ON public.hospedes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservas_hotel ON public.reservas(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservas_quarto_periodo ON public.reservas(quarto_id, checkin, checkout);
CREATE INDEX IF NOT EXISTS idx_pagamentos_hotel ON public.pagamentos(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_quarto_periodo ON public.bloqueios(quarto_id, data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_quarto_camas_quarto ON public.quarto_camas(quarto_id);

-- Não armazenar novas senhas na tabela de usuários.
-- A autenticação deverá migrar para Supabase Auth; a coluna senha será removida
-- somente depois de todas as telas deixarem de depender dela.

ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hoteis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarto_camas ENABLE ROW LEVEL SECURITY;

-- Policies de transição: nenhum acesso público de escrita é criado aqui.
-- A camada de autenticação/RBAC deverá criar policies por organização/hotel.

COMMENT ON TABLE public.organizacoes IS 'Tenant raiz do HOTEL OS.';
COMMENT ON TABLE public.hoteis IS 'Unidades hoteleiras pertencentes a uma organização.';
COMMENT ON TABLE public.quarto_camas IS 'Composição estruturada de camas de cada quarto para busca inteligente.';
