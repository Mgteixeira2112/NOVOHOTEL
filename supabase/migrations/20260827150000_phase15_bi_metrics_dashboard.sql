-- FASE 15 — BI, métricas e dashboard gerencial
-- Incremental: reutiliza entidades operacionais/financeiras existentes.
create extension if not exists pgcrypto;

create table if not exists public.hotel_os_metric_definitions (
  code text primary key,
  name text not null,
  description text not null,
  formula text not null,
  source text not null,
  scope text not null default 'HOTEL',
  period_granularity text not null default 'DAY',
  filters jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_os_dashboard_goals (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  metric_code text not null references public.hotel_os_metric_definitions(code) on delete cascade,
  target_value numeric(14,4) not null,
  valid_from date,
  valid_to date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(hotel_id,metric_code,valid_from)
);

create table if not exists public.hotel_os_dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid references public.hoteis(id) on delete cascade,
  role text,
  layout jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(user_id,hotel_id)
);

create table if not exists public.hotel_os_report_definitions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hoteis(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null,
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(hotel_id,code)
);

create table if not exists public.hotel_os_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  metric_date date not null,
  currency text not null default 'BRL',
  available_room_nights numeric(14,2) not null default 0,
  occupied_room_nights numeric(14,2) not null default 0,
  sold_room_nights numeric(14,2) not null default 0,
  occupancy numeric(7,4) not null default 0,
  room_revenue numeric(14,2) not null default 0,
  pos_revenue numeric(14,2) not null default 0,
  room_service_revenue numeric(14,2) not null default 0,
  minibar_revenue numeric(14,2) not null default 0,
  other_service_revenue numeric(14,2) not null default 0,
  total_revenue numeric(14,2) not null default 0,
  adr numeric(14,2) not null default 0,
  revpar numeric(14,2) not null default 0,
  average_ticket numeric(14,2) not null default 0,
  checkins integer not null default 0,
  checkouts integer not null default 0,
  cancellations integer not null default 0,
  no_shows integer not null default 0,
  booking_window numeric(10,2) not null default 0,
  lead_time numeric(10,2) not null default 0,
  housekeeping_completed integer not null default 0,
  housekeeping_avg_minutes numeric(10,2) not null default 0,
  maintenance_completed integer not null default 0,
  maintenance_mttr_minutes numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique(hotel_id,metric_date)
);

insert into public.hotel_os_metric_definitions(code,name,description,formula,source,scope,period_granularity,filters) values
('OCCUPANCY','Ocupação','Percentual de quartos disponíveis que estiveram ocupados no período','occupied room-nights / available room-nights','quartos + reservas + bloqueios','HOTEL','DAY','{}'),
('ADR','ADR','Diária média dos quartos vendidos','room revenue / sold room-nights','hotel_os_folio_items','HOTEL','DAY','{"category":"ROOM"}'),
('REVPAR','RevPAR','Receita de hospedagem por quarto disponível','room revenue / available room-nights','hotel_os_folio_items + quartos','HOTEL','DAY','{"exclude_non_room_revenue":true}'),
('TOTAL_REVENUE','Receita total','Receita operacional sem pagamentos como fonte de receita','room + POS + room service + minibar + services','folio + orders','HOTEL','DAY','{}'),
('ROOM_REVENUE','Receita hospedagem','Receita proveniente de diárias','sum(folio room items)','hotel_os_folio_items','HOTEL','DAY','{"category":"ROOM"}'),
('POS_REVENUE','Receita PDV','Receita de pedidos POS/restaurante','sum(order totals where origin POS/RESTAURANT)','hotel_os_orders','HOTEL','DAY','{}'),
('AVERAGE_TICKET','Ticket médio','Valor médio por pedido POS','POS revenue / POS orders','hotel_os_orders','HOTEL','DAY','{}'),
('CHECKINS','Check-ins','Hospedagens iniciadas','count stays checked in','hotel_os_stays','HOTEL','DAY','{}'),
('CHECKOUTS','Check-outs','Hospedagens encerradas','count stays checked out','hotel_os_stays','HOTEL','DAY','{}'),
('CANCELLATIONS','Cancelamentos','Reservas canceladas','count reservations cancelled','reservas','HOTEL','DAY','{}'),
('NO_SHOWS','No-shows','Reservas marcadas como no-show','count reservations no-show','reservas','HOTEL','DAY','{}'),
('BOOKING_WINDOW','Booking window','Média de dias entre criação e check-in','avg(check-in - created_at)','reservas','HOTEL','DAY','{}'),
('LEAD_TIME','Lead time','Média de dias entre criação e chegada para reservas confirmadas','avg(check-in - created_at) confirmed','reservas','HOTEL','DAY','{"status":"confirmed"}'),
('HOUSEKEEPING_PRODUCTIVITY','Produtividade governança','Quantidade de limpezas concluídas e tempo médio','completed cleaning tasks + average minutes','hotel_os_tasks','HOTEL','DAY','{"type":"ROOM_CLEANING"}'),
('MAINTENANCE_MTTR','MTTR manutenção','Tempo médio entre início e conclusão de manutenção','avg(completed_at - started_at)','hotel_os_maintenance_requests + hotel_os_tasks','HOTEL','DAY','{}')
on conflict(code) do update set name=excluded.name,description=excluded.description,formula=excluded.formula,source=excluded.source,scope=excluded.scope,period_granularity=excluded.period_granularity,filters=excluded.filters,active=true,updated_at=now();

create index if not exists idx_metric_goals_hotel_metric on public.hotel_os_dashboard_goals(hotel_id,metric_code,active,valid_from,valid_to);
create index if not exists idx_daily_metrics_hotel_date on public.hotel_os_daily_metrics(hotel_id,metric_date desc);
create index if not exists idx_dashboard_layout_hotel_user on public.hotel_os_dashboard_layouts(hotel_id,user_id);

alter table public.hotel_os_metric_definitions enable row level security;
alter table public.hotel_os_dashboard_goals enable row level security;
alter table public.hotel_os_dashboard_layouts enable row level security;
alter table public.hotel_os_report_definitions enable row level security;
alter table public.hotel_os_daily_metrics enable row level security;

drop policy if exists metric_definitions_read on public.hotel_os_metric_definitions;
create policy metric_definitions_read on public.hotel_os_metric_definitions for select to authenticated using(active=true);
drop policy if exists metric_goals_hotel on public.hotel_os_dashboard_goals;
create policy metric_goals_hotel on public.hotel_os_dashboard_goals for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists dashboard_layout_self on public.hotel_os_dashboard_layouts;
create policy dashboard_layout_self on public.hotel_os_dashboard_layouts for all to authenticated using(user_id=auth.uid() and (hotel_id is null or public.usuario_pode_hotel(hotel_id))) with check(user_id=auth.uid() and (hotel_id is null or public.usuario_pode_hotel(hotel_id)));
drop policy if exists report_definitions_hotel on public.hotel_os_report_definitions;
create policy report_definitions_hotel on public.hotel_os_report_definitions for all to authenticated using(hotel_id is null or public.usuario_pode_hotel(hotel_id)) with check(hotel_id is null or public.usuario_pode_hotel(hotel_id));
drop policy if exists daily_metrics_hotel on public.hotel_os_daily_metrics;
create policy daily_metrics_hotel on public.hotel_os_daily_metrics for select to authenticated using(public.usuario_pode_hotel(hotel_id));

-- Uma linha oficial por hotel/dia. A diária de checkout não é contada como noite ocupada.
create or replace function public.hotel_os_calculate_daily_metrics(p_hotel_id uuid,p_metric_date date)
returns public.hotel_os_daily_metrics
language plpgsql
stable security definer set search_path=public
as $$
declare v public.hotel_os_daily_metrics; v_available numeric:=0; v_occupied numeric:=0; v_sold numeric:=0; v_room_revenue numeric:=0; v_pos numeric:=0; v_room_service numeric:=0; v_minibar numeric:=0; v_other numeric:=0; v_pos_orders integer:=0; v_currency text; v_hk integer:=0; v_hk_minutes numeric:=0; v_maint integer:=0; v_mttr numeric:=0;
begin
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
 select coalesce(currency,'BRL') into v_currency from public.hoteis where id=p_hotel_id;
 select count(*) into v_available from public.quartos q where q.hotel_id=p_hotel_id and q.ativo and q.status not in ('manutencao') and not exists(select 1 from public.bloqueios b where b.hotel_id=p_hotel_id and b.quarto_id=q.id and b.data_inicio<=p_metric_date and b.data_fim>p_metric_date and b.ativo);
 select count(*) into v_occupied from public.quartos q where q.hotel_id=p_hotel_id and q.ativo and exists(select 1 from public.reservas r where r.hotel_id=p_hotel_id and r.quarto_id=q.id and r.checkin::date<=p_metric_date and r.checkout::date>p_metric_date and r.status not in ('cancelada','no_show','no-show'));
 v_sold:=v_occupied;
 select coalesce(sum(coalesce(total_amount,quantity*unit_amount)),0) into v_room_revenue from public.hotel_os_folio_items i where i.hotel_id=p_hotel_id and lower(coalesce(i.status,'active'))='active' and upper(coalesce(i.category,i.item_type))='ROOM' and i.created_at::date=p_metric_date;
 select coalesce(sum(total),0),count(*) into v_pos,v_pos_orders from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'POS')) in ('POS','RESTAURANT') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date=p_metric_date;
 select coalesce(sum(total),0) into v_room_service from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'')) in ('ROOM_SERVICE','ROOM_TABLET') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date=p_metric_date;
 select coalesce(sum(coalesce(total_amount,quantity*unit_amount)),0) into v_minibar from public.hotel_os_folio_items i where i.hotel_id=p_hotel_id and lower(coalesce(i.status,'active'))='active' and upper(coalesce(i.category,i.item_type))='MINIBAR' and i.created_at::date=p_metric_date;
 select coalesce(sum(coalesce(total_amount,quantity*unit_amount)),0) into v_other from public.hotel_os_folio_items i where i.hotel_id=p_hotel_id and lower(coalesce(i.status,'active'))='active' and upper(coalesce(i.category,i.item_type)) not in ('ROOM','MINIBAR','DISCOUNT','PAYMENT','REFUND') and i.created_at::date=p_metric_date;
 select count(*) ,coalesce(avg(extract(epoch from (completed_at-started_at))/60),0) into v_hk,v_hk_minutes from public.hotel_os_tasks where hotel_id=p_hotel_id and type='ROOM_CLEANING' and status='COMPLETED' and completed_at::date=p_metric_date and started_at is not null;
 select count(*),coalesce(avg(extract(epoch from (t.completed_at-t.started_at))/60),0) into v_maint,v_mttr from public.hotel_os_tasks t where t.hotel_id=p_hotel_id and t.type='MAINTENANCE' and t.status='COMPLETED' and t.completed_at::date=p_metric_date and t.started_at is not null;

 v.hotel_id:=p_hotel_id; v.metric_date:=p_metric_date; v.currency:=coalesce(v_currency,'BRL'); v.available_room_nights:=v_available; v.occupied_room_nights:=v_occupied; v.sold_room_nights:=v_sold; v.occupancy:=case when v_available=0 then 0 else round(v_occupied/v_available,4) end; v.room_revenue:=round(v_room_revenue,2); v.pos_revenue:=round(v_pos,2); v.room_service_revenue:=round(v_room_service,2); v.minibar_revenue:=round(v_minibar,2); v.other_service_revenue:=round(v_other,2); v.total_revenue:=round(v_room_revenue+v_pos+v_room_service+v_minibar+v_other,2); v.adr:=case when v_sold=0 then 0 else round(v_room_revenue/v_sold,2) end; v.revpar:=case when v_available=0 then 0 else round(v_room_revenue/v_available,2) end; v.average_ticket:=case when v_pos_orders=0 then 0 else round(v_pos/v_pos_orders,2) end;
 select count(*) into v.checkins from public.hotel_os_stays s where s.hotel_id=p_hotel_id and s.checked_in_at::date=p_metric_date;
 select count(*) into v.checkouts from public.hotel_os_stays s where s.hotel_id=p_hotel_id and s.checked_out_at::date=p_metric_date;
 select count(*) into v.cancellations from public.reservas r where r.hotel_id=p_hotel_id and r.status='cancelada' and r.updated_at::date=p_metric_date;
 select count(*) into v.no_shows from public.reservas r where r.hotel_id=p_hotel_id and lower(r.status) in ('no_show','no-show') and r.updated_at::date=p_metric_date;
 select coalesce(avg(greatest(0,extract(epoch from (r.checkin::timestamptz-r.created_at))/86400)),0) into v.booking_window from public.reservas r where r.hotel_id=p_hotel_id and r.created_at::date=p_metric_date and r.checkin is not null and r.status not in ('cancelada','no_show','no-show');
 select coalesce(avg(greatest(0,extract(epoch from (r.checkin::timestamptz-r.created_at))/86400)),0) into v.lead_time from public.reservas r where r.hotel_id=p_hotel_id and r.created_at::date=p_metric_date and r.checkin is not null and r.status in ('confirmada','checkin_realizado','checkout_concluido');
 v.housekeeping_completed:=v_hk; v.housekeeping_avg_minutes:=round(v_hk_minutes,2); v.maintenance_completed:=v_maint; v.maintenance_mttr_minutes:=round(v_mttr,2); v.updated_at:=now(); return v;
end;
$$;

create or replace function public.hotel_os_refresh_daily_metrics(p_hotel_id uuid,p_start date,p_end date)
returns integer language plpgsql security definer set search_path=public
as $$
declare d date; v public.hotel_os_daily_metrics; n integer:=0;
begin
 if p_end<=p_start then raise exception 'INVALID_PERIOD'; end if;
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
 for d in select generate_series(p_start,p_end-1,interval '1 day')::date loop
   v:=public.hotel_os_calculate_daily_metrics(p_hotel_id,d);
   insert into public.hotel_os_daily_metrics select v.* on conflict(hotel_id,metric_date) do update set currency=excluded.currency,available_room_nights=excluded.available_room_nights,occupied_room_nights=excluded.occupied_room_nights,sold_room_nights=excluded.sold_room_nights,occupancy=excluded.occupancy,room_revenue=excluded.room_revenue,pos_revenue=excluded.pos_revenue,room_service_revenue=excluded.room_service_revenue,minibar_revenue=excluded.minibar_revenue,other_service_revenue=excluded.other_service_revenue,total_revenue=excluded.total_revenue,adr=excluded.adr,revpar=excluded.revpar,average_ticket=excluded.average_ticket,checkins=excluded.checkins,checkouts=excluded.checkouts,cancellations=excluded.cancellations,no_shows=excluded.no_shows,booking_window=excluded.booking_window,lead_time=excluded.lead_time,housekeeping_completed=excluded.housekeeping_completed,housekeeping_avg_minutes=excluded.housekeeping_avg_minutes,maintenance_completed=excluded.maintenance_completed,maintenance_mttr_minutes=excluded.maintenance_mttr_minutes,updated_at=now();
   n:=n+1;
 end loop; return n;
end;
$$;

create or replace function public.hotel_os_dashboard_metrics(p_hotel_id uuid,p_start date,p_end date)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v record; v_currency text;
begin
 if p_end<=p_start then raise exception 'INVALID_PERIOD'; end if;
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
 select coalesce(h.currency,'BRL') into v_currency from public.hoteis h where h.id=p_hotel_id;
 with daily as (select * from public.hotel_os_daily_metrics where hotel_id=p_hotel_id and metric_date>=p_start and metric_date<p_end), agg as (select coalesce(avg(occupancy),0) occupancy,coalesce(sum(room_revenue),0) room_revenue,coalesce(sum(pos_revenue),0) pos_revenue,coalesce(sum(room_service_revenue),0) room_service_revenue,coalesce(sum(minibar_revenue),0) minibar_revenue,coalesce(sum(other_service_revenue),0) other_service_revenue,coalesce(sum(total_revenue),0) total_revenue,coalesce(sum(available_room_nights),0) available_room_nights,coalesce(sum(sold_room_nights),0) sold_room_nights,coalesce(sum(checkins),0) checkins,coalesce(sum(checkouts),0) checkouts,coalesce(sum(cancellations),0) cancellations,coalesce(sum(no_shows),0) no_shows,coalesce(avg(booking_window),0) booking_window,coalesce(avg(lead_time),0) lead_time,coalesce(sum(housekeeping_completed),0) housekeeping_completed,coalesce(avg(housekeeping_avg_minutes) filter(where housekeeping_avg_minutes>0),0) housekeeping_avg_minutes,coalesce(sum(maintenance_completed),0) maintenance_completed,coalesce(avg(maintenance_mttr_minutes) filter(where maintenance_mttr_minutes>0),0) maintenance_mttr_minutes from daily) select * into v from agg;
 return jsonb_build_object('hotel_id',p_hotel_id,'period',jsonb_build_object('start',p_start,'end',p_end,'days',p_end-p_start),'currency',coalesce(v_currency,'BRL'),'occupancy',round(v.occupancy,4),'adr',case when v.sold_room_nights=0 then 0 else round(v.room_revenue/v.sold_room_nights,2) end,'revpar',case when v.available_room_nights=0 then 0 else round(v.room_revenue/v.available_room_nights,2) end,'total_revenue',round(v.total_revenue,2),'room_revenue',round(v.room_revenue,2),'pos_revenue',round(v.pos_revenue,2),'room_service_revenue',round(v.room_service_revenue,2),'minibar_revenue',round(v.minibar_revenue,2),'other_service_revenue',round(v.other_service_revenue,2),'average_ticket',case when (select count(*) from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'POS')) in ('POS','RESTAURANT') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date>=p_start and o.created_at::date<p_end)=0 then 0 else round(v.pos_revenue/(select count(*) from public.hotel_os_orders o where o.hotel_id=p_hotel_id and upper(coalesce(o.origin,'POS')) in ('POS','RESTAURANT') and upper(coalesce(o.status,'')) not in ('CANCELLED','CANCELADA') and o.created_at::date>=p_start and o.created_at::date<p_end),2) end,'checkins',v.checkins,'checkouts',v.checkouts,'cancellations',v.cancellations,'no_shows',v.no_shows,'booking_window',round(v.booking_window,2),'lead_time',round(v.lead_time,2),'housekeeping_productivity',v.housekeeping_completed,'housekeeping_avg_minutes',round(v.housekeeping_avg_minutes,2),'maintenance_completed',v.maintenance_completed,'maintenance_mttr_minutes',round(v.maintenance_mttr_minutes,2));
end;
$$;

revoke all on function public.hotel_os_calculate_daily_metrics(uuid,date) from public;
revoke all on function public.hotel_os_refresh_daily_metrics(uuid,date,date) from public;
revoke all on function public.hotel_os_dashboard_metrics(uuid,date,date) from public;
grant execute on function public.hotel_os_calculate_daily_metrics(uuid,date) to authenticated;
grant execute on function public.hotel_os_refresh_daily_metrics(uuid,date,date) to authenticated;
grant execute on function public.hotel_os_dashboard_metrics(uuid,date,date) to authenticated;

-- Atualização leve por evento: produtores do Event Center podem invalidar o snapshot.
create or replace function public.hotel_os_mark_metrics_stale()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if tg_table_name='reservas' then
    update public.hotel_os_daily_metrics set updated_at=now() where hotel_id=new.hotel_id and metric_date>=coalesce(new.checkin::date,current_date)-1 and metric_date<=coalesce(new.checkout::date,current_date)+1;
  elsif tg_table_name='hotel_os_stays' then
    update public.hotel_os_daily_metrics set updated_at=now() where hotel_id=new.hotel_id and metric_date between coalesce(new.checked_in_at::date,current_date)-1 and coalesce(new.checked_out_at::date,current_date)+1;
  end if;
  return new;
end;
$$;

create index if not exists idx_reservas_dashboard_dates on public.reservas(hotel_id,checkin,checkout,status,created_at);
create index if not exists idx_stays_dashboard_dates on public.hotel_os_stays(hotel_id,checked_in_at,checked_out_at,status);
create index if not exists idx_folio_items_dashboard on public.hotel_os_folio_items(hotel_id,created_at,category,status);
create index if not exists idx_tasks_dashboard on public.hotel_os_tasks(hotel_id,type,status,started_at,completed_at);
create index if not exists idx_orders_dashboard on public.pdv_pedidos(hotel_id,criado_em,status,origin_os);
