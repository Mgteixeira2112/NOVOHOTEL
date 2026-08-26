-- FASE 15 — hardening dos snapshots BI
-- Corrige inicialização do id do snapshot e garante refresh antes do dashboard.

create or replace function public.hotel_os_calculate_daily_metrics(p_hotel_id uuid,p_metric_date date)
returns public.hotel_os_daily_metrics
language plpgsql stable security definer set search_path=public
as $$
declare
 v public.hotel_os_daily_metrics;
 v_available numeric:=0; v_occupied numeric:=0; v_room_revenue numeric:=0; v_pos numeric:=0; v_room_service numeric:=0; v_minibar numeric:=0; v_other numeric:=0; v_pos_orders integer:=0; v_currency text; v_hk integer:=0; v_hk_minutes numeric:=0; v_maint integer:=0; v_mttr numeric:=0;
begin
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
 select coalesce(currency,'BRL') into v_currency from public.hoteis where id=p_hotel_id;
 select count(*) into v_available from public.quartos q where q.hotel_id=p_hotel_id and q.ativo and q.status not in ('manutencao') and not exists(select 1 from public.bloqueios b where b.hotel_id=p_hotel_id and b.quarto_id=q.id and b.data_inicio<=p_metric_date and b.data_fim>p_metric_date and b.ativo);
 select count(*) into v_occupied from public.quartos q where q.hotel_id=p_hotel_id and q.ativo and exists(select 1 from public.reservas r where r.hotel_id=p_hotel_id and r.quarto_id=q.id and r.checkin::date<=p_metric_date and r.checkout::date>p_metric_date and r.status not in ('cancelada','no_show','no-show'));
 select coalesce(sum(coalesce(total_amount,quantity*unit_amount)),0) into v_room_revenue from public.hotel_os_folio_items i where i.hotel_id=p_hotel_id and lower(coalesce(i.status,'active'))='active' and upper(coalesce(i.category,i.item_type))='ROOM' and i.created_at::date=p_metric_date;
 select coalesce(sum(total),0),count(*) into v_pos,v_pos_orders from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'POS')) in ('POS','RESTAURANT') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date=p_metric_date;
 select coalesce(sum(total),0) into v_room_service from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'')) in ('ROOM_SERVICE','ROOM_TABLET') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date=p_metric_date;
 select coalesce(sum(coalesce(total_amount,quantity*unit_amount)),0) into v_minibar from public.hotel_os_folio_items i where i.hotel_id=p_hotel_id and lower(coalesce(i.status,'active'))='active' and upper(coalesce(i.category,i.item_type))='MINIBAR' and i.created_at::date=p_metric_date;
 select coalesce(sum(coalesce(total_amount,quantity*unit_amount)),0) into v_other from public.hotel_os_folio_items i where i.hotel_id=p_hotel_id and lower(coalesce(i.status,'active'))='active' and upper(coalesce(i.category,i.item_type)) not in ('ROOM','MINIBAR','DISCOUNT','PAYMENT','REFUND') and i.created_at::date=p_metric_date;
 select count(*),coalesce(avg(extract(epoch from (completed_at-started_at))/60),0) into v_hk,v_hk_minutes from public.hotel_os_tasks where hotel_id=p_hotel_id and type='ROOM_CLEANING' and status='COMPLETED' and completed_at::date=p_metric_date and started_at is not null;
 select count(*),coalesce(avg(extract(epoch from (completed_at-started_at))/60),0) into v_maint,v_mttr from public.hotel_os_tasks where hotel_id=p_hotel_id and type='MAINTENANCE' and status='COMPLETED' and completed_at::date=p_metric_date and started_at is not null;

 v.id:=gen_random_uuid(); v.hotel_id:=p_hotel_id; v.metric_date:=p_metric_date; v.currency:=coalesce(v_currency,'BRL');
 v.available_room_nights:=v_available; v.occupied_room_nights:=v_occupied; v.sold_room_nights:=v_occupied;
 v.occupancy:=case when v_available=0 then 0 else round(v_occupied/v_available,4) end;
 v.room_revenue:=round(v_room_revenue,2); v.pos_revenue:=round(v_pos,2); v.room_service_revenue:=round(v_room_service,2); v.minibar_revenue:=round(v_minibar,2); v.other_service_revenue:=round(v_other,2);
 v.total_revenue:=round(v_room_revenue+v_pos+v_room_service+v_minibar+v_other,2);
 v.adr:=case when v_occupied=0 then 0 else round(v_room_revenue/v_occupied,2) end;
 v.revpar:=case when v_available=0 then 0 else round(v_room_revenue/v_available,2) end;
 v.average_ticket:=case when v_pos_orders=0 then 0 else round(v_pos/v_pos_orders,2) end;
 select count(*) into v.checkins from public.hotel_os_stays s where s.hotel_id=p_hotel_id and s.checked_in_at::date=p_metric_date;
 select count(*) into v.checkouts from public.hotel_os_stays s where s.hotel_id=p_hotel_id and s.checked_out_at::date=p_metric_date;
 select count(*) into v.cancellations from public.reservas r where r.hotel_id=p_hotel_id and r.status='cancelada' and r.updated_at::date=p_metric_date;
 select count(*) into v.no_shows from public.reservas r where r.hotel_id=p_hotel_id and lower(r.status) in ('no_show','no-show') and r.updated_at::date=p_metric_date;
 select coalesce(avg(greatest(0,extract(epoch from (r.checkin::timestamptz-r.created_at))/86400)),0) into v.booking_window from public.reservas r where r.hotel_id=p_hotel_id and r.created_at::date=p_metric_date and r.checkin is not null and r.status not in ('cancelada','no_show','no-show');
 select coalesce(avg(greatest(0,extract(epoch from (r.checkin::timestamptz-r.created_at))/86400)),0) into v.lead_time from public.reservas r where r.hotel_id=p_hotel_id and r.created_at::date=p_metric_date and r.checkin is not null and r.status in ('confirmada','checkin_realizado','checkout_concluido');
 v.housekeeping_completed:=v_hk; v.housekeeping_avg_minutes:=round(v_hk_minutes,2); v.maintenance_completed:=v_maint; v.maintenance_mttr_minutes:=round(v_mttr,2); v.updated_at:=now();
 return v;
end;
$$;

create or replace function public.hotel_os_dashboard_metrics(p_hotel_id uuid,p_start date,p_end date)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v record; v_currency text; v_days integer;
begin
 if p_end<=p_start then raise exception 'INVALID_PERIOD'; end if;
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
 perform public.hotel_os_refresh_daily_metrics(p_hotel_id,p_start,p_end);
 v_days:=p_end-p_start;
 select coalesce(h.currency,'BRL') into v_currency from public.hoteis h where h.id=p_hotel_id;
 with daily as (select * from public.hotel_os_daily_metrics where hotel_id=p_hotel_id and metric_date>=p_start and metric_date<p_end)
 select coalesce(avg(occupancy),0) occupancy,coalesce(sum(available_room_nights),0) available_room_nights,coalesce(sum(occupied_room_nights),0) occupied_room_nights,coalesce(sum(sold_room_nights),0) sold_room_nights,coalesce(sum(room_revenue),0) room_revenue,coalesce(sum(pos_revenue),0) pos_revenue,coalesce(sum(room_service_revenue),0) room_service_revenue,coalesce(sum(minibar_revenue),0) minibar_revenue,coalesce(sum(other_service_revenue),0) other_service_revenue,coalesce(sum(total_revenue),0) total_revenue,coalesce(sum(checkins),0) checkins,coalesce(sum(checkouts),0) checkouts,coalesce(sum(cancellations),0) cancellations,coalesce(sum(no_shows),0) no_shows,coalesce(avg(booking_window),0) booking_window,coalesce(avg(lead_time),0) lead_time,coalesce(sum(housekeeping_completed),0) housekeeping_completed,coalesce(avg(housekeeping_avg_minutes) filter(where housekeeping_avg_minutes>0),0) housekeeping_avg_minutes,coalesce(sum(maintenance_completed),0) maintenance_completed,coalesce(avg(maintenance_mttr_minutes) filter(where maintenance_mttr_minutes>0),0) maintenance_mttr_minutes into v from daily;
 return jsonb_build_object('hotel_id',p_hotel_id,'period',jsonb_build_object('start',p_start,'end',p_end,'days',v_days),'currency',coalesce(v_currency,'BRL'),'occupancy',round(v.occupancy,4),'available_room_nights',v.available_room_nights,'occupied_room_nights',v.occupied_room_nights,'sold_room_nights',v.sold_room_nights,'adr',case when v.sold_room_nights=0 then 0 else round(v.room_revenue/v.sold_room_nights,2) end,'revpar',case when v.available_room_nights=0 then 0 else round(v.room_revenue/v.available_room_nights,2) end,'total_revenue',round(v.total_revenue,2),'room_revenue',round(v.room_revenue,2),'pos_revenue',round(v.pos_revenue,2),'room_service_revenue',round(v.room_service_revenue,2),'minibar_revenue',round(v.minibar_revenue,2),'other_service_revenue',round(v.other_service_revenue,2),'average_ticket',case when (select count(*) from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'POS')) in ('POS','RESTAURANT') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date>=p_start and o.created_at::date<p_end)=0 then 0 else round(v.pos_revenue/(select count(*) from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'POS')) in ('POS','RESTAURANT') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date>=p_start and o.created_at::date<p_end),2) end,'checkins',v.checkins,'checkouts',v.checkouts,'cancellations',v.cancellations,'no_shows',v.no_shows,'booking_window',round(v.booking_window,2),'lead_time',round(v.lead_time,2),'housekeeping_productivity',v.housekeeping_completed,'housekeeping_avg_minutes',round(v.housekeeping_avg_minutes,2),'maintenance_completed',v.maintenance_completed,'maintenance_mttr_minutes',round(v.maintenance_mttr_minutes,2));
end;
$$;
