-- Realtime do Kanban: garantir que as alterações operacionais sejam publicadas pelo PostgreSQL.
-- Idempotente: pode ser aplicado mais de uma vez sem duplicar tabelas na publication.

alter table public.kanban_cards replica identity full;
alter table public.kanban_boards replica identity full;
alter table public.kanban_columns replica identity full;

do $$
begin
  if to_regclass('public.kanban_cards') is not null
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'kanban_cards'
     ) then
    alter publication supabase_realtime add table public.kanban_cards;
  end if;

  if to_regclass('public.kanban_boards') is not null
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'kanban_boards'
     ) then
    alter publication supabase_realtime add table public.kanban_boards;
  end if;

  if to_regclass('public.kanban_columns') is not null
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'kanban_columns'
     ) then
    alter publication supabase_realtime add table public.kanban_columns;
  end if;
end $$;
