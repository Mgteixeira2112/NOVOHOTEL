-- FASE 4 — Reservas e motor de disponibilidade
-- Incremental: não remove tabelas legadas nem depende do frontend para a decisão final.
create extension if not exists pgcrypto;

create table if not exists public.hotel_os_rate_plans (
  id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
  code text not null, name text not null, refundable boolean not null default true,
  breakfast_included boolean not null default false, package_code text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(hotel_id,code)
);
create table if not exists public.hotel_os_rates (
  id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
  room_type_id text not null, rate_plan_id uuid not null references public.hotel_os_rate_plans(id) on delete cascade,
  valid_from date not null, valid_to date not null, amount numeric(12,2) not null check(amount>=0), currency text not null default 'BRL',
  min_nights integer not null default 1 check(min_nights>0), max_nights integer check(max_nights is null or max_nights>=min_nights), active boolean not null default true,
  created_at timestamptz not null default now(), check(valid_to>=valid_from)
);
create index if not exists idx_hotel_os_rates_lookup on public.hotel_os_rates(hotel_id,room_type_id,rate_plan_id,valid_from,valid_to) where active;
create table if not exists public.hotel_os_discounts (
  id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
  code text not null, name text not null, percent numeric(7,4) check(percent is null or(percent between 0 and 100)),
  fixed_amount numeric(12,2) check(fixed_amount is null or fixed_amount>=0), valid_from date, valid_to date, active boolean not null default true,
  created_at timestamptz not null default now(), unique(hotel_id,code), check(percent is not null or fixed_amount is not null)
);
create table if not exists public.hotel_os_fees (
  id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
  code text not null, name text not null, amount numeric(12,2) not null check(amount>=0), percent numeric(7,4) check(percent is null or(percent between 0 and 100)),
  per_night boolean not null default false, active boolean not null default true, created_at timestamptz not null default now(), unique(hotel_id,code)
);
create table if not exists public.hotel_os_policies (
  id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
  code text not null, cancellation_policy jsonb not null default '{}'::jsonb, payment_policy jsonb not null default '{}'::jsonb,
  checkin_policy jsonb not null default '{}'::jsonb, checkout_policy jsonb not null default '{}'::jsonb, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(hotel_id,code)
);

alter table public.reservas add column if not exists tipo_quarto_id text;
alter table public.reservas add column if not exists booking_mode text not null default 'AUTO';
alter table public.reservas add column if not exists hold_expires_at timestamptz;
alter table public.reservas add column if not exists payment_status text not null default 'PAYMENT_PENDING';
alter table public.reservas add column if not exists adults integer not null default 1;
alter table public.reservas add column if not exists children integer not null default 0;
alter table public.reservas add column if not exists children_ages jsonb not null default '[]'::jsonb;
alter table public.reservas add column if not exists rate_plan_id uuid;
alter table public.reservas add column if not exists total_amount numeric(12,2);
alter table public.reservas add column if not exists pricing_snapshot jsonb;
alter table public.reservas add column if not exists policy_id uuid;
alter table public.reservas add column if not exists codigo_reserva text;
alter table public.reservas drop constraint if exists reservas_booking_mode_check;
alter table public.reservas add constraint reservas_booking_mode_check check(booking_mode in('AUTO','MANUAL','GUEST_SELECTION'));
alter table public.reservas drop constraint if exists reservas_payment_status_check;
alter table public.reservas add constraint reservas_payment_status_check check(payment_status in('PAYMENT_PENDING','PAYMENT_APPROVED','PAYMENT_FAILED'));
alter table public.reservas drop constraint if exists reservas_guest_counts_check;
alter table public.reservas add constraint reservas_guest_counts_check check(adults>=1 and children>=0);
update public.reservas r set tipo_quarto_id=q.tipo_quarto_id from public.quartos q where r.tipo_quarto_id is null and r.quarto_id=q.id;
create sequence if not exists public.hotel_os_reservation_code_seq start 1000;
update public.reservas r set codigo_reserva='HTL-'||extract(year from r.checkin)::int||'-'||lpad(nextval('public.hotel_os_reservation_code_seq')::text,6,'0') where r.codigo_reserva is null;
create unique index if not exists uq_reservas_codigo_reserva on public.reservas(codigo_reserva) where codigo_reserva is not null;
create index if not exists idx_reservas_availability on public.reservas(hotel_id,tipo_quarto_id,checkin,checkout,status);
create index if not exists idx_reservas_hold on public.reservas(hotel_id,hold_expires_at) where status='pendente' and hold_expires_at is not null;

create table if not exists public.hotel_os_reservation_guests (
  reservation_id text not null references public.reservas(id) on delete cascade, guest_id text not null references public.hospedes(id) on delete restrict,
  role text not null default 'COMPANION' check(role in('PRIMARY','COMPANION','CHILD')), child_age integer check(child_age is null or child_age between 0 and 17),
  created_at timestamptz not null default now(), primary key(reservation_id,guest_id)
);
create unique index if not exists uq_reservation_primary_guest on public.hotel_os_reservation_guests(reservation_id) where role='PRIMARY';

alter table public.tipos_quarto add column if not exists max_adults integer;
alter table public.tipos_quarto add column if not exists max_children integer;
alter table public.tipos_quarto add column if not exists max_guests integer;
update public.tipos_quarto set max_guests=coalesce(max_guests,capacidade),max_adults=coalesce(max_adults,capacidade),max_children=coalesce(max_children,capacidade) where max_guests is null or max_adults is null or max_children is null;
alter table public.tipos_quarto drop constraint if exists tipos_quarto_capacity_check;
alter table public.tipos_quarto add constraint tipos_quarto_capacity_check check(max_adults>0 and max_children>=0 and max_guests>=max_adults);

alter table public.bloqueios add column if not exists reason_type text not null default 'BLOCK';
alter table public.bloqueios drop constraint if exists bloqueios_reason_type_check;
alter table public.bloqueios add constraint bloqueios_reason_type_check check(reason_type in('BLOCK','MAINTENANCE','OUT_OF_ORDER'));
create index if not exists idx_bloqueios_availability on public.bloqueios(hotel_id,quarto_id,data_inicio,data_fim,reason_type);

create or replace function public.hotel_os_calculate_reservation_price(p_hotel_id uuid,p_room_type_id text,p_checkin date,p_checkout date,p_rate_plan_id uuid,p_discount_code text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_nights integer:=p_checkout-p_checkin; v_rate numeric(12,2); v_subtotal numeric(12,2); v_discount numeric(12,2):=0; v_fees numeric(12,2):=0; v_total numeric(12,2); v_currency text:='BRL'; v_policy uuid;
begin
 if p_checkout<=p_checkin then raise exception 'checkout deve ser posterior ao checkin'; end if;
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'usuário sem acesso ao hotel'; end if;
 select sum(r.amount),max(r.currency) into v_rate,v_currency from public.hotel_os_rates r where r.hotel_id=p_hotel_id and r.room_type_id=p_room_type_id and r.rate_plan_id=p_rate_plan_id and r.active and r.valid_from<=p_checkin and r.valid_to>=(p_checkout-1) and v_nights>=r.min_nights and(r.max_nights is null or v_nights<=r.max_nights);
 if v_rate is null then select max(q.valor_diaria) into v_rate from public.quartos q where q.hotel_id=p_hotel_id and q.tipo_quarto_id=p_room_type_id and q.ativo; v_rate:=coalesce(v_rate,0); end if;
 v_subtotal:=v_rate*v_nights;
 if p_discount_code is not null then select case when d.percent is not null then v_subtotal*d.percent/100 else d.fixed_amount end into v_discount from public.hotel_os_discounts d where d.hotel_id=p_hotel_id and d.code=p_discount_code and d.active and(d.valid_from is null or d.valid_from<=p_checkin) and(d.valid_to is null or d.valid_to>=(p_checkout-1)); v_discount:=coalesce(v_discount,0); end if;
 select coalesce(sum(case when f.percent is not null then greatest(v_subtotal-v_discount,0)*f.percent/100 else f.amount*case when f.per_night then v_nights else 1 end end),0) into v_fees from public.hotel_os_fees f where f.hotel_id=p_hotel_id and f.active;
 v_total:=greatest(v_subtotal-v_discount,0)+v_fees;
 select id into v_policy from public.hotel_os_policies where hotel_id=p_hotel_id and active order by created_at desc limit 1;
 return jsonb_build_object('nights',v_nights,'rate',v_rate,'subtotal',v_subtotal,'discount',v_discount,'fees',v_fees,'total',v_total,'currency',v_currency,'policy_id',v_policy);
end; $$;
revoke all on function public.hotel_os_calculate_reservation_price(uuid,text,date,date,uuid,text) from public;
grant execute on function public.hotel_os_calculate_reservation_price(uuid,text,date,date,uuid,text) to authenticated;

create or replace function public.hotel_os_availability(p_hotel_id uuid,p_checkin date,p_checkout date,p_adults integer,p_children integer default 0,p_rate_plan_id uuid default null,p_discount_code text default null,p_reservation_id text default null)
returns table(room_type_id text,room_type_name text,room_id text,room_number text,capacity integer,max_adults integer,max_children integer,max_guests integer,beds jsonb,bed_match text,price jsonb,ranking_score integer)
language sql stable security definer set search_path=public as $$
with requested as(select p_adults adults,p_children children,p_adults+p_children total_guests), candidates as(
 select q.id room_id,q.numero room_number,q.tipo_quarto_id,q.capacidade,t.nome room_type_name,coalesce(t.max_adults,t.capacidade) max_adults,coalesce(t.max_children,t.capacidade) max_children,coalesce(t.max_guests,t.capacidade) max_guests
 from public.quartos q join public.tipos_quarto t on t.id=q.tipo_quarto_id cross join requested x
 where q.hotel_id=p_hotel_id and q.ativo and q.status='disponivel' and coalesce(t.max_adults,t.capacidade)>=x.adults and coalesce(t.max_children,t.capacidade)>=x.children and coalesce(t.max_guests,t.capacidade)>=x.total_guests and q.capacidade>=x.total_guests
 and not exists(select 1 from public.reservas r where r.hotel_id=p_hotel_id and r.quarto_id=q.id and(p_reservation_id is null or r.id<>p_reservation_id) and coalesce(r.status,'') not in('cancelada','cancelado','checkout_concluido') and(r.status<>'pendente' or r.hold_expires_at is null or r.hold_expires_at>now()) and r.checkin<p_checkout::timestamptz and r.checkout>p_checkin::timestamptz)
 and not exists(select 1 from public.hotel_os_stays s where s.hotel_id=p_hotel_id and s.room_id=q.id and s.status='checked_in' and s.checked_in_at<p_checkout::timestamptz and(s.checked_out_at is null or s.checked_out_at>p_checkin::timestamptz))
 and not exists(select 1 from public.bloqueios b where b.hotel_id=p_hotel_id and b.quarto_id=q.id and b.data_inicio<p_checkout and b.data_fim>p_checkin)
), beds as(select qc.quarto_id,jsonb_agg(jsonb_build_object('type',coalesce(bt.code,qc.tipo),'name',coalesce(bt.name,qc.tipo),'quantity',qc.quantidade)) value,sum(qc.quantidade*coalesce(bt.capacity,1)) bed_capacity from public.quarto_camas qc left join public.hotel_os_bed_types bt on bt.id=qc.tipo_cama_id group by qc.quarto_id)
select c.tipo_quarto_id,c.room_type_name,c.room_id,c.room_number,c.capacidade,c.max_adults,c.max_children,c.max_guests,coalesce(b.value,'[]'::jsonb),case when coalesce(b.bed_capacity,0)>=r.total_guests then 'GOOD' else 'PARTIAL' end,
case when p_rate_plan_id is null then jsonb_build_object('currency','BRL') else public.hotel_os_calculate_reservation_price(p_hotel_id,c.tipo_quarto_id,p_checkin,p_checkout,p_rate_plan_id,p_discount_code) end,
(100+case when coalesce(b.bed_capacity,0)>=r.total_guests then 30 else 10 end+case when c.capacidade=r.total_guests then 20 else greatest(0,20-(c.capacidade-r.total_guests)*5) end)::integer
from candidates c cross join requested r left join beds b on b.quarto_id=c.room_id order by ranking_score desc,c.capacidade asc,c.room_number asc;
$$;
revoke all on function public.hotel_os_availability(uuid,date,date,integer,integer,uuid,text,text) from public;
grant execute on function public.hotel_os_availability(uuid,date,date,integer,integer,uuid,text,text) to authenticated;

create or replace function public.hotel_os_create_reservation_hold(p_hotel_id uuid,p_checkin date,p_checkout date,p_adults integer,p_children integer,p_room_type_id text,p_rate_plan_id uuid,p_booking_mode text default 'AUTO',p_hold_minutes integer default 15)
returns text language plpgsql security definer set search_path=public as $$
declare v_room_id text;v_id text;v_code text;v_price jsonb;
begin
 if p_checkout<=p_checkin then raise exception 'checkout deve ser posterior ao checkin'; end if;
 if p_adults<1 or p_children<0 then raise exception 'Quantidade de hóspedes inválida'; end if;
 if p_hold_minutes<1 or p_hold_minutes>60 then raise exception 'Prazo de hold inválido'; end if;
 if p_booking_mode not in('AUTO','MANUAL','GUEST_SELECTION') then raise exception 'Modo de reserva inválido'; end if;
 if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_hotel_id::text||':'||p_room_type_id||':'||p_checkin::text||':'||p_checkout::text,0));
 select a.room_id into v_room_id from public.hotel_os_availability(p_hotel_id,p_checkin,p_checkout,p_adults,p_children,p_rate_plan_id,null,null) a where a.room_type_id=p_room_type_id order by a.ranking_score desc,a.room_number limit 1;
 if v_room_id is null then raise exception 'Nenhum quarto disponível para o tipo solicitado'; end if;
 v_id:=gen_random_uuid()::text; v_code:='HTL-'||extract(year from now())::int||'-'||lpad(nextval('public.hotel_os_reservation_code_seq')::text,6,'0'); v_price:=public.hotel_os_calculate_reservation_price(p_hotel_id,p_room_type_id,p_checkin,p_checkout,p_rate_plan_id,null);
 insert into public.reservas(id,hotel_id,quarto_id,tipo_quarto_id,checkin,checkout,status,booking_mode,hold_expires_at,payment_status,adults,children,pricing_snapshot,total_amount,rate_plan_id,codigo_reserva) values(v_id,p_hotel_id,v_room_id,p_room_type_id,p_checkin::timestamptz,p_checkout::timestamptz,'pendente',p_booking_mode,now()+make_interval(mins=>p_hold_minutes),'PAYMENT_PENDING',p_adults,p_children,v_price,(v_price->>'total')::numeric,p_rate_plan_id,v_code);
 return v_id;
end; $$;
revoke all on function public.hotel_os_create_reservation_hold(uuid,date,date,integer,integer,text,uuid,text,integer) from public;
grant execute on function public.hotel_os_create_reservation_hold(uuid,date,date,integer,integer,text,uuid,text,integer) to authenticated;

create or replace function public.hotel_os_confirm_reservation(p_reservation_id text)
returns text language plpgsql security definer set search_path=public as $$
declare r public.reservas%rowtype;v_price jsonb;
begin
 select * into r from public.reservas where id=p_reservation_id for update;
 if not found then raise exception 'Reserva não encontrada'; end if;
 if not public.usuario_pode_hotel(r.hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;
 if r.status<>'pendente' then raise exception 'Reserva não está em HOLD'; end if;
 if r.hold_expires_at is not null and r.hold_expires_at<=now() then update public.reservas set status='cancelada',hold_expires_at=null where id=r.id; raise exception 'HOLD expirado'; end if;
 if r.payment_status<>'PAYMENT_APPROVED' then raise exception 'Pagamento não aprovado'; end if;
 perform pg_advisory_xact_lock(hashtextextended(r.hotel_id::text||':'||coalesce(r.tipo_quarto_id,r.quarto_id)||':'||r.checkin::text||':'||r.checkout::text,0));
 if not public.validar_disponibilidade_quarto(r.hotel_id,r.quarto_id,r.checkin,r.checkout,r.id) then raise exception 'Inventário indisponível para confirmação'; end if;
 v_price:=public.hotel_os_calculate_reservation_price(r.hotel_id,r.tipo_quarto_id,r.checkin::date,r.checkout::date,r.rate_plan_id,null);
 update public.reservas set status='confirmada',hold_expires_at=null,total_amount=(v_price->>'total')::numeric,pricing_snapshot=v_price where id=r.id;
 return r.id;
end; $$;
revoke all on function public.hotel_os_confirm_reservation(text) from public;
grant execute on function public.hotel_os_confirm_reservation(text) to authenticated;

create or replace function public.hotel_os_expire_reservation_holds(p_now timestamptz default now()) returns integer language plpgsql security definer set search_path=public as $$declare v_count integer;begin update public.reservas set status='cancelada',hold_expires_at=null where status='pendente' and hold_expires_at is not null and hold_expires_at<=p_now;get diagnostics v_count=row_count;return v_count;end;$$;
revoke all on function public.hotel_os_expire_reservation_holds(timestamptz) from public;
grant execute on function public.hotel_os_expire_reservation_holds(timestamptz) to authenticated;

alter table public.hotel_os_rate_plans enable row level security; alter table public.hotel_os_rates enable row level security; alter table public.hotel_os_discounts enable row level security; alter table public.hotel_os_fees enable row level security; alter table public.hotel_os_policies enable row level security; alter table public.hotel_os_reservation_guests enable row level security;
create policy hotel_os_rate_plans_access on public.hotel_os_rate_plans for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
create policy hotel_os_rates_access on public.hotel_os_rates for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
create policy hotel_os_discounts_access on public.hotel_os_discounts for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
create policy hotel_os_fees_access on public.hotel_os_fees for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
create policy hotel_os_policies_access on public.hotel_os_policies for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
create policy hotel_os_reservation_guests_access on public.hotel_os_reservation_guests for all to authenticated using(exists(select 1 from public.reservas r where r.id=reservation_id and public.usuario_pode_hotel(r.hotel_id))) with check(exists(select 1 from public.reservas r where r.id=reservation_id and public.usuario_pode_hotel(r.hotel_id)));

create or replace function public.hotel_os_emit_reservation_event() returns trigger language plpgsql security definer set search_path=public as $$declare v_event text;begin v_event:=case when tg_op='INSERT' then 'reservation.created' when new.status='cancelada' then 'reservation.cancelled' else null end;if v_event is not null then perform public.hotel_os_emit_event(new.hotel_id,v_event,'reservations','reservation',null,jsonb_build_object('reservation_id',new.id,'room_id',new.quarto_id,'room_type_id',new.tipo_quarto_id),auth.uid());end if;return new;end;$$;
drop trigger if exists trg_hotel_os_reservation_domain_event on public.reservas;
create trigger trg_hotel_os_reservation_domain_event after insert or update of status on public.reservas for each row execute function public.hotel_os_emit_reservation_event();
