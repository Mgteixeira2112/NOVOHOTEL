-- Automatically archive cards that remain in the last column for at least five minutes.
-- The function is safe to run repeatedly and records an audit event only when a card is newly archived.

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
    select distinct on (board_id)
      board_id,
      id as column_id
    from public.kanban_columns
    order by board_id, ordem desc
  ), eligible as (
    select c.id
    from public.kanban_cards c
    join last_columns lc
      on lc.board_id = c.board_id
     and lc.column_id = c.column_id
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
      card_id,
      hotel_id,
      event_type,
      user_id,
      source,
      from_value,
      to_value,
      created_at
    )
    select
      a.id,
      a.hotel_id,
      'deleted',
      null,
      'auto_archive',
      jsonb_build_object(
        'is_archived', false,
        'completed_at', a.completed_at,
        'reason', 'completed_last_column'
      ),
      jsonb_build_object(
        'is_archived', true,
        'deleted_at', a.deleted_at,
        'reason', 'completed_for_5_minutes'
      ),
      now()
    from archived a
    returning 1
  )
  select count(*) into archived_count from audit;

  return archived_count;
end;
$$;

comment on function public.archive_completed_kanban_cards() is
  'Archives active Kanban cards that remain completed in the final board column for at least five minutes.';

-- pg_cron may not be available in every environment. Enable the extension when available,
-- then schedule the function once per minute. The guarded block keeps this migration portable.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when insufficient_privilege or undefined_file then
    raise notice 'pg_cron is unavailable in this environment; archive_completed_kanban_cards() can be scheduled externally.';
  end;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (select 1 from cron.job where jobname = 'kanban-auto-archive-completed') then
      perform cron.schedule(
        'kanban-auto-archive-completed',
        '* * * * *',
        $cron$select public.archive_completed_kanban_cards();$cron$
      );
    end if;
  end if;
end;
$$;
