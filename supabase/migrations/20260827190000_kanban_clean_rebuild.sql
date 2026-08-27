-- KANBAN V2 - REBUILD LIMPO
-- ATENÇÃO: migration destrutiva SOMENTE para o módulo Kanban.
-- As demais tabelas do PMS não são alteradas.

DROP TABLE IF EXISTS public.kanban_cards CASCADE;
DROP TABLE IF EXISTS public.kanban_columns CASCADE;
DROP TABLE IF EXISTS public.kanban_boards CASCADE;

CREATE TABLE public.kanban_boards (
  id text PRIMARY KEY,
  hotel_id text NOT NULL,
  nome text NOT NULL,
  departamento text NOT NULL DEFAULT 'operacao',
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_por text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kanban_columns (
  id text PRIMARY KEY,
  board_id text NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  configuracao jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

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
  room_number text,
  location text,
  assigned_to jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_archived boolean NOT NULL DEFAULT false,
  guest_name text,
  reservation_id text,
  service_details text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text
);

CREATE INDEX kanban_boards_hotel_idx ON public.kanban_boards(hotel_id);
CREATE INDEX kanban_columns_board_idx ON public.kanban_columns(board_id, ordem);
CREATE INDEX kanban_cards_hotel_board_idx ON public.kanban_cards(hotel_id, board_id, is_archived);
CREATE INDEX kanban_cards_column_order_idx ON public.kanban_cards(column_id, ordem);
CREATE INDEX kanban_cards_updated_idx ON public.kanban_cards(updated_at);

CREATE OR REPLACE FUNCTION public.kanban_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER kanban_boards_touch_updated_at
BEFORE UPDATE ON public.kanban_boards
FOR EACH ROW EXECUTE FUNCTION public.kanban_touch_updated_at();

CREATE TRIGGER kanban_columns_touch_updated_at
BEFORE UPDATE ON public.kanban_columns
FOR EACH ROW EXECUTE FUNCTION public.kanban_touch_updated_at();

CREATE TRIGGER kanban_cards_touch_updated_at
BEFORE UPDATE ON public.kanban_cards
FOR EACH ROW EXECUTE FUNCTION public.kanban_touch_updated_at();

ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_boards_client_access ON public.kanban_boards;
DROP POLICY IF EXISTS kanban_columns_client_access ON public.kanban_columns;
DROP POLICY IF EXISTS kanban_cards_client_access ON public.kanban_cards;

CREATE POLICY kanban_boards_client_access
ON public.kanban_boards FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY kanban_columns_client_access
ON public.kanban_columns FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY kanban_cards_client_access
ON public.kanban_cards FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

ALTER TABLE public.kanban_boards REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_columns REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_cards REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_boards;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_columns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_columns;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_cards;
  END IF;
END $$;
