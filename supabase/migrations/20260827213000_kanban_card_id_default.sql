-- Gera o id de novos cards no PostgreSQL para que o cliente possa inserir
-- sem fabricar identificadores locais. O registro persistido é então
-- publicado pelo Supabase Realtime para os demais usuários.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.kanban_cards
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.kanban_cards REPLICA IDENTITY FULL;
