-- FIX KANBAN REALTIME — compatibilidade com o modelo de autenticação atual
-- A aplicação usa autenticação própria no HotelContext e não estabelece sessão Supabase Auth.
-- A policy anterior restrita a `authenticated` fazia UPDATE ... SELECT não retornar a linha,
-- provocava rollback visual e impedia leitura/reconciliação/Realtime para o cliente anon.

alter table public.kanban_cards enable row level security;
alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;

drop policy if exists kanban_cards_realtime_select on public.kanban_cards;
drop policy if exists kanban_boards_realtime_select on public.kanban_boards;
drop policy if exists kanban_columns_realtime_select on public.kanban_columns;

drop policy if exists kanban_cards_client_select on public.kanban_cards;
drop policy if exists kanban_boards_client_select on public.kanban_boards;
drop policy if exists kanban_columns_client_select on public.kanban_columns;

-- O filtro de tenant permanece explícito nas consultas do frontend por hotel_id.
-- A autenticação atual da aplicação não usa auth.uid(). Quando a migração para
-- Supabase Auth for concluída, estas policies devem ser substituídas por policies
-- baseadas no usuário autenticado.
create policy kanban_cards_client_select
on public.kanban_cards
for select
to anon, authenticated
using (true);

create policy kanban_boards_client_select
on public.kanban_boards
for select
to anon, authenticated
using (true);

create policy kanban_columns_client_select
on public.kanban_columns
for select
to anon, authenticated
using (true);

alter table public.kanban_cards replica identity full;
alter table public.kanban_boards replica identity full;
alter table public.kanban_columns replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.kanban_cards;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.kanban_boards;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.kanban_columns;
exception when duplicate_object then null;
end $$;
