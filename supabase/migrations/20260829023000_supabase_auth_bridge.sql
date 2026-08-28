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

revoke all on function public.hotel_os_current_user_id() from public;
revoke all on function public.hotel_os_current_user_role() from public;
revoke all on function public.hotel_os_is_authenticated_staff() from public;
revoke all on function public.hotel_os_is_manager() from public;
grant execute on function public.hotel_os_current_user_id() to authenticated;
grant execute on function public.hotel_os_current_user_role() to authenticated;
grant execute on function public.hotel_os_is_authenticated_staff() to authenticated;
grant execute on function public.hotel_os_is_manager() to authenticated;

comment on column public.usuarios.auth_user_id is
  'Identity link to auth.users. Legacy senha is cleared by auth-migrate-user after first successful migration.';
