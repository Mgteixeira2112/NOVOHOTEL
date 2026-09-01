-- Encerramento / RBAC
-- Torna auth.uid() a única origem de identidade da equipe sem criar um sistema paralelo.

create or replace function public.hotel_os_current_user_profile()
returns table (
  id text,
  nome text,
  email text,
  tipo_usuario text,
  cargo_titulo text,
  telefone text,
  ativo boolean,
  avatar text,
  ultimo_acesso timestamptz,
  permissoes text[],
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.nome, u.email, u.tipo_usuario, u.cargo_titulo, u.telefone,
         u.ativo, u.avatar, u.ultimo_acesso, u.permissoes, u.created_at
    from public.usuarios u
   where u.auth_user_id = auth.uid()
     and coalesce(u.ativo, true) = true
   limit 1;
$$;

revoke all on function public.hotel_os_current_user_profile() from public;
grant execute on function public.hotel_os_current_user_profile() to authenticated;

drop policy if exists "Acesso Total Anon usuarios" on public.usuarios;
drop policy if exists "Permitir acesso completo usuarios" on public.usuarios;
drop policy if exists usuarios_self_or_manager_select on public.usuarios;
drop policy if exists usuarios_self_or_manager_insert on public.usuarios;
drop policy if exists usuarios_self_or_manager_update on public.usuarios;
drop policy if exists usuarios_manager_delete on public.usuarios;

create policy usuarios_self_or_manager_select
  on public.usuarios for select to authenticated
  using (auth_user_id = auth.uid() or public.hotel_os_is_manager());

create policy usuarios_self_or_manager_insert
  on public.usuarios for insert to authenticated
  with check (public.hotel_os_is_manager());

create policy usuarios_self_or_manager_update
  on public.usuarios for update to authenticated
  using (auth_user_id = auth.uid() or public.hotel_os_is_manager())
  with check (auth_user_id = auth.uid() or public.hotel_os_is_manager());

create policy usuarios_manager_delete
  on public.usuarios for delete to authenticated
  using (public.hotel_os_is_manager());

revoke all on table public.usuarios from anon;
grant select, insert, update, delete on table public.usuarios to authenticated;
