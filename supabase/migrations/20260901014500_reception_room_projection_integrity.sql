-- Reception room projection integrity
-- The room is the operational source. The Reception room map owns exactly one
-- active deterministic projection card per room: room-rec-{room_id}.
-- Legacy reservation-derived cards are preserved only as archived history.

-- 1) Archive active non-canonical cards only when the canonical room card exists.
-- This keeps the cleanup safe for any anomalous room that still needs repair.
update public.kanban_cards legacy
   set is_archived = true,
       deleted_at = coalesce(legacy.deleted_at, now()),
       metadata = coalesce(legacy.metadata, '{}'::jsonb) || jsonb_build_object(
         'projection_integrity_cleanup', true,
         'projection_integrity_cleanup_at', now(),
         'superseded_by_card_id', 'room-rec-' || legacy.room_id::text
       ),
       updated_at = now()
 where legacy.board_id = 'kanban-board-recepcao-quartos'
   and legacy.room_id is not null
   and legacy.id <> 'room-rec-' || legacy.room_id::text
   and coalesce(legacy.is_archived, false) = false
   and legacy.deleted_at is null
   and exists (
     select 1
       from public.kanban_cards canonical
      where canonical.id = 'room-rec-' || legacy.room_id::text
        and canonical.board_id = 'kanban-board-recepcao-quartos'
        and canonical.room_id::text = legacy.room_id::text
        and coalesce(canonical.is_archived, false) = false
        and canonical.deleted_at is null
   );

-- 2) Reject any future active Reception room-map card whose identity is not the
-- deterministic room-rec-{room_id} contract.
create or replace function public.enforce_reception_room_projection_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.board_id = 'kanban-board-recepcao-quartos'
     and coalesce(new.is_archived, false) = false
     and new.deleted_at is null then
    if new.room_id is null or btrim(new.room_id::text) = '' then
      raise exception 'Reception room projection requires room_id.';
    end if;

    if new.id <> 'room-rec-' || new.room_id::text then
      raise exception 'Reception room projection must use canonical id room-rec-%%.', new.room_id::text;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_reception_room_projection_identity on public.kanban_cards;
create trigger trg_enforce_reception_room_projection_identity
before insert or update of id, board_id, room_id, is_archived, deleted_at
on public.kanban_cards
for each row execute function public.enforce_reception_room_projection_identity();

-- 3) Enforce at most one active room projection per hotel/room on the Reception board.
create unique index if not exists uq_kanban_cards_active_reception_room
  on public.kanban_cards (hotel_id, room_id)
  where board_id = 'kanban-board-recepcao-quartos'
    and room_id is not null
    and coalesce(is_archived, false) = false
    and deleted_at is null;
