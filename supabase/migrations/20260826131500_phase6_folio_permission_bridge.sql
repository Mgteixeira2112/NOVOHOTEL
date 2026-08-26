-- FASE 6 — integração segura com o Folio existente.
-- Evita que o helper legado da FASE 5 contorne o RBAC da FASE 6.

create or replace function public.hotel_os_require_stay_permission(p_hotel_id uuid,p_permission text)
returns void
language plpgsql security definer set search_path=public as $$
declare v_permission text;
begin
  if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;
  v_permission:=case p_permission when 'folio_item_add' then 'pos.create_order' when 'payment' then 'pos.create_order' when 'refund' then 'pos.refund' when 'discount' then 'pos.apply_discount' else p_permission end;
  if not public.hotel_os_has_permission(p_hotel_id,v_permission) then raise exception 'PERMISSION_DENIED:%',v_permission; end if;
end;
$$;
revoke all on function public.hotel_os_require_stay_permission(uuid,text) from public;
grant execute on function public.hotel_os_require_stay_permission(uuid,text) to authenticated;
