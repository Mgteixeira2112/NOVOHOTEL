create or replace function public.archive_completed_kanban_cards()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer := 0;
begin
  with last_columns as (
    select distinct on (board_id) board_id, id as column_id
    from public.kanban_columns
    order by board_id, ordem desc
  ), eligible as (
    select c.id
    from public.kanban_cards c
    join last_columns lc on lc.board_id = c.board_id and lc.column_id = c.column_id
    where coalesce(c.is_archived, false) = false
      and c.completed_at is not null
      and c.completed_at <= now() - interval '5 minutes'
    for update skip locked
  ), archived as (
    update public.kanban_cards c
       set is_archived = true,
           deleted_at = coalesce(c.deleted_at, now()),
           deleted_by_user_id = null,
           updated_at = now()
      from eligible e
     where c.id = e.id
     returning c.*
  ), audit as (
    insert into public.kanban_card_events (
      card_id, hotel_id, event_type, user_id, from_value, to_value, metadata, created_at
    )
    select
      a.id,
      a.hotel_id,
      'deleted',
      null,
      jsonb_build_object('is_archived', false, 'completed_at', a.completed_at, 'reason', 'completed_last_column'),
      jsonb_build_object('is_archived', true, 'deleted_at', a.deleted_at, 'reason', 'completed_for_5_minutes'),
      jsonb_build_object('archive_mode', 'auto', 'grace_period_minutes', 5),
      now()
    from archived a
    returning 1
  )
  select count(*) into archived_count from audit;

  return archived_count;
end;
$$;
