create table if not exists public.workspace_engine_configs (
  hotel_id text not null,
  workspace_id text not null,
  definition jsonb not null default '{}'::jsonb,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (hotel_id, workspace_id)
);

create index if not exists workspace_engine_configs_hotel_idx
  on public.workspace_engine_configs (hotel_id);

alter table public.workspace_engine_configs enable row level security;

-- Compatibility policy: the application currently uses the publishable client
-- and its hotel/user authorization is still being migrated to server-enforced RLS.
-- Keep this table compatible with that baseline; tighten with current_user_hotel_id()
-- when the broader authenticated RLS cutover is complete.
drop policy if exists workspace_engine_configs_select_compat on public.workspace_engine_configs;
create policy workspace_engine_configs_select_compat
  on public.workspace_engine_configs for select
  using (true);

drop policy if exists workspace_engine_configs_insert_compat on public.workspace_engine_configs;
create policy workspace_engine_configs_insert_compat
  on public.workspace_engine_configs for insert
  with check (true);

drop policy if exists workspace_engine_configs_update_compat on public.workspace_engine_configs;
create policy workspace_engine_configs_update_compat
  on public.workspace_engine_configs for update
  using (true)
  with check (true);

drop policy if exists workspace_engine_configs_delete_compat on public.workspace_engine_configs;
create policy workspace_engine_configs_delete_compat
  on public.workspace_engine_configs for delete
  using (true);
