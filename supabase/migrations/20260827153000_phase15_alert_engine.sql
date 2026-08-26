-- FASE 15 — alertas gerenciais derivados dos dados oficiais
create or replace function public.hotel_os_refresh_dashboard_alerts(p_hotel_id uuid)
returns integer language plpgsql security definer set search_path=public
as $$
declare n integer:=0; v_target numeric; v_current numeric;
begin
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;

 -- Ocupação abaixo da meta: usa a meta ativa do hotel quando configurada.
 select target_value into v_target from public.hotel_os_dashboard_goals where hotel_id=p_hotel_id and metric_code='OCCUPANCY' and active and (valid_from is null or valid_from<=current_date) and (valid_to is null or valid_to>=current_date) order by valid_from desc nulls last limit 1;
 if v_target is not null then
   select (hotel_os_dashboard_metrics(p_hotel_id,current_date,current_date+1)->>'occupancy')::numeric into v_current;
   if v_current<v_target then
     insert into public.hotel_os_dashboard_alerts(organization_id,hotel_id,metric_code,alert_type,severity,title,description,current_value,target_value)
     select h.organization_id,p_hotel_id,'OCCUPANCY','OCCUPANCY_BELOW_TARGET','WARNING','Ocupação abaixo da meta','A ocupação atual está abaixo da meta configurada.',v_current,v_target from public.hoteis h where h.id=p_hotel_id and not exists(select 1 from public.hotel_os_dashboard_alerts a where a.hotel_id=p_hotel_id and a.alert_type='OCCUPANCY_BELOW_TARGET' and a.resolved_at is null);
     n:=n+1;
   end if;
 end if;

 insert into public.hotel_os_dashboard_alerts(organization_id,hotel_id,alert_type,severity,title,description,current_value)
 select h.organization_id,p_hotel_id,'CRITICAL_MAINTENANCE','CRITICAL','Manutenção crítica pendente','Existem tarefas de manutenção urgentes ou críticas ainda não concluídas.',count(*)
 from public.hoteis h join public.hotel_os_tasks t on t.hotel_id=h.id where h.id=p_hotel_id and t.type='MAINTENANCE' and t.priority='URGENT' and t.status not in ('COMPLETED','CANCELLED') having count(*)>0 and not exists(select 1 from public.hotel_os_dashboard_alerts a where a.hotel_id=p_hotel_id and a.alert_type='CRITICAL_MAINTENANCE' and a.resolved_at is null);

 insert into public.hotel_os_dashboard_alerts(organization_id,hotel_id,alert_type,severity,title,description,current_value)
 select h.organization_id,p_hotel_id,'LOW_STOCK','WARNING','Estoque crítico','Existem itens no estoque abaixo do ponto de reposição.',count(*)
 from public.hoteis h join public.hotel_os_stock_items s on s.hotel_id=h.id where h.id=p_hotel_id and s.reorder_point is not null and s.quantity<=s.reorder_point having count(*)>0 and not exists(select 1 from public.hotel_os_dashboard_alerts a where a.hotel_id=p_hotel_id and a.alert_type='LOW_STOCK' and a.resolved_at is null);

 insert into public.hotel_os_dashboard_alerts(organization_id,hotel_id,alert_type,severity,title,description,current_value)
 select h.organization_id,p_hotel_id,'PAYMENT_FAILURES','CRITICAL','Pagamentos com falha','Existem pagamentos recentes com status FAILED.',count(*)
 from public.hoteis h join public.hotel_os_payments p on p.hotel_id=h.id where h.id=p_hotel_id and p.status='FAILED' and p.created_at>=now()-interval '24 hours' having count(*)>0 and not exists(select 1 from public.hotel_os_dashboard_alerts a where a.hotel_id=p_hotel_id and a.alert_type='PAYMENT_FAILURES' and a.resolved_at is null);

 insert into public.hotel_os_dashboard_alerts(organization_id,hotel_id,alert_type,severity,title,description,current_value)
 select h.organization_id,p_hotel_id,'ORDERS_OVER_SLA','WARNING','Pedidos atrasados','Existem pedidos não concluídos acima de 30 minutos.',count(*)
 from public.hoteis h join public.hotel_os_orders o on o.hotel_id=h.id where h.id=p_hotel_id and upper(coalesce(o.status,'')) not in ('DELIVERED','COMPLETED','CANCELLED') and o.created_at<now()-interval '30 minutes' having count(*)>0 and not exists(select 1 from public.hotel_os_dashboard_alerts a where a.hotel_id=p_hotel_id and a.alert_type='ORDERS_OVER_SLA' and a.resolved_at is null);

 return n;
end;
$$;

grant execute on function public.hotel_os_refresh_dashboard_alerts(uuid) to authenticated;
