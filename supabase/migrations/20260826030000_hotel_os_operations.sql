-- Hotel OS: operational event bus, tasks and workflow definitions.
-- Safe migration: creates only new tables and indexes; existing modules remain untouched.

create extension if not exists pgcrypto;

create table if not exists public.hotel_os_events (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid,
  event_type text not null,
  source_module text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_events_hotel_created
  on public.hotel_os_events(hotel_id, created_at desc);
create index if not exists idx_hotel_os_events_type
  on public.hotel_os_events(event_type, created_at desc);

create table if not exists public.hotel_os_tasks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid,
  title text not null,
  description text,
  department text not null default 'operacao',
  status text not null default 'pendente',
  priority text not null default 'normal',
  room_id uuid,
  reservation_id uuid,
  assigned_to uuid,
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_os_tasks_status_check check (status in ('pendente','em_execucao','aguardando','concluida','cancelada')),
  constraint hotel_os_tasks_priority_check check (priority in ('baixa','normal','alta','critica'))
);

create index if not exists idx_hotel_os_tasks_hotel_status
  on public.hotel_os_tasks(hotel_id, status, priority);
create index if not exists idx_hotel_os_tasks_assigned
  on public.hotel_os_tasks(assigned_to, status);

create table if not exists public.hotel_os_workflows (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid,
  name text not null,
  description text,
  trigger_event text not null,
  actions jsonb not null default '[]'::jsonb,
  conditions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  run_count integer not null default 0,
  last_run_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_workflows_trigger
  on public.hotel_os_workflows(hotel_id, trigger_event, active);

create or replace function public.hotel_os_emit_event(
  p_hotel_id uuid,
  p_event_type text,
  p_source_module text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_created_by uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.hotel_os_events
    (hotel_id, event_type, source_module, entity_type, entity_id, payload, created_by)
  values
    (p_hotel_id, p_event_type, p_source_module, p_entity_type, p_entity_id, coalesce(p_payload, '{}'::jsonb), p_created_by)
  returning id into v_id;

  return v_id;
end;
$$;

alter table public.hotel_os_events enable row level security;
alter table public.hotel_os_tasks enable row level security;
alter table public.hotel_os_workflows enable row level security;

-- Authenticated users can read operational data; writes should go through the
-- application/RPC layer as RBAC migration is completed.
drop policy if exists hotel_os_events_read on public.hotel_os_events;
create policy hotel_os_events_read on public.hotel_os_events
  for select to authenticated using (true);

drop policy if exists hotel_os_tasks_read on public.hotel_os_tasks;
create policy hotel_os_tasks_read on public.hotel_os_tasks
  for select to authenticated using (true);

drop policy if exists hotel_os_workflows_read on public.hotel_os_workflows;
create policy hotel_os_workflows_read on public.hotel_os_workflows
  for select to authenticated using (true);
