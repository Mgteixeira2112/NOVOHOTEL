-- ============================================================
-- 025 - KANBAN SCHEMA CONTRACT FIX
-- SITE-PARA-HOTEIS
--
-- The existing Kanban tables were created with UUID identifiers,
-- while the application contract uses stable text identifiers
-- such as recepcao, rec_atendimento and card_rec_1.
-- hotel_config.id and usuarios.id are also text in this project.
--
-- The three Kanban tables are currently empty, so they can be
-- recreated safely to match the actual frontend mapper.
-- ============================================================

BEGIN;

-- Remove the empty Kanban tables from Realtime before recreation.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.kanban_cards;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_columns'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.kanban_columns;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.kanban_boards;
  END IF;
END $$;

DROP TABLE IF EXISTS public.kanban_cards CASCADE;
DROP TABLE IF EXISTS public.kanban_columns CASCADE;
DROP TABLE IF EXISTS public.kanban_boards CASCADE;

-- ============================================================
-- BOARDS
-- ============================================================

CREATE TABLE public.kanban_boards (
  id text PRIMARY KEY,
  hotel_id text NOT NULL,
  nome text NOT NULL,
  departamento text NOT NULL,
  descricao text,
  icon_name text,
  default_sla_minutes integer NOT NULL DEFAULT 60,
  allowed_roles_manage jsonb NOT NULL DEFAULT '["admin", "gerente"]'::jsonb,
  allowed_roles_view jsonb NOT NULL DEFAULT '["todas"]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_custom boolean NOT NULL DEFAULT false,
  criado_por text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- COLUMNS
-- ============================================================

CREATE TABLE public.kanban_columns (
  id text PRIMARY KEY,
  board_id text NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  cor text,
  wip_limit integer,
  is_final boolean NOT NULL DEFAULT false,
  is_in_progress boolean NOT NULL DEFAULT false,
  is_delegated boolean NOT NULL DEFAULT false,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CARDS
-- ============================================================

CREATE TABLE public.kanban_cards (
  id text PRIMARY KEY,
  hotel_id text NOT NULL,
  board_id text NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  column_id text NOT NULL REFERENCES public.kanban_columns(id) ON DELETE RESTRICT,
  titulo text NOT NULL,
  descricao text,
  prioridade text NOT NULL DEFAULT 'normal',
  ordem numeric NOT NULL DEFAULT 0,
  departamento text,
  location text,
  room_number text,
  guest_name text,
  reservation_id text,
  assigned_to jsonb,
  origin_department text,
  delegated_to_department text,
  sla_target_minutes integer NOT NULL DEFAULT 30,
  started_at timestamptz,
  completed_at timestamptz,
  order_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary_category text,
  amount numeric,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_archived boolean NOT NULL DEFAULT false,
  notes text,
  just_created boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_kanban_boards_hotel
  ON public.kanban_boards(hotel_id);

CREATE INDEX idx_kanban_boards_department
  ON public.kanban_boards(departamento);

CREATE INDEX idx_kanban_columns_board_order
  ON public.kanban_columns(board_id, ordem);

CREATE INDEX idx_kanban_cards_hotel_board
  ON public.kanban_cards(hotel_id, board_id);

CREATE INDEX idx_kanban_cards_column_order
  ON public.kanban_cards(column_id, ordem);

CREATE INDEX idx_kanban_cards_updated_at
  ON public.kanban_cards(updated_at);

CREATE INDEX idx_kanban_cards_hotel_archived
  ON public.kanban_cards(hotel_id, is_archived);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY kanban_boards_client_access
  ON public.kanban_boards
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY kanban_columns_client_access
  ON public.kanban_columns
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY kanban_cards_client_access
  ON public.kanban_cards
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.kanban_boards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.kanban_columns TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.kanban_cards TO anon, authenticated;

-- ============================================================
-- REALTIME
-- ============================================================

ALTER TABLE public.kanban_boards REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_columns REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_cards REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_cards;

COMMIT;
