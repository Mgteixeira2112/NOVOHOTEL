-- The application currently authenticates users in public.usuarios rather than
-- Supabase Auth. Until a canonical usuario -> hotel membership relation is
-- introduced, the Kanban API needs client access to persist and receive
-- realtime changes. The application always scopes queries by hotel_id.
-- This policy is intentionally temporary and should be replaced by tenant-aware
-- RLS once the authentication/membership contract is migrated to auth.uid().

alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;

 drop policy if exists kanban_boards_realtime_test on public.kanban_boards;
 drop policy if exists kanban_columns_realtime_test on public.kanban_columns;
 drop policy if exists kanban_cards_realtime_test on public.kanban_cards;

create policy kanban_boards_client_access
  on public.kanban_boards
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy kanban_columns_client_access
  on public.kanban_columns
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy kanban_cards_client_access
  on public.kanban_cards
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.kanban_boards to anon, authenticated;
grant select, insert, update, delete on public.kanban_columns to anon, authenticated;
grant select, insert, update, delete on public.kanban_cards to anon, authenticated;
