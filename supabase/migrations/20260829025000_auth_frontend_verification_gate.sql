alter table public.usuarios
  add column if not exists auth_frontend_verified_at timestamptz;

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
  v_verified integer;
  v_missing integer;
  v_unverified integer;
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

  select count(*) into v_verified
  from public.usuarios u
  join auth.users au on au.id=u.auth_user_id
  where coalesce(u.ativo,true)=true
    and au.email is not null
    and lower(trim(au.email))=lower(trim(u.email))
    and u.auth_frontend_verified_at is not null;

  select frontend_cutover_enabled into v_cutover
  from public.hotel_os_auth_rollout
  where id=1;

  v_missing:=greatest(v_active-v_linked,0);
  v_unverified:=greatest(v_active-v_verified,0);

  return jsonb_build_object(
    'activeUsers',v_active,
    'linkedUsers',v_linked,
    'frontendVerifiedUsers',v_verified,
    'missingUsers',v_missing,
    'unverifiedUsers',v_unverified,
    'coverageComplete',v_active>0 and v_missing=0,
    'frontendVerificationComplete',v_active>0 and v_unverified=0,
    'frontendCutoverEnabled',coalesce(v_cutover,false),
    'readyForRls',v_active>0 and v_missing=0 and v_unverified=0 and coalesce(v_cutover,false)
  );
end; $$;

comment on column public.usuarios.auth_frontend_verified_at is
  'Set only after a successful Supabase Auth session is established through the PMS frontend bridge after local password + 2FA validation.';
