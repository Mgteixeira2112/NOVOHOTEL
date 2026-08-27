-- Permissões mínimas para que Supabase Realtime possa entregar mudanças do Kanban
-- somente aos usuários que possuem acesso ao hotel correspondente.

alter table public.kanban_cards enable row level security;
alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;

drop policy if exists kanban_cards_realtime_select on public.kanban_cards;
create policy kanban_cards_realtime_select
on public.kanban_cards
for select
to authenticated
using (
  hotel_id is not null
  and public.usuario_pode_hotel(hotel_id)
);

drop policy if exists kanban_boards_realtime_select on public.kanban_boards;
create policy kanban_boards_realtime_select
on public.kanban_boards
for select
to authenticated
using (
  hotel_id is not null
  and public.usuario_pode_hotel(hotel_id)
);

drop policy if exists kanban_columns_realtime_select on public.kanban_columns;
create policy kanban_columns_realtime_select
on public.kanban_columns
for select
to authenticated
using (
  exists (
    select 1
    from public.kanban_boards b
    where b.id = kanban_columns.board_id
      and b.hotel_id is not null
      and public.usuario_pode_hotel(b.hotel_id)
  )
);
