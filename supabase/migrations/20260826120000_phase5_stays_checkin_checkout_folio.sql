-- FASE 5 — Hospedagem, Check-in, Check-out e Folio
-- Incremental: preserva reservas, pagamentos e contas legadas.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. STAY — contrato operacional completo
-- ============================================================
alter table public.hotel_os_stays add column if not exists primary_guest_id text;
alter table public.hotel_os_stays add column if not exists actual_check_in_at timestamptz;
alter table public.hotel_os_stays add column if not exists expected_check_out date;
alter table public.hotel_os_stays add column if not exists actual_check_out_at timestamptz;

alter table public.hotel_os_stays drop constraint if exists hotel_os_stays_status_check;
alter table public.hotel_os_stays add constraint hotel_os_stays_status_check
  check (status in ('EXPECTED','CHECKED_IN','CHECKED_OUT','CANCELLED'));

update public.hotel_os_stays
set status = case status
  when 'checked_in' then 'CHECKED_IN'
  when 'checked_out' then 'CHECKED_OUT'
  when 'cancelled' then 'CANCELLED'
  else 'EXPECTED'
end;

update public.hotel_os_stays s
set expected_check_out = coalesce(s.expected_check_out, (r.checkout_horario::timestamptz)::date),
    actual_check_in_at = coalesce(s.actual_check_in_at, case when s.status in ('CHECKED_IN','CHECKED_OUT') then r.checkin_horario::timestamptz end),
    actual_check_out_at = coalesce(s.actual_check_out_at, s.checked_out_at),
    primary_guest_id = coalesce(s.primary_guest_id, r.hospede_id)
from public.reservas r
where r.id = s.reservation_id;

alter table public.hotel_os_stays alter column expected_check_out set not null;

create index if not exists idx_hotel_os_stays_room_dates
  on public.hotel_os_stays(hotel_id,room_id,expected_check_out,status);
create unique index if not exists uq_hotel_os_one_checked_in_stay_room
  on public.hotel_os_stays(room_id) where status = 'CHECKED_IN';

-- ============================================================
-- 2. FOLIO — conta central da estadia
-- ============================================================
alter table public.hotel_os_folio_items add column if not exists source text;
alter table public.hotel_os_folio_items add column if not exists total numeric(12,2);
alter table public.hotel_os_folio_items add column if not exists status text not null default 'active';

update public.hotel_os_folio_items
set source = case item_type
  when 'room' then 'ROOM'
  when 'order' then 'POS'
  when 'minibar' then 'FRIGOBAR'
  when 'payment' then 'MANUAL'
  when 'refund' then 'ADJUSTMENT'
  when 'tax' then 'TAX'
  when 'adjustment' then 'ADJUSTMENT'
  else 'MANUAL'
end
where source is null;

update public.hotel_os_folio_items
set total = round(quantity * unit_amount, 2)
where total is null;

alter table public.hotel_os_folio_items add constraint hotel_os_folio_item_source_check
  check (source in ('ROOM','POS','FRIGOBAR','ROOM_SERVICE','LAUNDRY','MANUAL','TAX','DISCOUNT','ADJUSTMENT'));
alter table public.hotel_os_folio_items add constraint hotel_os_folio_item_status_check
  check (status in ('active','voided','refunded','transferred'));
alter table public.hotel_os_folio_items add constraint hotel_os_folio_item_total_check
  check (total >= 0);

create index if not exists idx_hotel_os_folio_items_source_status
  on public.hotel_os_folio_items(hotel_id,source,status,created_at desc);

-- ============================================================
-- 3. PAGAMENTOS — métodos e parcialidade no domínio
-- ============================================================
alter table public.hotel_os_transactions add column if not exists payment_method text;
alter table public.hotel_os_transactions add column if not exists folio_item_id uuid references public.hotel_os_folio_items(id) on delete set null;

update public.hotel_os_transactions
set payment_method = coalesce(payment_method, method)
where payment_method is null;

alter table public.hotel_os_transactions add constraint hotel_os_payment_method_check
  check (payment_method is null or payment_method in ('CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER'));

create index if not exists idx_hotel_os_transactions_folio_method
  on public.hotel_os_transactions(folio_id,payment_method,created_at desc);

-- ============================================================
-- 4. HELPERS DE PERMISSÃO / TENANT
-- ============================================================
create or replace function public.hotel_os_require_stay_permission(p_hotel_id uuid, p_permission text)
returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_hotel_id is null or not public.usuario_pode_hotel(p_hotel_id) then
    raise exception 'Usuário sem acesso ao hotel';
  end if;
  -- A camada RLS continua sendo definitiva. Quando a função RBAC existir,
  -- ela deve negar a operação antes da alteração de estado.
  begin
    if not public.user_has_permission(p_permission) then
      raise exception 'PERMISSION_DENIED:%', p_permission;
    end if;
  exception when undefined_function then
    -- Compatibilidade com instalações anteriores à função RBAC.
    null;
  end;
end;
$$;

revoke all on function public.hotel_os_require_stay_permission(uuid,text) from public;
grant execute on function public.hotel_os_require_stay_permission(uuid,text) to authenticated;

-- ============================================================
-- 5. CHECK-IN ATÔMICO
-- ============================================================
create or replace function public.hotel_os_check_in(
  p_reservation_id text,
  p_room_id text default null,
  p_primary_guest_id text default null,
  p_require_document boolean default false
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  r record;
  v_room text;
  v_guest text;
  v_stay uuid;
  v_folio uuid;
  v_guest_json jsonb;
begin
  select * into r from public.reservas where id=p_reservation_id for update;
  if not found then raise exception 'Reserva não encontrada'; end if;
  perform public.hotel_os_require_stay_permission(r.hotel_id,'check_in');

  if r.status not in ('confirmada','pendente') then
    raise exception 'Reserva não está apta para check-in';
  end if;

  v_guest := coalesce(p_primary_guest_id, r.hospede_id);
  if v_guest is null then raise exception 'Hóspede titular obrigatório'; end if;
  if not exists(select 1 from public.hospedes h where h.id=v_guest and h.hotel_id=r.hotel_id) then
    raise exception 'Hóspede não pertence ao hotel';
  end if;

  if p_require_document then
    select to_jsonb(h) into v_guest_json from public.hospedes h where h.id=v_guest;
    if coalesce(nullif(trim(v_guest_json->>'documento'),''), nullif(trim(v_guest_json->>'document'),''), nullif(trim(v_guest_json->>'cpf'),''), nullif(trim(v_guest_json->>'passaporte'),'')) is null then
      raise exception 'Documento do hóspede não informado';
    end if;
  end if;

  v_room := coalesce(p_room_id, r.quarto_id);
  if v_room is null then
    execute 'select q.id from public.quartos q where q.hotel_id=$1 and q.tipo_quarto_id=$2 and q.status <> ''manutencao'' and q.status <> ''ocupado'' and not exists (select 1 from public.hotel_os_stays s where s.room_id=q.id::text and s.status=''CHECKED_IN'') order by q.id limit 1'
      into v_room using r.hotel_id, r.tipo_quarto_id;
  end if;
  if v_room is null then raise exception 'Nenhum quarto disponível para a reserva'; end if;

  if exists(select 1 from public.bloqueios b where b.hotel_id=r.hotel_id and b.quarto_id=v_room and b.data_inicio < r.checkout_horario::date and b.data_fim > r.checkin_horario::date) then
    raise exception 'Quarto bloqueado no período';
  end if;

  if exists(select 1 from public.hotel_os_stays s where s.hotel_id=r.hotel_id and s.room_id=v_room and s.status='CHECKED_IN') then
    raise exception 'Quarto já possui hospedagem ativa';
  end if;

  insert into public.hotel_os_stays(hotel_id,reservation_id,room_id,primary_guest_id,status,actual_check_in_at,expected_check_out)
  values(r.hotel_id,r.id,v_room,v_guest,'CHECKED_IN',now(),r.checkout_horario::date)
  on conflict (reservation_id) do update set room_id=excluded.room_id, primary_guest_id=excluded.primary_guest_id, status='CHECKED_IN', actual_check_in_at=coalesce(public.hotel_os_stays.actual_check_in_at,now()), expected_check_out=excluded.expected_check_out
  returning id into v_stay;

  insert into public.hotel_os_stay_guests(stay_id,guest_id,is_primary)
  values(v_stay,v_guest,true)
  on conflict(stay_id,guest_id) do update set is_primary=true;

  insert into public.hotel_os_folios(hotel_id,stay_id,status,currency)
  values(r.hotel_id,v_stay,'open','BRL')
  on conflict(stay_id) do update set status='open', closed_at=null
  returning id into v_folio;

  update public.reservas set status='checkin_realizado', quarto_id=v_room where id=r.id;
  update public.quartos set status='ocupado' where id=v_room and hotel_id=r.hotel_id;

  perform public.hotel_os_emit_event(r.hotel_id,'stay.checked_in','STAY','Stay',v_stay,jsonb_build_object('reservation_id',r.id,'room_id',v_room,'folio_id',v_folio),auth.uid());
  perform public.hotel_os_emit_event(r.hotel_id,'room.occupied','STAY','Room',v_room::uuid,jsonb_build_object('stay_id',v_stay),auth.uid());
  perform public.hotel_os_record_audit(r.hotel_id,'check_in','stay',v_stay::text,null,jsonb_build_object('reservation_id',r.id,'room_id',v_room,'guest_id',v_guest), '{}');
  return v_stay;
end;
$$;

revoke all on function public.hotel_os_check_in(text,text,text,boolean) from public;
grant execute on function public.hotel_os_check_in(text,text,text,boolean) to authenticated;

-- ============================================================
-- 6. WALK-IN ATÔMICO
-- ============================================================
create or replace function public.hotel_os_walk_in(
  p_hotel_id uuid,
  p_room_id text,
  p_primary_guest_id text,
  p_expected_check_out date,
  p_adults integer default 1,
  p_children integer default 0
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  v_reservation_id text;
  v_stay uuid;
  v_hotel_code text;
begin
  perform public.hotel_os_require_stay_permission(p_hotel_id,'check_in');
  if p_expected_check_out <= current_date then raise exception 'Data de saída inválida'; end if;
  if p_adults < 1 or p_children < 0 then raise exception 'Ocupação inválida'; end if;
  if not exists(select 1 from public.quartos q where q.id=p_room_id and q.hotel_id=p_hotel_id and q.status not in ('ocupado','manutencao')) then
    raise exception 'Quarto indisponível';
  end if;
  if not exists(select 1 from public.hospedes h where h.id=p_primary_guest_id and h.hotel_id=p_hotel_id) then
    raise exception 'Hóspede não pertence ao hotel';
  end if;

  v_reservation_id := gen_random_uuid()::text;
  insert into public.reservas(id,hotel_id,hospede_id,quarto_id,status,checkin_horario,checkout_horario)
  values(v_reservation_id,p_hotel_id,p_primary_guest_id,p_room_id,'confirmada',now(),p_expected_check_out::timestamptz);

  select public.hotel_os_check_in(v_reservation_id,p_room_id,p_primary_guest_id,false) into v_stay;
  return v_stay;
end;
$$;
revoke all on function public.hotel_os_walk_in(uuid,text,text,date,integer,integer) from public;
grant execute on function public.hotel_os_walk_in(uuid,text,text,date,integer,integer) to authenticated;

-- ============================================================
-- 7. CHECK-OUT ATÔMICO
-- ============================================================
create or replace function public.hotel_os_check_out(p_stay_id uuid, p_allow_balance boolean default false)
returns uuid
language plpgsql security definer set search_path=public as $$
declare
  s record;
  f record;
  v_balance numeric(12,2);
  v_task uuid;
begin
  select * into s from public.hotel_os_stays where id=p_stay_id for update;
  if not found then raise exception 'Stay não encontrada'; end if;
  perform public.hotel_os_require_stay_permission(s.hotel_id,'check_out');
  if s.status <> 'CHECKED_IN' then raise exception 'Stay não está em CHECKED_IN'; end if;

  select * into f from public.hotel_os_folios where stay_id=s.id for update;
  if not found then raise exception 'Folio não encontrado'; end if;

  select round(coalesce(sum(case when i.status='active' then i.total else 0 end),0) - coalesce((select sum(t.amount) from public.hotel_os_transactions t where t.folio_id=f.id and t.transaction_type='payment' and t.status='approved'),0) + coalesce((select sum(t.amount) from public.hotel_os_transactions t where t.folio_id=f.id and t.transaction_type='refund' and t.status in ('approved','refunded')),0),2) into v_balance
  from public.hotel_os_folio_items i where i.folio_id=f.id;

  if v_balance > 0 and not p_allow_balance then
    raise exception 'Folio possui saldo pendente: %',v_balance;
  end if;
  if v_balance > 0 and p_allow_balance then
    perform public.hotel_os_record_audit(s.hotel_id,'checkout_with_balance','stay',s.id::text,null,jsonb_build_object('balance',v_balance),'{}');
  end if;

  update public.hotel_os_stays set status='CHECKED_OUT', actual_check_out_at=now(), checked_out_at=now() where id=s.id;
  update public.hotel_os_folios set status='closed', closed_at=now() where id=f.id;
  update public.reservas set status='checkout_concluido' where id=s.reservation_id;
  update public.quartos set status='sujo' where id=s.room_id and hotel_id=s.hotel_id;

  insert into public.hotel_os_tasks(hotel_id,title,description,department,status,priority,room_id,reservation_id,metadata,created_by)
  values(s.hotel_id,'Limpeza pós-checkout','Quarto liberado após checkout','governanca','pendente','normal',s.room_id::uuid,s.reservation_id::uuid,jsonb_build_object('source','checkout','stay_id',s.id),auth.uid())
  returning id into v_task;

  perform public.hotel_os_emit_event(s.hotel_id,'stay.checked_out','STAY','Stay',s.id,jsonb_build_object('folio_id',f.id,'balance',v_balance),auth.uid());
  perform public.hotel_os_emit_event(s.hotel_id,'room.dirty','STAY','Room',s.room_id::uuid,jsonb_build_object('stay_id',s.id,'housekeeping_task_id',v_task),auth.uid());
  perform public.hotel_os_record_audit(s.hotel_id,'check_out','stay',s.id::text,null,jsonb_build_object('folio_id',f.id,'balance',v_balance), '{}');
  return s.id;
end;
$$;
revoke all on function public.hotel_os_check_out(uuid,boolean) from public;
grant execute on function public.hotel_os_check_out(uuid,boolean) to authenticated;

-- ============================================================
-- 8. TROCA DE QUARTO
-- ============================================================
create or replace function public.hotel_os_change_stay_room(p_stay_id uuid,p_new_room_id text,p_reason text)
returns uuid
language plpgsql security definer set search_path=public as $$
declare s record; old_room text;
begin
  select * into s from public.hotel_os_stays where id=p_stay_id for update;
  if not found then raise exception 'Stay não encontrada'; end if;
  perform public.hotel_os_require_stay_permission(s.hotel_id,'room_change');
  if s.status <> 'CHECKED_IN' then raise exception 'Troca somente para hospedagem ativa'; end if;
  if not exists(select 1 from public.quartos q where q.id=p_new_room_id and q.hotel_id=s.hotel_id and q.status not in ('ocupado','manutencao')) then raise exception 'Novo quarto indisponível'; end if;
  if exists(select 1 from public.hotel_os_stays x where x.room_id=p_new_room_id and x.status='CHECKED_IN') then raise exception 'Novo quarto já ocupado'; end if;
  old_room:=s.room_id;
  update public.hotel_os_stays set room_id=p_new_room_id where id=s.id;
  update public.quartos set status='sujo' where id=old_room and hotel_id=s.hotel_id;
  update public.quartos set status='ocupado' where id=p_new_room_id and hotel_id=s.hotel_id;
  perform public.hotel_os_record_audit(s.hotel_id,'room_change','stay',s.id::text,jsonb_build_object('old_room_id',old_room),jsonb_build_object('new_room_id',p_new_room_id,'reason',p_reason),'{}');
  perform public.hotel_os_emit_event(s.hotel_id,'room.changed','STAY','Stay',s.id,jsonb_build_object('old_room_id',old_room,'new_room_id',p_new_room_id,'reason',p_reason),auth.uid());
  return s.id;
end;
$$;
revoke all on function public.hotel_os_change_stay_room(uuid,text,text) from public;
grant execute on function public.hotel_os_change_stay_room(uuid,text,text) to authenticated;

-- ============================================================
-- 9. EXTENSÃO DE ESTADIA
-- ============================================================
create or replace function public.hotel_os_extend_stay(p_stay_id uuid,p_expected_check_out date)
returns uuid
language plpgsql security definer set search_path=public as $$
declare s record;
begin
  select * into s from public.hotel_os_stays where id=p_stay_id for update;
  if not found then raise exception 'Stay não encontrada'; end if;
  perform public.hotel_os_require_stay_permission(s.hotel_id,'check_out');
  if s.status <> 'CHECKED_IN' then raise exception 'Stay não está ativa'; end if;
  if p_expected_check_out <= s.expected_check_out then raise exception 'Extensão deve aumentar a data de saída'; end if;
  if exists(select 1 from public.hotel_os_stays x where x.hotel_id=s.hotel_id and x.room_id=s.room_id and x.id<>s.id and x.status in ('EXPECTED','CHECKED_IN') and x.actual_check_in_at < p_expected_check_out::timestamptz and coalesce(x.actual_check_out_at,x.expected_check_out::timestamptz) > s.expected_check_out::timestamptz) then
    raise exception 'Quarto sem disponibilidade para extensão';
  end if;
  update public.hotel_os_stays set expected_check_out=p_expected_check_out where id=s.id;
  perform public.hotel_os_record_audit(s.hotel_id,'stay_extended','stay',s.id::text,jsonb_build_object('expected_check_out',s.expected_check_out),jsonb_build_object('expected_check_out',p_expected_check_out),'{}');
  return s.id;
end;
$$;
revoke all on function public.hotel_os_extend_stay(uuid,date) from public;
grant execute on function public.hotel_os_extend_stay(uuid,date) to authenticated;

-- ============================================================
-- 10. RLS DAS NOVAS/EVOLUÍDAS ESTRUTURAS
-- ============================================================
alter table public.hotel_os_stays enable row level security;
alter table public.hotel_os_stay_guests enable row level security;
alter table public.hotel_os_folios enable row level security;
alter table public.hotel_os_folio_items enable row level security;
alter table public.hotel_os_transactions enable row level security;

drop policy if exists hotel_os_stays_hotel_access on public.hotel_os_stays;
create policy hotel_os_stays_hotel_access on public.hotel_os_stays for all to authenticated
using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_stay_guests_hotel_access on public.hotel_os_stay_guests;
create policy hotel_os_stay_guests_hotel_access on public.hotel_os_stay_guests for all to authenticated
using (exists(select 1 from public.hotel_os_stays s where s.id=stay_id and public.usuario_pode_hotel(s.hotel_id)))
with check (exists(select 1 from public.hotel_os_stays s where s.id=stay_id and public.usuario_pode_hotel(s.hotel_id)));

drop policy if exists hotel_os_folios_hotel_access on public.hotel_os_folios;
create policy hotel_os_folios_hotel_access on public.hotel_os_folios for all to authenticated
using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_folio_items_hotel_access on public.hotel_os_folio_items;
create policy hotel_os_folio_items_hotel_access on public.hotel_os_folio_items for all to authenticated
using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_transactions_hotel_access on public.hotel_os_transactions;
create policy hotel_os_transactions_hotel_access on public.hotel_os_transactions for all to authenticated
using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

-- Integridade StayGuest: hóspede precisa pertencer ao mesmo hotel da estadia.
create or replace function public.hotel_os_validate_stay_guest_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.hotel_os_stays s join public.hospedes h on h.id=new.guest_id where s.id=new.stay_id and s.hotel_id=h.hotel_id) then
    raise exception 'Hóspede não pertence ao hotel da Stay';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_hotel_os_validate_stay_guest_tenant on public.hotel_os_stay_guests;
create trigger trg_hotel_os_validate_stay_guest_tenant before insert or update on public.hotel_os_stay_guests for each row execute function public.hotel_os_validate_stay_guest_tenant();

-- ============================================================
-- 11. VIEWS DE SALDO E ESTADIA
-- ============================================================
create or replace view public.hotel_os_stay_folio_balance as
select f.id as folio_id,f.hotel_id,f.stay_id,f.status,
       round(coalesce(sum(case when i.status='active' then i.total else 0 end),0),2) as charges,
       round(coalesce((select sum(t.amount) from public.hotel_os_transactions t where t.folio_id=f.id and t.transaction_type='payment' and t.status='approved'),0),2) as payments,
       round(coalesce((select sum(t.amount) from public.hotel_os_transactions t where t.folio_id=f.id and t.transaction_type='refund' and t.status in ('approved','refunded')),0),2) as refunds,
       round(coalesce(sum(case when i.status='active' then i.total else 0 end),0)
         - coalesce((select sum(t.amount) from public.hotel_os_transactions t where t.folio_id=f.id and t.transaction_type='payment' and t.status='approved'),0)
         + coalesce((select sum(t.amount) from public.hotel_os_transactions t where t.folio_id=f.id and t.transaction_type='refund' and t.status in ('approved','refunded')),0),2) as balance
from public.hotel_os_folios f
left join public.hotel_os_folio_items i on i.folio_id=f.id
group by f.id;

-- ============================================================
-- 12. PRE-CHECK-IN / POLÍTICAS EARLY/LATE
-- ============================================================
create table if not exists public.hotel_os_pre_checkins (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  reservation_id text not null references public.reservas(id) on delete cascade,
  guest_id text references public.hospedes(id) on delete set null,
  status text not null default 'pending' check(status in ('pending','completed','cancelled')),
  data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(reservation_id)
);

create table if not exists public.hotel_os_stay_policies (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  policy_type text not null check(policy_type in ('early_checkin','late_checkout')),
  active boolean not null default true,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(hotel_id,policy_type)
);

alter table public.hotel_os_pre_checkins enable row level security;
create policy hotel_os_pre_checkins_hotel_access on public.hotel_os_pre_checkins for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
alter table public.hotel_os_stay_policies enable row level security;
create policy hotel_os_stay_policies_hotel_access on public.hotel_os_stay_policies for all to authenticated using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
