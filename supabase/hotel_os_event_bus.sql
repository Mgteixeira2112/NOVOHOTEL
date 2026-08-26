-- Hotel OS: event bus, workflow and operational task persistence.
-- Execute after the existing PMS schema.

create table if not exists public.hotel_os_events (
  id text primary key,
  hotel_id text,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'hotel-os',
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_os_tasks (
  id text primary key,
  hotel_id text,
  title text not null,
  department text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','blocked','done','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  assignee_id text,
  source_event_id text references public.hotel_os_events(id) on delete set null,
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_os_workflows (
  id text primary key,
  hotel_id text,
  name text not null,
  active boolean not null default true,
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  action_config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  run_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_events_type_created on public.hotel_os_events(event_type, created_at desc);
create index if not exists idx_hotel_os_events_aggregate on public.hotel_os_events(aggregate_type, aggregate_id);
create index if not exists idx_hotel_os_tasks_department_status on public.hotel_os_tasks(department, status, priority);
create index if not exists idx_hotel_os_tasks_assignee on public.hotel_os_tasks(assignee_id, status);
create index if not exists idx_hotel_os_workflows_active on public.hotel_os_workflows(active, trigger_type);

alter table public.hotel_os_events enable row level security;
alter table public.hotel_os_tasks enable row level security;
alter table public.hotel_os_workflows enable row level security;

drop policy if exists "hotel_os_events_access" on public.hotel_os_events;
create policy "hotel_os_events_access" on public.hotel_os_events for all using (true) with check (true);

drop policy if exists "hotel_os_tasks_access" on public.hotel_os_tasks;
create policy "hotel_os_tasks_access" on public.hotel_os_tasks for all using (true) with check (true);

drop policy if exists "hotel_os_workflows_access" on public.hotel_os_workflows;
create policy "hotel_os_workflows_access" on public.hotel_os_workflows for all using (true) with check (true);

create or replace function public.hotel_os_emit_event(
  p_hotel_id text,
  p_event_type text,
  p_aggregate_type text,
  p_aggregate_id text,
  p_payload jsonb default '{}'::jsonb,
  p_source text default 'hotel-os'
) returns public.hotel_os_events
language plpgsql
security invoker
as $$
declare v_event public.hotel_os_events;
begin
  insert into public.hotel_os_events(id, hotel_id, event_type, aggregate_type, aggregate_id, payload, source)
  values ('evt_' || extract(epoch from clock_timestamp())::bigint || '_' || substr(md5(random()::text), 1, 8), p_hotel_id, p_event_type, p_aggregate_type, p_aggregate_id, coalesce(p_payload, '{}'::jsonb), coalesce(p_source, 'hotel-os'))
  returning * into v_event;
  return v_event;
end;
$$;
