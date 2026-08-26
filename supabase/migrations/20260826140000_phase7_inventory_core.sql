-- FASE 7 — núcleo centralizado de estoque, compras e inventário.
-- Preserva produtos e movimentos existentes da FASE 6.

create table if not exists public.hotel_os_stock_locations(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 code text not null, name text not null, location_type text not null check(location_type in ('WAREHOUSE','KITCHEN','BAR','MINIBAR','LAUNDRY','OTHER')),
 active boolean not null default true, created_at timestamptz not null default now(), unique(hotel_id,code)
);

create table if not exists public.hotel_os_stock_items(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 product_id uuid not null references public.pdv_produtos(id) on delete restrict,
 location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
 quantity numeric(14,3) not null default 0 check(quantity>=0), average_cost numeric(14,4) not null default 0 check(average_cost>=0),
 minimum_stock numeric(14,3), maximum_stock numeric(14,3), reorder_point numeric(14,3), updated_at timestamptz not null default now(), unique(hotel_id,product_id,location_id)
);

create table if not exists public.hotel_os_stock_movement_v2(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 product_id uuid not null references public.pdv_produtos(id) on delete restrict,
 stock_item_id uuid references public.hotel_os_stock_items(id) on delete restrict,
 location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
 related_location_id uuid references public.hotel_os_stock_locations(id) on delete restrict,
 movement_type text not null check(movement_type in ('PURCHASE','SALE','CONSUMPTION','TRANSFER','ADJUSTMENT','RETURN','WASTE','EXPIRATION','INITIAL_BALANCE')),
 quantity_delta numeric(14,3) not null check(quantity_delta<>0), unit_cost numeric(14,4), reference_id uuid, reference_type text, batch_number text, manufactured_at date, expires_at date,
 created_by uuid, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_hos_stock_item_lookup on public.hotel_os_stock_items(hotel_id,location_id,product_id);
create index if not exists idx_hos_stock_movement_lookup on public.hotel_os_stock_movement_v2(hotel_id,product_id,location_id,created_at desc);
create index if not exists idx_hos_stock_expiry on public.hotel_os_stock_movement_v2(hotel_id,expires_at) where expires_at is not null;

create table if not exists public.hotel_os_suppliers(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 name text not null, tax_id text, email text, phone text, status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE','BLOCKED')), payment_terms text, lead_time_days integer, created_at timestamptz not null default now()
);
create unique index if not exists uq_hos_supplier_tax on public.hotel_os_suppliers(hotel_id,tax_id) where tax_id is not null;
create table if not exists public.hotel_os_supplier_products(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 supplier_id uuid not null references public.hotel_os_suppliers(id) on delete cascade, product_id uuid not null references public.pdv_produtos(id) on delete cascade,
 supplier_sku text, unit_price numeric(14,4), lead_time_days integer, active boolean not null default true, unique(supplier_id,product_id)
);

create table if not exists public.hotel_os_purchase_orders(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 supplier_id uuid references public.hotel_os_suppliers(id), order_number text not null, status text not null default 'DRAFT' check(status in ('DRAFT','SUBMITTED','APPROVED','ORDERED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED')),
 requested_by uuid, approved_by uuid, ordered_at timestamptz, created_at timestamptz not null default now(), unique(hotel_id,order_number)
);
create table if not exists public.hotel_os_purchase_order_items(
 id uuid primary key default gen_random_uuid(), purchase_order_id uuid not null references public.hotel_os_purchase_orders(id) on delete cascade,
 product_id uuid not null references public.pdv_produtos(id), location_id uuid not null references public.hotel_os_stock_locations(id), ordered_quantity numeric(14,3) not null check(ordered_quantity>0), received_quantity numeric(14,3) not null default 0 check(received_quantity>=0), damaged_quantity numeric(14,3) not null default 0 check(damaged_quantity>=0), unit_cost numeric(14,4)
);
create table if not exists public.hotel_os_purchase_receipts(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 purchase_order_id uuid not null references public.hotel_os_purchase_orders(id), received_by uuid, received_at timestamptz not null default now(), notes text
);

create table if not exists public.hotel_os_inventories(
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hoteis(id) on delete cascade,
 location_id uuid references public.hotel_os_stock_locations(id), category_id uuid, status text not null default 'OPEN' check(status in ('OPEN','COUNTING','REVIEW','APPROVED','FINALIZED','CANCELLED')),
 created_by uuid, approved_by uuid, created_at timestamptz not null default now(), finalized_at timestamptz
);
create table if not exists public.hotel_os_inventory_items(
 id uuid primary key default gen_random_uuid(), inventory_id uuid not null references public.hotel_os_inventories(id) on delete cascade,
 product_id uuid not null references public.pdv_produtos(id), stock_item_id uuid references public.hotel_os_stock_items(id), expected_quantity numeric(14,3) not null default 0, counted_quantity numeric(14,3), difference_quantity numeric(14,3), notes text, counted_by uuid, counted_at timestamptz, unique(inventory_id,product_id,stock_item_id)
);

create or replace function public.hotel_os_apply_stock_movement(p_hotel_id uuid,p_product_id uuid,p_location_id uuid,p_type text,p_quantity_delta numeric,p_unit_cost numeric default null,p_reference_id uuid default null,p_reference_type text default null,p_related_location_id uuid default null,p_batch_number text default null,p_manufactured_at date default null,p_expires_at date default null,p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_item public.hotel_os_stock_items; v_id uuid; v_new_cost numeric(14,4);
begin
 if p_quantity_delta=0 then raise exception 'Movimentação sem quantidade'; end if;
 insert into public.hotel_os_stock_items(hotel_id,product_id,location_id,quantity) values(p_hotel_id,p_product_id,p_location_id,0) on conflict(hotel_id,product_id,location_id) do nothing;
 select * into v_item from public.hotel_os_stock_items where hotel_id=p_hotel_id and product_id=p_product_id and location_id=p_location_id for update;
 if v_item.quantity+p_quantity_delta<0 then raise exception 'Estoque insuficiente'; end if;
 v_new_cost:=v_item.average_cost;
 if p_quantity_delta>0 and p_unit_cost is not null then v_new_cost:=case when v_item.quantity+p_quantity_delta=0 then 0 else ((v_item.quantity*v_item.average_cost)+(p_quantity_delta*p_unit_cost))/(v_item.quantity+p_quantity_delta) end; end if;
 update public.hotel_os_stock_items set quantity=quantity+p_quantity_delta,average_cost=v_new_cost,updated_at=now() where id=v_item.id;
 insert into public.hotel_os_stock_movement_v2(hotel_id,product_id,stock_item_id,location_id,related_location_id,movement_type,quantity_delta,unit_cost,reference_id,reference_type,batch_number,manufactured_at,expires_at,created_by,metadata)
 values(p_hotel_id,p_product_id,v_item.id,p_location_id,p_related_location_id,p_type,p_quantity_delta,p_unit_cost,p_reference_id,p_reference_type,p_batch_number,p_manufactured_at,p_expires_at,auth.uid(),p_metadata) returning id into v_id;
 return v_id;
end; $$;

create or replace function public.hotel_os_transfer_stock(p_hotel_id uuid,p_product_id uuid,p_from_location uuid,p_to_location uuid,p_quantity numeric,p_reference_id uuid default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_from_location=p_to_location or p_quantity<=0 then raise exception 'Transferência inválida'; end if;
 perform public.hotel_os_apply_stock_movement(p_hotel_id,p_product_id,p_from_location,'TRANSFER',-p_quantity,null,p_reference_id,'TRANSFER',p_to_location);
 perform public.hotel_os_apply_stock_movement(p_hotel_id,p_product_id,p_to_location,'TRANSFER',p_quantity,null,p_reference_id,'TRANSFER',p_from_location);
end; $$;

alter table public.pdv_produtos add column if not exists unidade text not null default 'UN';
alter table public.pdv_produtos add column if not exists estoque_minimo numeric(14,3);
alter table public.pdv_produtos add column if not exists estoque_maximo numeric(14,3);
alter table public.pdv_produtos add column if not exists ponto_reposicao numeric(14,3);
alter table public.pdv_produtos add constraint pdv_produtos_unidade_check check(unidade in ('UN','KG','G','L','ML','CX','PCT','FD'));

alter table public.hotel_os_stock_locations enable row level security;
alter table public.hotel_os_stock_items enable row level security;
alter table public.hotel_os_stock_movement_v2 enable row level security;
alter table public.hotel_os_suppliers enable row level security;
alter table public.hotel_os_supplier_products enable row level security;
alter table public.hotel_os_purchase_orders enable row level security;
alter table public.hotel_os_purchase_order_items enable row level security;
alter table public.hotel_os_purchase_receipts enable row level security;
alter table public.hotel_os_inventories enable row level security;
alter table public.hotel_os_inventory_items enable row level security;

do $$ declare t text; begin foreach t in array array['hotel_os_stock_locations','hotel_os_stock_items','hotel_os_stock_movement_v2','hotel_os_suppliers','hotel_os_supplier_products','hotel_os_purchase_orders','hotel_os_purchase_order_items','hotel_os_purchase_receipts','hotel_os_inventories','hotel_os_inventory_items'] loop execute format('drop policy if exists %I on public.%I',t||'_hotel_access',t); execute format('create policy %I on public.%I for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id))',t||'_hotel_access',t); end loop; end $$;

create or replace view public.hotel_os_stock_alerts as
select si.hotel_id,si.id stock_item_id,si.product_id,si.location_id,si.quantity,coalesce(si.reorder_point,p.ponto_reposicao,p.estoque_minimo) reorder_point,
 case when si.quantity<=0 then 'OUT_OF_STOCK' when coalesce(si.reorder_point,p.ponto_reposicao,p.estoque_minimo) is not null and si.quantity<=coalesce(si.reorder_point,p.ponto_reposicao,p.estoque_minimo) then 'LOW_STOCK' else 'NORMAL' end alert_type
from public.hotel_os_stock_items si join public.pdv_produtos p on p.id=si.product_id;
