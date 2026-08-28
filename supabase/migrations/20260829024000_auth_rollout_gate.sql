create table if not exists public.hotel_os_auth_rollout (
  id smallint primary key default 1 check (id=1),
  frontend_cutover_enabled boolean not null default false,
  bootstrap_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.hotel_os_auth_rollout(id,frontend_cutover_enabled)
values(1,false)
on conflict(id) do nothing;

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
  v_cutover boolean;
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

  select frontend_cutover_enabled into v_cutover
  from public.hotel_os_auth_rollout
  where id=1;

  v_missing:=greatest(v_active-v_linked,0);

  return jsonb_build_object(
    'activeUsers',v_active,
    'linkedUsers',v_linked,
    'missingUsers',v_missing,
    'coverageComplete',v_active>0 and v_missing=0,
    'frontendCutoverEnabled',coalesce(v_cutover,false),
    'readyForRls',v_active>0 and v_missing=0 and coalesce(v_cutover,false)
  );
end; $$;

create or replace function public.hotel_os_assert_auth_migration_ready()
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_status jsonb;
begin
  v_status:=public.hotel_os_auth_migration_status();
  if not coalesce((v_status->>'readyForRls')::boolean,false) then
    raise exception 'AUTH_CUTOVER_NOT_READY: %',v_status::text;
  end if;
end; $$;

revoke all on table public.hotel_os_auth_rollout from anon,authenticated;
revoke all on function public.hotel_os_assert_auth_migration_ready() from public;

comment on table public.hotel_os_auth_rollout is
  'Safety gate for Supabase Auth rollout. RLS cutover remains blocked until all active users are linked and frontend_cutover_enabled is explicitly enabled.';
