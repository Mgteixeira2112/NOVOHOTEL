-- Dashboard Engine v1 — múltiplos dashboards personalizados por hotel.
-- Não substitui as métricas existentes; apenas compõe visualizações sobre fontes autorizadas.

create extension if not exists pgcrypto;

create table if not exists public.hotel_os_dashboards (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  name text not null,
  slug text not null,
  scope text not null default 'PERSONAL' check (scope in ('PERSONAL','ROLE','HOTEL')),
  owner_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text,
  is_default boolean not null default false,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(hotel_id,owner_user_id,slug)
);

create table if not exists public.hotel_os_dashboard_blocks (
  id uuid primary key default gen_random_uuid(),
  dashboard_id uuid not null references public.hotel_os_dashboards(id) on delete cascade,
  block_type text not null check (block_type in ('kpi','chart','table','alert','ranking','progress')),
  metric_key text not null,
  title text,
  position_x integer not null default 0 check (position_x >= 0),
  position_y integer not null default 0 check (position_y >= 0),
  width integer not null default 4 check (width between 1 and 12),
  height integer not null default 2 check (height between 1 and 12),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_dashboards_hotel_scope
  on public.hotel_os_dashboards(hotel_id,scope,is_default,name);
create index if not exists idx_hotel_os_dashboard_blocks_dashboard_position
  on public.hotel_os_dashboard_blocks(dashboard_id,position_y,position_x);
create index if not exists idx_hotel_os_dashboard_blocks_metric
  on public.hotel_os_dashboard_blocks(metric_key);

alter table public.hotel_os_dashboards enable row level security;
alter table public.hotel_os_dashboard_blocks enable row level security;

drop policy if exists dashboard_engine_read on public.hotel_os_dashboards;
create policy dashboard_engine_read on public.hotel_os_dashboards
for select to authenticated
using (
  public.usuario_pode_hotel(hotel_id)
  and (scope <> 'PERSONAL' or owner_user_id = auth.uid())
);

drop policy if exists dashboard_engine_insert on public.hotel_os_dashboards;
create policy dashboard_engine_insert on public.hotel_os_dashboards
for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and public.usuario_pode_hotel(hotel_id)
);

drop policy if exists dashboard_engine_update on public.hotel_os_dashboards;
create policy dashboard_engine_update on public.hotel_os_dashboards
for update to authenticated
using (owner_user_id = auth.uid() and public.usuario_pode_hotel(hotel_id))
with check (owner_user_id = auth.uid() and public.usuario_pode_hotel(hotel_id));

drop policy if exists dashboard_engine_delete on public.hotel_os_dashboards;
create policy dashboard_engine_delete on public.hotel_os_dashboards
for delete to authenticated
using (owner_user_id = auth.uid() and public.usuario_pode_hotel(hotel_id));

drop policy if exists dashboard_blocks_read on public.hotel_os_dashboard_blocks;
create policy dashboard_blocks_read on public.hotel_os_dashboard_blocks
for select to authenticated
using (
  exists (
    select 1
    from public.hotel_os_dashboards d
    where d.id = dashboard_id
      and public.usuario_pode_hotel(d.hotel_id)
      and (d.scope <> 'PERSONAL' or d.owner_user_id = auth.uid())
  )
);

drop policy if exists dashboard_blocks_write on public.hotel_os_dashboard_blocks;
create policy dashboard_blocks_write on public.hotel_os_dashboard_blocks
for all to authenticated
using (
  exists (
    select 1 from public.hotel_os_dashboards d
    where d.id = dashboard_id
      and d.owner_user_id = auth.uid()
      and public.usuario_pode_hotel(d.hotel_id)
  )
)
with check (
  exists (
    select 1 from public.hotel_os_dashboards d
    where d.id = dashboard_id
      and d.owner_user_id = auth.uid()
      and public.usuario_pode_hotel(d.hotel_id)
  )
);

create or replace function public.hotel_os_touch_dashboard_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_dashboards_updated_at on public.hotel_os_dashboards;
create trigger trg_hotel_os_dashboards_updated_at
before update on public.hotel_os_dashboards
for each row execute function public.hotel_os_touch_dashboard_updated_at();

drop trigger if exists trg_hotel_os_dashboard_blocks_updated_at on public.hotel_os_dashboard_blocks;
create trigger trg_hotel_os_dashboard_blocks_updated_at
before update on public.hotel_os_dashboard_blocks
for each row execute function public.hotel_os_touch_dashboard_updated_at();
