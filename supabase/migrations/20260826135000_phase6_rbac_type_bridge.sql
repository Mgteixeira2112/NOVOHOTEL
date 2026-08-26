-- FASE 6 — compatibilidade de tipos do RBAC legado.
create or replace function public.hotel_os_has_permission(p_hotel_id uuid,p_permission text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from public.hotel_memberships m
   join public.hotel_roles r on r.hotel_id=p_hotel_id::text and r.slug=m.role
   join public.hotel_role_permissions rp on rp.role_id=r.id
   join public.hotel_permissions p on p.id=rp.permission_id and p.key=p_permission
   where m.user_id=auth.uid() and m.hotel_id=p_hotel_id::text and m.active=true
 ) or exists(
   select 1 from public.usuarios u
   where u.auth_user_id=auth.uid() and u.ativo=true
     and (u.hotel_id=p_hotel_id or u.papel_rbac='SUPER_ADMIN')
     and coalesce((u.permissoes_json->>p_permission)::boolean,false)
 );
$$;
revoke all on function public.hotel_os_has_permission(uuid,text) from public;
grant execute on function public.hotel_os_has_permission(uuid,text) to authenticated;
