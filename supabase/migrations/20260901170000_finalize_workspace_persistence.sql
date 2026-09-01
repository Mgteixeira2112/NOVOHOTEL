-- Encerramento / Persistência
-- Confirma workspace_engine_configs como fonte persistente e mantém localStorage apenas como cache.

drop policy if exists workspace_engine_configs_select_compat on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_insert_compat on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_update_compat on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_delete_compat on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_staff_select on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_manager_insert on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_manager_update on public.workspace_engine_configs;
drop policy if exists workspace_engine_configs_manager_delete on public.workspace_engine_configs;

create policy workspace_engine_configs_staff_select
  on public.workspace_engine_configs for select to authenticated
  using (public.hotel_os_is_authenticated_staff());

create policy workspace_engine_configs_manager_insert
  on public.workspace_engine_configs for insert to authenticated
  with check (public.hotel_os_is_manager());

create policy workspace_engine_configs_manager_update
  on public.workspace_engine_configs for update to authenticated
  using (public.hotel_os_is_manager())
  with check (public.hotel_os_is_manager());

create policy workspace_engine_configs_manager_delete
  on public.workspace_engine_configs for delete to authenticated
  using (public.hotel_os_is_manager());

revoke all on table public.workspace_engine_configs from anon;
grant select, insert, update, delete on table public.workspace_engine_configs to authenticated;
