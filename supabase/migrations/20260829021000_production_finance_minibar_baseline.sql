-- Production compatibility baseline for the current single-hotel schema.
-- Additive only: does not replace Reception/Governance lifecycle tables or RPCs.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. FINANCIAL PROJECTION: reservation -> stay -> folio
-- ============================================================
create table if not exists public.hotel_os_stays (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  reservation_id text not null references public.reservas(id) on delete cascade,
  room_id text references public.quartos(id) on delete set null,
  primary_guest_id text references public.hospedes(id) on delete set null,
  status text not null default 'EXPECTED' check (status in ('EXPECTED','CHECKED_IN','CHECKED_OUT','CANCELLED')),
  actual_check_in_at timestamptz,
  actual_check_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(reservation_id)
);

create table if not exists public.hotel_os_folios (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  stay_id uuid not null references public.hotel_os_stays(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed')),
  currency text not null default 'BRL',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(stay_id)
);

create table if not exists public.hotel_os_folio_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  folio_id uuid not null references public.hotel_os_folios(id) on delete cascade,
  item_type text not null default 'other',
  source text not null,
  source_key text,
  description text not null,
  quantity numeric(14,3) not null check(quantity>0),
  unit_amount numeric(14,2) not null check(unit_amount>=0),
  total numeric(14,2) not null check(total>=0),
  status text not null default 'active' check(status in ('active','voided','refunded','transferred')),
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_os_transactions (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  folio_id uuid not null references public.hotel_os_folios(id) on delete cascade,
  transaction_type text not null check(transaction_type in ('payment','refund')),
  amount numeric(14,2) not null check(amount>=0),
  method text,
  payment_method text,
  status text not null default 'approved',
  external_reference text,
  idempotency_key text,
  created_by text,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_hotel_os_folio_item_source_key
  on public.hotel_os_folio_items(folio_id,source,source_key) where source_key is not null;
create unique index if not exists uq_hotel_os_transaction_idempotency
  on public.hotel_os_transactions(folio_id,idempotency_key) where idempotency_key is not null;
create index if not exists idx_hotel_os_stays_room_status on public.hotel_os_stays(room_id,status);
create index if not exists idx_hotel_os_folio_items_folio_created on public.hotel_os_folio_items(folio_id,created_at);

create or replace function public.hotel_os_sync_financial_projection_from_reservation()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_stay uuid;
begin
  if new.status='checkin_realizado' and new.quarto_id is not null then
    insert into public.hotel_os_stays(hotel_id,reservation_id,room_id,primary_guest_id,status,actual_check_in_at,actual_check_out_at,updated_at)
    values('default_hotel',new.id,new.quarto_id,new.hospede_id,'CHECKED_IN',coalesce(old.created_at,now()),null,now())
    on conflict(reservation_id) do update set
      room_id=excluded.room_id,
      primary_guest_id=excluded.primary_guest_id,
      status='CHECKED_IN',
      actual_check_in_at=coalesce(public.hotel_os_stays.actual_check_in_at,now()),
      actual_check_out_at=null,
      updated_at=now()
    returning id into v_stay;

    insert into public.hotel_os_folios(hotel_id,stay_id,status,currency)
    values('default_hotel',v_stay,'open','BRL')
    on conflict(stay_id) do nothing;
  elsif new.status='checkout_concluido' then
    update public.hotel_os_stays
       set status='CHECKED_OUT',actual_check_out_at=coalesce(actual_check_out_at,now()),updated_at=now()
     where reservation_id=new.id and status='CHECKED_IN';
  elsif new.status='cancelada' then
    update public.hotel_os_stays set status='CANCELLED',updated_at=now()
     where reservation_id=new.id and status='EXPECTED';
  end if;
  return new;
end; $$;

drop trigger if exists trg_reservas_financial_projection on public.reservas;
create trigger trg_reservas_financial_projection
after insert or update of status,quarto_id,hospede_id on public.reservas
for each row execute function public.hotel_os_sync_financial_projection_from_reservation();

-- Backfill active check-ins without changing Reception state.
insert into public.hotel_os_stays(hotel_id,reservation_id,room_id,primary_guest_id,status,actual_check_in_at)
select 'default_hotel',r.id,r.quarto_id,r.hospede_id,'CHECKED_IN',coalesce(r.created_at,now())
from public.reservas r
where r.status='checkin_realizado' and r.quarto_id is not null
on conflict(reservation_id) do update set room_id=excluded.room_id,primary_guest_id=excluded.primary_guest_id,status='CHECKED_IN',updated_at=now();

insert into public.hotel_os_folios(hotel_id,stay_id,status,currency)
select 'default_hotel',s.id,'open','BRL' from public.hotel_os_stays s
where s.status='CHECKED_IN'
on conflict(stay_id) do nothing;

-- ============================================================
-- 2. FINANCIAL ENGINE RPCs
-- ============================================================
create or replace function public.hotel_os_financial_add_charge(
  p_folio_id uuid,p_source text,p_source_key text,p_description text,p_quantity numeric,p_unit_price numeric
) returns uuid language plpgsql security definer set search_path=public as $$
declare f record; v_existing uuid; v_id uuid; v_item_type text;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  if f.status <> 'open' then raise exception 'Folio não está aberto'; end if;
  if p_quantity<=0 or p_unit_price<0 then raise exception 'Quantidade/preço inválidos'; end if;
  if nullif(trim(coalesce(p_description,'')),'') is null then raise exception 'Descrição obrigatória'; end if;
  if p_source not in ('ROOM','POS','FRIGOBAR','ROOM_SERVICE','LAUNDRY','MANUAL','TAX','DISCOUNT','ADJUSTMENT') then raise exception 'Origem de Folio inválida'; end if;
  if nullif(trim(coalesce(p_source_key,'')),'') is not null then
    select id into v_existing from public.hotel_os_folio_items where folio_id=p_folio_id and source=p_source and source_key=p_source_key limit 1;
    if v_existing is not null then return v_existing; end if;
  end if;
  v_item_type:=case p_source when 'ROOM' then 'room' when 'POS' then 'order' when 'FRIGOBAR' then 'minibar' when 'TAX' then 'tax' else 'other' end;
  insert into public.hotel_os_folio_items(hotel_id,folio_id,item_type,source,source_key,description,quantity,unit_amount,total,status)
  values(f.hotel_id,f.id,v_item_type,p_source,nullif(trim(coalesce(p_source_key,'')),''),p_description,p_quantity,p_unit_price,round(p_quantity*p_unit_price,2),'active')
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.hotel_os_financial_folio_snapshot(p_folio_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare f record; v_charges numeric:=0; v_payments numeric:=0; v_refunds numeric:=0; v_items jsonb:='[]'::jsonb; v_payment_rows jsonb:='[]'::jsonb;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id;
  if not found then raise exception 'Folio não encontrado'; end if;
  select coalesce(sum(case when status='active' then total else 0 end),0),
         coalesce(jsonb_agg(jsonb_build_object('id',id,'source',source,'sourceKey',source_key,'description',description,'quantity',quantity,'unitPrice',unit_amount,'total',total,'status',status,'createdAt',created_at) order by created_at) filter(where id is not null),'[]'::jsonb)
    into v_charges,v_items from public.hotel_os_folio_items where folio_id=f.id;
  select coalesce(sum(case when transaction_type='payment' and status='approved' then amount else 0 end),0),
         coalesce(sum(case when transaction_type='refund' and status in ('approved','refunded') then amount else 0 end),0),
         coalesce(jsonb_agg(jsonb_build_object('id',id,'amount',amount,'method',coalesce(payment_method,method),'status',status,'externalReference',external_reference,'idempotencyKey',idempotency_key,'createdAt',created_at) order by created_at) filter(where transaction_type='payment'),'[]'::jsonb)
    into v_payments,v_refunds,v_payment_rows from public.hotel_os_transactions where folio_id=f.id;
  return jsonb_build_object('folioId',f.id,'hotelId',f.hotel_id,'stayId',f.stay_id,'status',f.status,'currency',f.currency,'chargesTotal',round(v_charges,2),'paymentsTotal',round(v_payments,2),'refundsTotal',round(v_refunds,2),'balance',round(v_charges-v_payments+v_refunds,2),'items',v_items,'payments',v_payment_rows);
end; $$;

create or replace function public.hotel_os_financial_folio_snapshot_by_stay(p_stay_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_folio uuid;
begin
  select id into v_folio from public.hotel_os_folios where stay_id=p_stay_id order by created_at desc limit 1;
  if v_folio is null then raise exception 'Folio não encontrado'; end if;
  return public.hotel_os_financial_folio_snapshot(v_folio);
end; $$;

create or replace function public.hotel_os_financial_receive_payment(
  p_folio_id uuid,p_amount numeric,p_method text,p_external_reference text default null,p_idempotency_key text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare f record; v_existing uuid; v_id uuid; v_snapshot jsonb; v_balance numeric;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  if f.status<>'open' then raise exception 'Folio não está aberto'; end if;
  if p_amount<=0 then raise exception 'Valor do pagamento inválido'; end if;
  if p_method not in ('CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER') then raise exception 'Método de pagamento inválido'; end if;
  if nullif(trim(coalesce(p_idempotency_key,'')),'') is not null then
    select id into v_existing from public.hotel_os_transactions where folio_id=p_folio_id and idempotency_key=p_idempotency_key limit 1;
    if v_existing is not null then return v_existing; end if;
  end if;
  v_snapshot:=public.hotel_os_financial_folio_snapshot(p_folio_id);
  v_balance:=coalesce((v_snapshot->>'balance')::numeric,0);
  if p_amount>greatest(v_balance,0) then raise exception 'Pagamento excede o saldo do Folio'; end if;
  insert into public.hotel_os_transactions(hotel_id,folio_id,transaction_type,amount,method,payment_method,status,external_reference,idempotency_key)
  values(f.hotel_id,f.id,'payment',p_amount,p_method,p_method,'approved',p_external_reference,nullif(trim(coalesce(p_idempotency_key,'')),'')) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.hotel_os_void_folio_item(p_folio_item_id uuid,p_reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare i record;
begin
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'VOID_REASON_REQUIRED'; end if;
  select * into i from public.hotel_os_folio_items where id=p_folio_item_id for update;
  if not found then raise exception 'FolioItem não encontrado'; end if;
  if i.status<>'active' then raise exception 'Item não está ativo'; end if;
  update public.hotel_os_folio_items set status='voided' where id=i.id;
  return i.id;
end; $$;

create or replace function public.hotel_os_financial_can_checkout(p_stay_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare f record; s jsonb; v_balance numeric;
begin
  select * into f from public.hotel_os_folios where stay_id=p_stay_id order by created_at desc limit 1;
  if not found then return jsonb_build_object('stayId',p_stay_id,'folioId',null,'balance',0,'eligible',false,'reason','FOLIO_NOT_FOUND'); end if;
  s:=public.hotel_os_financial_folio_snapshot(f.id); v_balance:=coalesce((s->>'balance')::numeric,0);
  if f.status<>'open' then return jsonb_build_object('stayId',p_stay_id,'folioId',f.id,'balance',v_balance,'eligible',false,'reason','FOLIO_NOT_OPEN'); end if;
  if v_balance>0 then return jsonb_build_object('stayId',p_stay_id,'folioId',f.id,'balance',v_balance,'eligible',false,'reason','OUTSTANDING_BALANCE'); end if;
  return jsonb_build_object('stayId',p_stay_id,'folioId',f.id,'balance',v_balance,'eligible',true,'reason','OK');
end; $$;

create or replace function public.hotel_os_financial_close_folio(p_folio_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare f record; s jsonb; v_balance numeric;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  if f.status='closed' then return f.id; end if;
  s:=public.hotel_os_financial_folio_snapshot(f.id); v_balance:=coalesce((s->>'balance')::numeric,0);
  if v_balance>0 then raise exception 'Folio possui saldo pendente: %',v_balance; end if;
  update public.hotel_os_folios set status='closed',closed_at=now() where id=f.id;
  return f.id;
end; $$;

-- ============================================================
-- 3. MINIMAL PRODUCT + INVENTORY CORE FOR MINIBAR
-- ============================================================
create table if not exists public.pdv_produtos (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  codigo text,
  nome text not null,
  preco numeric(12,2) not null default 0 check(preco>=0),
  ativo boolean not null default true,
  status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE','OUT_OF_STOCK')),
  unidade text not null default 'UN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(hotel_id,codigo)
);

create table if not exists public.hotel_os_stock_locations (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  code text not null,
  name text not null,
  location_type text not null check(location_type in ('WAREHOUSE','KITCHEN','BAR','MINIBAR','LAUNDRY','OTHER')),
  room_id text references public.quartos(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(hotel_id,code)
);
create unique index if not exists uq_hos_minibar_location_room on public.hotel_os_stock_locations(hotel_id,room_id) where location_type='MINIBAR' and room_id is not null;

create table if not exists public.hotel_os_stock_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  quantity numeric(14,3) not null default 0 check(quantity>=0),
  average_cost numeric(14,4) not null default 0 check(average_cost>=0),
  minimum_stock numeric(14,3),
  maximum_stock numeric(14,3),
  reorder_point numeric(14,3),
  updated_at timestamptz not null default now(),
  unique(hotel_id,product_id,location_id)
);

create table if not exists public.hotel_os_stock_movement_v2 (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  stock_item_id uuid references public.hotel_os_stock_items(id) on delete restrict,
  location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  related_location_id uuid references public.hotel_os_stock_locations(id) on delete restrict,
  movement_type text not null check(movement_type in ('PURCHASE','SALE','CONSUMPTION','TRANSFER','ADJUSTMENT','RETURN','WASTE','EXPIRATION','INITIAL_BALANCE')),
  quantity_delta numeric(14,3) not null check(quantity_delta<>0),
  unit_cost numeric(14,4),
  reference_id uuid,
  reference_type text,
  created_by text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hotel_os_minibar_room_targets (
  hotel_id text not null default 'default_hotel',
  room_id text not null references public.quartos(id) on delete cascade,
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  target_quantity numeric(14,3) not null default 0 check(target_quantity>=0),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(hotel_id,room_id,product_id)
);

create table if not exists public.hotel_os_minibar_consumptions (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  room_id text not null references public.quartos(id) on delete restrict,
  stay_id uuid not null references public.hotel_os_stays(id) on delete restrict,
  folio_id uuid not null references public.hotel_os_folios(id) on delete restrict,
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  quantity numeric(14,3) not null check(quantity>0),
  unit_price numeric(12,2) not null check(unit_price>=0),
  total numeric(12,2) not null check(total>=0),
  stock_location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  folio_item_id uuid references public.hotel_os_folio_items(id) on delete restrict,
  idempotency_key text not null,
  created_by text,
  created_at timestamptz not null default now(),
  unique(hotel_id,idempotency_key)
);

create table if not exists public.hotel_os_minibar_restocks (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null default 'default_hotel',
  room_id text not null references public.quartos(id) on delete restrict,
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  from_location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  to_location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  quantity numeric(14,3) not null check(quantity>0),
  idempotency_key text not null,
  created_by text,
  created_at timestamptz not null default now(),
  unique(hotel_id,idempotency_key)
);

create or replace function public.hotel_os_apply_stock_movement(
  p_hotel_id text,p_product_id uuid,p_location_id uuid,p_type text,p_quantity_delta numeric,p_unit_cost numeric default null,
  p_reference_id uuid default null,p_reference_type text default null,p_related_location_id uuid default null,p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_item public.hotel_os_stock_items; v_id uuid; v_new_cost numeric(14,4);
begin
  if p_quantity_delta=0 then raise exception 'Movimentação sem quantidade'; end if;
  insert into public.hotel_os_stock_items(hotel_id,product_id,location_id,quantity) values(p_hotel_id,p_product_id,p_location_id,0) on conflict(hotel_id,product_id,location_id) do nothing;
  select * into v_item from public.hotel_os_stock_items where hotel_id=p_hotel_id and product_id=p_product_id and location_id=p_location_id for update;
  if v_item.quantity+p_quantity_delta<0 then raise exception 'Estoque insuficiente'; end if;
  v_new_cost:=v_item.average_cost;
  if p_quantity_delta>0 and p_unit_cost is not null then
    v_new_cost:=case when v_item.quantity+p_quantity_delta=0 then 0 else ((v_item.quantity*v_item.average_cost)+(p_quantity_delta*p_unit_cost))/(v_item.quantity+p_quantity_delta) end;
  end if;
  update public.hotel_os_stock_items set quantity=quantity+p_quantity_delta,average_cost=v_new_cost,updated_at=now() where id=v_item.id;
  insert into public.hotel_os_stock_movement_v2(hotel_id,product_id,stock_item_id,location_id,related_location_id,movement_type,quantity_delta,unit_cost,reference_id,reference_type,metadata)
  values(p_hotel_id,p_product_id,v_item.id,p_location_id,p_related_location_id,p_type,p_quantity_delta,p_unit_cost,p_reference_id,p_reference_type,p_metadata) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.hotel_os_transfer_stock(p_hotel_id text,p_product_id uuid,p_from_location uuid,p_to_location uuid,p_quantity numeric,p_reference_id uuid default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_from_location=p_to_location or p_quantity<=0 then raise exception 'Transferência inválida'; end if;
  perform public.hotel_os_apply_stock_movement(p_hotel_id,p_product_id,p_from_location,'TRANSFER',-p_quantity,null,p_reference_id,'TRANSFER',p_to_location,'{}'::jsonb);
  perform public.hotel_os_apply_stock_movement(p_hotel_id,p_product_id,p_to_location,'TRANSFER',p_quantity,null,p_reference_id,'TRANSFER',p_from_location,'{}'::jsonb);
end; $$;

create or replace function public.hotel_os_ensure_minibar_location(p_hotel_id text,p_room_id text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_numero text;
begin
  select numero into v_numero from public.quartos where id=p_room_id;
  if v_numero is null then raise exception 'Quarto não encontrado'; end if;
  select id into v_id from public.hotel_os_stock_locations where hotel_id=p_hotel_id and room_id=p_room_id and location_type='MINIBAR' limit 1;
  if v_id is null then
    insert into public.hotel_os_stock_locations(hotel_id,code,name,location_type,room_id)
    values(p_hotel_id,'MINIBAR-'||p_room_id,'Frigobar quarto '||v_numero,'MINIBAR',p_room_id)
    on conflict do nothing;
    select id into v_id from public.hotel_os_stock_locations where hotel_id=p_hotel_id and room_id=p_room_id and location_type='MINIBAR' limit 1;
  end if;
  return v_id;
end; $$;

create or replace function public.hotel_os_minibar_consume(p_hotel_id text,p_room_id text,p_product_id uuid,p_quantity numeric,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_existing record; v_stay uuid; v_folio uuid; v_location uuid; v_product record; v_consumption uuid; v_folio_item uuid;
begin
  if p_quantity<=0 then raise exception 'MINIBAR_INVALID_QUANTITY'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception 'MINIBAR_IDEMPOTENCY_KEY_REQUIRED'; end if;
  select * into v_existing from public.hotel_os_minibar_consumptions where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('consumptionId',v_existing.id,'stayId',v_existing.stay_id,'folioId',v_existing.folio_id,'folioItemId',v_existing.folio_item_id,'productId',v_existing.product_id,'quantity',v_existing.quantity,'unitPrice',v_existing.unit_price,'total',v_existing.total); end if;
  select s.id,f.id into v_stay,v_folio from public.hotel_os_stays s join public.hotel_os_folios f on f.stay_id=s.id and f.status='open'
   where s.hotel_id=p_hotel_id and s.room_id=p_room_id and s.status='CHECKED_IN' order by s.actual_check_in_at desc limit 1;
  if v_stay is null then raise exception 'MINIBAR_ROOM_WITHOUT_ACTIVE_STAY'; end if;
  select id,nome,preco into v_product from public.pdv_produtos where id=p_product_id and hotel_id=p_hotel_id and ativo=true and status='ACTIVE' for share;
  if not found then raise exception 'MINIBAR_PRODUCT_UNAVAILABLE'; end if;
  v_location:=public.hotel_os_ensure_minibar_location(p_hotel_id,p_room_id);
  insert into public.hotel_os_minibar_consumptions(hotel_id,room_id,stay_id,folio_id,product_id,quantity,unit_price,total,stock_location_id,idempotency_key)
  values(p_hotel_id,p_room_id,v_stay,v_folio,p_product_id,p_quantity,v_product.preco,round(p_quantity*v_product.preco,2),v_location,p_idempotency_key) returning id into v_consumption;
  perform public.hotel_os_apply_stock_movement(p_hotel_id,p_product_id,v_location,'CONSUMPTION',-p_quantity,null,v_consumption,'MINIBAR_CONSUMPTION',null,jsonb_build_object('room_id',p_room_id,'stay_id',v_stay));
  select public.hotel_os_financial_add_charge(v_folio,'FRIGOBAR','minibar:'||p_idempotency_key,v_product.nome,p_quantity,v_product.preco) into v_folio_item;
  update public.hotel_os_minibar_consumptions set folio_item_id=v_folio_item where id=v_consumption;
  return jsonb_build_object('consumptionId',v_consumption,'stayId',v_stay,'folioId',v_folio,'folioItemId',v_folio_item,'productId',p_product_id,'quantity',p_quantity,'unitPrice',v_product.preco,'total',round(p_quantity*v_product.preco,2));
end; $$;

create or replace function public.hotel_os_minibar_restock(p_hotel_id text,p_room_id text,p_product_id uuid,p_quantity numeric,p_from_location_id uuid,p_idempotency_key text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_existing uuid; v_to uuid; v_id uuid;
begin
  if p_quantity<=0 then raise exception 'MINIBAR_INVALID_QUANTITY'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception 'MINIBAR_IDEMPOTENCY_KEY_REQUIRED'; end if;
  select id into v_existing from public.hotel_os_minibar_restocks where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key;
  if v_existing is not null then return v_existing; end if;
  if not exists(select 1 from public.hotel_os_stock_locations where id=p_from_location_id and hotel_id=p_hotel_id and active=true) then raise exception 'MINIBAR_INVALID_SOURCE_LOCATION'; end if;
  v_to:=public.hotel_os_ensure_minibar_location(p_hotel_id,p_room_id);
  insert into public.hotel_os_minibar_restocks(hotel_id,room_id,product_id,from_location_id,to_location_id,quantity,idempotency_key)
  values(p_hotel_id,p_room_id,p_product_id,p_from_location_id,v_to,p_quantity,p_idempotency_key) returning id into v_id;
  perform public.hotel_os_transfer_stock(p_hotel_id,p_product_id,p_from_location_id,v_to,p_quantity,v_id);
  return v_id;
end; $$;

create or replace function public.hotel_os_minibar_room_snapshot(p_hotel_id text,p_room_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_location uuid; v_numero text; v_items jsonb; v_total numeric; v_missing numeric;
begin
  select numero into v_numero from public.quartos where id=p_room_id;
  if v_numero is null then raise exception 'Quarto não encontrado'; end if;
  v_location:=public.hotel_os_ensure_minibar_location(p_hotel_id,p_room_id);
  select coalesce(jsonb_agg(jsonb_build_object('productId',p.id,'productName',p.nome,'quantity',coalesce(si.quantity,0),'targetQuantity',t.target_quantity,'missingQuantity',greatest(t.target_quantity-coalesce(si.quantity,0),0),'salePrice',p.preco) order by p.nome),'[]'::jsonb),
         coalesce(sum(coalesce(si.quantity,0)),0),coalesce(sum(greatest(t.target_quantity-coalesce(si.quantity,0),0)),0)
    into v_items,v_total,v_missing
    from public.hotel_os_minibar_room_targets t join public.pdv_produtos p on p.id=t.product_id and p.hotel_id=t.hotel_id
    left join public.hotel_os_stock_items si on si.hotel_id=t.hotel_id and si.product_id=t.product_id and si.location_id=v_location
   where t.hotel_id=p_hotel_id and t.room_id=p_room_id and t.active=true;
  return jsonb_build_object('hotelId',p_hotel_id,'roomId',p_room_id,'roomNumber',v_numero,'locationId',v_location,'items',v_items,'totalUnits',v_total,'missingUnits',v_missing,'needsRestock',v_missing>0);
end; $$;

-- Current production app uses public policies on operational tables; mirror that until auth hardening is done separately.
do $$ declare t text; begin
  foreach t in array array['hotel_os_stays','hotel_os_folios','hotel_os_folio_items','hotel_os_transactions','pdv_produtos','hotel_os_stock_locations','hotel_os_stock_items','hotel_os_stock_movement_v2','hotel_os_minibar_room_targets','hotel_os_minibar_consumptions','hotel_os_minibar_restocks'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_current_app_access',t);
    execute format('create policy %I on public.%I for all to public using (true) with check (true)',t||'_current_app_access',t);
  end loop;
end $$;

grant execute on function public.hotel_os_financial_add_charge(uuid,text,text,text,numeric,numeric) to anon,authenticated;
grant execute on function public.hotel_os_financial_folio_snapshot(uuid) to anon,authenticated;
grant execute on function public.hotel_os_financial_folio_snapshot_by_stay(uuid) to anon,authenticated;
grant execute on function public.hotel_os_financial_receive_payment(uuid,numeric,text,text,text) to anon,authenticated;
grant execute on function public.hotel_os_void_folio_item(uuid,text) to anon,authenticated;
grant execute on function public.hotel_os_financial_can_checkout(uuid) to anon,authenticated;
grant execute on function public.hotel_os_financial_close_folio(uuid) to anon,authenticated;
grant execute on function public.hotel_os_ensure_minibar_location(text,text) to anon,authenticated;
grant execute on function public.hotel_os_minibar_consume(text,text,uuid,numeric,text) to anon,authenticated;
grant execute on function public.hotel_os_minibar_restock(text,text,uuid,numeric,uuid,text) to anon,authenticated;
grant execute on function public.hotel_os_minibar_room_snapshot(text,text) to anon,authenticated;
