-- FASE 10 — Consolidação incremental de Folio, pagamentos e consumos
-- Preserva hotel_os_folios, hotel_os_folio_items, hotel_os_transactions e PDV existentes.

create extension if not exists pgcrypto;

-- 1. Folio: contrato operacional sem substituir a estrutura existente.
alter table public.hotel_os_folios add column if not exists opened_at timestamptz not null default now();
alter table public.hotel_os_folios add column if not exists created_by uuid;
alter table public.hotel_os_folios add column if not exists closed_by uuid;
alter table public.hotel_os_folios drop constraint if exists hotel_os_folios_status_check;
alter table public.hotel_os_folios add constraint hotel_os_folios_status_check check (upper(status) in ('OPEN','LOCKED','CLOSED','VOID','OPEN','CLOSED'));

-- 2. Folio item: origem idempotente, categoria e trilha de void.
alter table public.hotel_os_folio_items add column if not exists category text;
alter table public.hotel_os_folio_items add column if not exists source_id text;
alter table public.hotel_os_folio_items add column if not exists created_by uuid;
alter table public.hotel_os_folio_items add column if not exists voided_at timestamptz;
alter table public.hotel_os_folio_items add column if not exists voided_by uuid;
alter table public.hotel_os_folio_items add column if not exists void_reason text;
alter table public.hotel_os_folio_items add column if not exists total_amount numeric(12,2);
update public.hotel_os_folio_items set total_amount=coalesce(total, round(quantity*unit_amount,2)) where total_amount is null;
update public.hotel_os_folio_items set category=case upper(coalesce(source,'')) when 'ROOM' then 'ROOM' when 'POS' then 'FOOD' when 'FRIGOBAR' then 'MINIBAR' when 'ROOM_SERVICE' then 'ROOM_SERVICE' when 'LAUNDRY' then 'LAUNDRY' when 'TAX' then 'TAX' when 'DISCOUNT' then 'DISCOUNT' else 'OTHER' end where category is null;
create unique index if not exists uq_hotel_os_folio_item_source on public.hotel_os_folio_items(folio_id,source,source_id) where source is not null and source_id is not null;
create index if not exists idx_hotel_os_folio_items_folio_category on public.hotel_os_folio_items(folio_id,category,created_at desc);

-- 3. Pagamento dedicado. Transactions legadas permanecem como trilha financeira.
create table if not exists public.hotel_os_payments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  folio_id uuid not null references public.hotel_os_folios(id),
  amount numeric(12,2) not null check(amount>0),
  method text not null check(method in ('CASH','CREDIT_CARD','DEBIT_CARD','PIX','BANK_TRANSFER','OTHER')),
  status text not null default 'PENDING' check(status in ('PENDING','CONFIRMED','PARTIALLY_PAID','PAID','FAILED','REFUNDED','VOIDED')),
  transaction_reference text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_by uuid,
  refunded_at timestamptz,
  refunded_by uuid,
  refund_reason text
);
create unique index if not exists uq_hotel_os_payment_idempotency on public.hotel_os_payments(hotel_id,idempotency_key) where idempotency_key is not null;
create index if not exists idx_hotel_os_payments_folio_status on public.hotel_os_payments(folio_id,status,created_at desc);

-- 4. Descontos auditáveis sem mutar silenciosamente o preço original.
create table if not exists public.hotel_os_folio_discounts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  folio_id uuid not null references public.hotel_os_folios(id),
  folio_item_id uuid references public.hotel_os_folio_items(id),
  discount_type text not null check(discount_type in ('PERCENT','FIXED')),
  value numeric(12,2) not null check(value>=0),
  reason text not null,
  approved_by uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- 5. Preparação para split sem duplicar itens: alocações por pagador.
create table if not exists public.hotel_os_folio_payers (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  folio_id uuid not null references public.hotel_os_folios(id),
  payer_type text not null check(payer_type in ('GUEST','COMPANY','AGENCY','OTHER')),
  guest_id text,
  name text,
  created_at timestamptz not null default now()
);
create table if not exists public.hotel_os_folio_item_allocations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  folio_item_id uuid not null references public.hotel_os_folio_items(id),
  payer_id uuid not null references public.hotel_os_folio_payers(id),
  amount numeric(12,2) not null check(amount>0),
  created_at timestamptz not null default now(),
  unique(folio_item_id,payer_id)
);

-- 6. Segurança por hotel.
alter table public.hotel_os_payments enable row level security;
alter table public.hotel_os_folio_discounts enable row level security;
alter table public.hotel_os_folio_payers enable row level security;
alter table public.hotel_os_folio_item_allocations enable row level security;

do $$ begin
  execute 'create policy hotel_os_payments_tenant on public.hotel_os_payments for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id))';
exception when duplicate_object then null; end $$;
do $$ begin
  execute 'create policy hotel_os_folio_discounts_tenant on public.hotel_os_folio_discounts for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id))';
exception when duplicate_object then null; end $$;
do $$ begin
  execute 'create policy hotel_os_folio_payers_tenant on public.hotel_os_folio_payers for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id))';
exception when duplicate_object then null; end $$;
do $$ begin
  execute 'create policy hotel_os_folio_item_allocations_tenant on public.hotel_os_folio_item_allocations for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id))';
exception when duplicate_object then null; end $$;

-- 7. Criação idempotente de lançamento no Folio.
create or replace function public.hotel_os_add_folio_item(
  p_folio_id uuid,
  p_category text,
  p_description text,
  p_quantity numeric,
  p_unit_price numeric,
  p_source text,
  p_source_id text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare f record; v_id uuid; v_total numeric(12,2);
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'FOLIO_NOT_FOUND'; end if;
  if upper(f.status) not in ('OPEN','LOCKED') then raise exception 'FOLIO_NOT_OPEN'; end if;
  if not public.usuario_pode_hotel(f.hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
  if p_quantity<=0 or p_unit_price<0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_source_id is not null then
    select id into v_id from public.hotel_os_folio_items where folio_id=p_folio_id and source=p_source and source_id=p_source_id;
    if v_id is not null then return v_id; end if;
  end if;
  v_total:=round(p_quantity*p_unit_price,2);
  insert into public.hotel_os_folio_items(hotel_id,folio_id,item_type,description,quantity,unit_amount,total,source,source_id,category,status,total_amount,created_by)
  values(f.hotel_id,p_folio_id,'adjustment',p_description,p_quantity,p_unit_price,v_total,p_source,p_source_id,p_category,'active',v_total,auth.uid()) returning id into v_id;
  perform public.hotel_os_emit_event(f.hotel_id,'folio.item_added','FOLIO','FolioItem',v_id,jsonb_build_object('folio_id',p_folio_id,'source',p_source,'source_id',p_source_id,'total',v_total),auth.uid());
  perform public.hotel_os_record_audit(f.hotel_id,'folio_item_created','folio_item',v_id::text,null,jsonb_build_object('folio_id',p_folio_id,'source',p_source,'source_id',p_source_id,'total',v_total),'{}');
  return v_id;
end; $$;
revoke all on function public.hotel_os_add_folio_item(uuid,text,text,numeric,numeric,text,text) from public;
grant execute on function public.hotel_os_add_folio_item(uuid,text,text,numeric,numeric,text,text) to authenticated;

-- 8. Pagamento confirmado de forma idempotente.
create or replace function public.hotel_os_create_payment(
  p_folio_id uuid,
  p_amount numeric,
  p_method text,
  p_transaction_reference text default null,
  p_idempotency_key text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare f record; v_payment uuid; v_total numeric(12,2); v_paid numeric(12,2); v_status text;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'FOLIO_NOT_FOUND'; end if;
  if upper(f.status) not in ('OPEN','LOCKED') then raise exception 'FOLIO_NOT_OPEN'; end if;
  if not public.usuario_pode_hotel(f.hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
  if p_amount<=0 then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;
  if p_idempotency_key is not null then
    select id into v_payment from public.hotel_os_payments where hotel_id=f.hotel_id and idempotency_key=p_idempotency_key;
    if v_payment is not null then return v_payment; end if;
  end if;
  insert into public.hotel_os_payments(hotel_id,folio_id,amount,method,status,transaction_reference,idempotency_key,created_by,confirmed_at)
  values(f.hotel_id,p_folio_id,p_amount,p_method,'CONFIRMED',p_transaction_reference,p_idempotency_key,auth.uid(),now()) returning id into v_payment;
  insert into public.hotel_os_transactions(hotel_id,folio_id,amount,method,payment_method,transaction_type,status,created_by)
  values(f.hotel_id,p_folio_id,p_amount,p_method,p_method,'payment','approved',auth.uid());
  select coalesce(sum(total_amount),0) into v_total from public.hotel_os_folio_items where folio_id=p_folio_id and status='active';
  select coalesce(sum(amount),0) into v_paid from public.hotel_os_payments where folio_id=p_folio_id and status='CONFIRMED';
  v_status:=case when v_paid=0 then 'PENDING' when v_paid<v_total then 'PARTIALLY_PAID' else 'PAID' end;
  perform public.hotel_os_emit_event(f.hotel_id,'folio.payment_created','PAYMENT','Payment',v_payment,jsonb_build_object('folio_id',p_folio_id,'amount',p_amount,'financial_status',v_status),auth.uid());
  perform public.hotel_os_record_audit(f.hotel_id,'payment_created','payment',v_payment::text,null,jsonb_build_object('folio_id',p_folio_id,'amount',p_amount,'method',p_method,'financial_status',v_status),'{}');
  return v_payment;
end; $$;
revoke all on function public.hotel_os_create_payment(uuid,numeric,text,text,text) from public;
grant execute on function public.hotel_os_create_payment(uuid,numeric,text,text,text) to authenticated;

-- 9. Void preservando histórico.
create or replace function public.hotel_os_void_folio_item(p_folio_item_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare i record;
begin
  select * into i from public.hotel_os_folio_items where id=p_folio_item_id for update;
  if not found then raise exception 'FOLIO_ITEM_NOT_FOUND'; end if;
  if not public.usuario_pode_hotel(i.hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
  if i.status<>'active' then raise exception 'FOLIO_ITEM_NOT_ACTIVE'; end if;
  update public.hotel_os_folio_items set status='voided',voided_at=now(),voided_by=auth.uid(),void_reason=p_reason where id=i.id;
  perform public.hotel_os_emit_event(i.hotel_id,'folio.item_voided','FOLIO','FolioItem',i.id,jsonb_build_object('reason',p_reason),auth.uid());
  perform public.hotel_os_record_audit(i.hotel_id,'folio_item_voided','folio_item',i.id::text,null,jsonb_build_object('reason',p_reason),'{}');
  return i.id;
end; $$;
revoke all on function public.hotel_os_void_folio_item(uuid,text) from public;
grant execute on function public.hotel_os_void_folio_item(uuid,text) to authenticated;
