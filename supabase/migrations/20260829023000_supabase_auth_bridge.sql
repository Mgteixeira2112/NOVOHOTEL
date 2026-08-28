-- Supabase Auth bridge for the current single-hotel schema.
-- This migration prepares identity without activating restrictive RLS yet.
-- RLS cutover is intentionally a separate migration after the frontend login adopts this bridge.

alter table public.usuarios
  add column if not exists auth_user_id uuid;

create unique index if not exists uq_usuarios_auth_user_id
  on public.usuarios(auth_user_id)
  where auth_user_id is not null;

create index if not exists idx_usuarios_email_lower
  on public.usuarios(lower(email));

create or replace function public.hotel_os_current_user_id()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select u.id
  from public.usuarios u
  where u.auth_user_id = auth.uid()
    and coalesce(u.ativo,true)=true
  limit 1;
$$;

create or replace function public.hotel_os_current_user_role()
returns text
language sql
stable
security definer
set search_path=public
as $$
  select u.tipo_usuario
  from public.usuarios u
  where u.auth_user_id = auth.uid()
    and coalesce(u.ativo,true)=true
  limit 1;
$$;

create or replace function public.hotel_os_is_authenticated_staff()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select auth.uid() is not null
     and exists(
       select 1
       from public.usuarios u
       where u.auth_user_id=auth.uid()
         and coalesce(u.ativo,true)=true
     );
$$;

create or replace function public.hotel_os_is_manager()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select coalesce(public.hotel_os_current_user_role() in ('admin','gerente'),false);
$$;

-- Operational rollout guard. Restrictive RLS must not be activated while an
-- active employee still lacks a valid auth.users link.
create or replace function public.hotel_os_auth_migration_status()
returns jsonb
language plpgsql
stable
security definer
set search_path=public,auth
as $$
declare
  v_active integer;
  v_linked integer;
  v_missing integer;
begin
  select count(*) into v_active
  from public.usuarios u
  where coalesce(u.ativo,true)=true;

  select count(*) into v_linked
  from public.usuarios u
  join auth.users au on au.id=u.auth_user_id
  where coalesce(u.ativo,true)=true
    and au.email is not null
    and lower(trim(au.email))=lower(trim(u.email));

  v_missing:=greatest(v_active-v_linked,0);

  return jsonb_build_object(
    'activeUsers',v_active,
    'linkedUsers',v_linked,
    'missingUsers',v_missing,
    'readyForRls',v_active>0 and v_missing=0
  );
end; $$;

create or replace function public.hotel_os_assert_auth_migration_ready()
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_status jsonb;
begin
  v_status:=public.hotel_os_auth_migration_status();
  if not coalesce((v_status->>'readyForRls')::boolean,false) then
    raise exception 'AUTH_MIGRATION_INCOMPLETE: % active, % linked, % missing',
      v_status->>'activeUsers',v_status->>'linkedUsers',v_status->>'missingUsers';
  end if;
end; $$;

revoke all on function public.hotel_os_current_user_id() from public;
revoke all on function public.hotel_os_current_user_role() from public;
revoke all on function public.hotel_os_is_authenticated_staff() from public;
revoke all on function public.hotel_os_is_manager() from public;
revoke all on function public.hotel_os_auth_migration_status() from public;
revoke all on function public.hotel_os_assert_auth_migration_ready() from public;
grant execute on function public.hotel_os_current_user_id() to authenticated;
grant execute on function public.hotel_os_current_user_role() to authenticated;
grant execute on function public.hotel_os_is_authenticated_staff() to authenticated;
grant execute on function public.hotel_os_is_manager() to authenticated;
grant execute on function public.hotel_os_auth_migration_status() to authenticated;

comment on column public.usuarios.auth_user_id is
  'Identity link to auth.users. Legacy senha is cleared by auth-migrate-user after first successful migration.';
comment on function public.hotel_os_assert_auth_migration_ready() is
  'Deployment guard: restrictive RLS migrations must call this first and abort unless every active employee is linked to a matching Supabase Auth identity.';
