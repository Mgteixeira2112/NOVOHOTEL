-- FIX KANBAN REALTIME — compatibilidade com o modelo de autenticação atual
--
-- O frontend atual usa autenticação própria do HotelContext e NÃO estabelece
-- uma sessão Supabase Auth. A migration 20260827111000_kanban_realtime_rls.sql
-- restringiu SELECT a `authenticated`, fazendo com que:
--   1) UPDATE ... SELECT não retornasse a linha persistida;
--   2) a UI executasse rollback depois do movimento;
--   3) postgres_changes/reconciliation não conseguissem ler os cards;
--   4) os usuários não recebessem sincronização.
--
-- A autenticação/isolamento da aplicação continua sendo controlada pelo
-- hotel_id no frontend e pelas regras existentes. Esta migration restaura
-- explicitamente a política de leitura compatível com o cliente anon atual.
-- Quando o projeto migrar integralmente para Supabase Auth, estas políticas
-- devem ser substituídas por políticas baseadas em auth.uid().

alter table public.kanban_cards enable row level security;
alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;

-- Remove a política incompatível que só permitia SELECT para usuários
-- autenticados pelo Supabase Auth.
drop policy if exists kanban_cards_realtime_select on public.kanban_cards;
drop policy if exists kanban_boards_realtime_select on public.kanban_boards;
drop policy if exists kanban_columns_realtime_select on public.kanban_columns;

-- O projeto utiliza autenticação própria no momento. O filtro por hotel_id
-- continua sendo aplicado em todas as consultas do Kanban.
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

-- Garante que o Realtime tenha payload completo.
alter table public.kanban_cards replica identity full;
alter table public.kanban_boards replica identity full;
alter table public.kanban_columns replica identity full;

-- Garante a publicação mesmo se o ambiente Supabase ainda não tiver as
-- tabelas adicionadas à publicação.
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
