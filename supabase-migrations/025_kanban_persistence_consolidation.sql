-- HOTEL OS: Consolidação de Persistência do Kanban Operacional
-- Migration 025: Suporte a identificadores flexíveis, vínculo com reservas/quartos e auditoria

-- 1. Criação/Ajuste das tabelas com tipos compatíveis para identificadores operacionais
CREATE TABLE IF NOT EXISTS public.kanban_boards (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  departamento TEXT NOT NULL,
  descricao TEXT,
  icon_name TEXT DEFAULT 'Layers',
  default_sla_minutes INTEGER DEFAULT 30,
  allowed_roles_manage TEXT[] DEFAULT '{"admin","gerente"}',
  allowed_roles_view TEXT[] DEFAULT '{"todas"}',
  ativo BOOLEAN NOT NULL DEFAULT true,
  configuracao JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  wip_limit INTEGER,
  is_final BOOLEAN DEFAULT false,
  is_in_progress BOOLEAN DEFAULT false,
  is_delegated BOOLEAN DEFAULT false,
  configuracao JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  column_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Geral',
  prioridade TEXT NOT NULL DEFAULT 'normal',
  ordem NUMERIC NOT NULL DEFAULT 0,
  departamento TEXT,
  room_number TEXT,
  guest_name TEXT,
  reservation_id TEXT,
  sla_target_minutes INTEGER DEFAULT 30,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to JSONB,
  origin_department TEXT,
  delegated_to_department TEXT,
  order_items JSONB DEFAULT '[]'::jsonb,
  service_details JSONB DEFAULT '[]'::jsonb,
  summary_category TEXT,
  amount NUMERIC(10,2),
  tags TEXT[] DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de alta performance e isolamento de tenant
CREATE INDEX IF NOT EXISTS idx_kanban_boards_hotel_txt ON public.kanban_boards(hotel_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_txt ON public.kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_hotel_txt ON public.kanban_cards(hotel_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_board_col_txt ON public.kanban_cards(board_id, column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_room_txt ON public.kanban_cards(room_number);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_res_txt ON public.kanban_cards(reservation_id);

-- 3. Habilitação de RLS
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS seguras
DROP POLICY IF EXISTS "kanban_boards_all_tenant" ON public.kanban_boards;
CREATE POLICY "kanban_boards_all_tenant" ON public.kanban_boards
  FOR ALL TO authenticated
  USING (public.usuario_pode_hotel(hotel_id::uuid) OR hotel_id = 'default_hotel')
  WITH CHECK (public.usuario_pode_hotel(hotel_id::uuid) OR hotel_id = 'default_hotel');

DROP POLICY IF EXISTS "kanban_columns_all_tenant" ON public.kanban_columns;
CREATE POLICY "kanban_columns_all_tenant" ON public.kanban_columns
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kanban_cards_all_tenant" ON public.kanban_cards;
CREATE POLICY "kanban_cards_all_tenant" ON public.kanban_cards
  FOR ALL TO authenticated
  USING (public.usuario_pode_hotel(hotel_id::uuid) OR hotel_id = 'default_hotel')
  WITH CHECK (public.usuario_pode_hotel(hotel_id::uuid) OR hotel_id = 'default_hotel');
