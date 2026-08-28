-- Frigobar Core — usa o estoque canônico e o Financial Engine; sem persistência paralela.

alter table public.hotel_os_stock_locations
  add column if not exists room_id text references public.quartos(id) on delete cascade;

create unique index if not exists uq_hos_minibar_location_room
  on public.hotel_os_stock_locations(hotel_id, room_id)
  where location_type='MINIBAR' and room_id is not null;

create table if not exists public.hotel_os_minibar_room_targets (
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  room_id text not null references public.quartos(id) on delete cascade,
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  target_quantity numeric(14,3) not null default 0 check(target_quantity>=0),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(hotel_id,room_id,product_id)
);

create table if not exists public.hotel_os_minibar_consumptions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
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
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(hotel_id,idempotency_key)
);

create table if not exists public.hotel_os_minibar_restocks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  room_id text not null references public.quartos(id) on delete restrict,
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  from_location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  to_location_id uuid not null references public.hotel_os_stock_locations(id) on delete restrict,
  quantity numeric(14,3) not null check(quantity>0),
  idempotency_key text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(hotel_id,idempotency_key)
);

alter table public.hotel_os_minibar_room_targets enable row level security;
alter table public.hotel_os_minibar_consumptions enable row level security;
alter table public.hotel_os_minibar_restocks enable row level security;

drop policy if exists hotel_os_minibar_room_targets_hotel_access on public.hotel_os_minibar_room_targets;
create policy hotel_os_minibar_room_targets_hotel_access on public.hotel_os_minibar_room_targets for all to authenticated
using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists hotel_os_minibar_consumptions_hotel_access on public.hotel_os_minibar_consumptions;
create policy hotel_os_minibar_consumptions_hotel_access on public.hotel_os_minibar_consumptions for all to authenticated
using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));
drop policy if exists hotel_os_minibar_restocks_hotel_access on public.hotel_os_minibar_restocks;
create policy hotel_os_minibar_restocks_hotel_access on public.hotel_os_minibar_restocks for all to authenticated
using(public.usuario_pode_hotel(hotel_id)) with check(public.usuario_pode_hotel(hotel_id));

create or replace function public.hotel_os_ensure_minibar_location(p_hotel_id uuid,p_room_id text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_numero text;
begin
  if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;
  select numero into v_numero from public.quartos where id=p_room_id and hotel_id=p_hotel_id;
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

create or replace function public.hotel_os_minibar_consume(
  p_hotel_id uuid,p_room_id text,p_product_id uuid,p_quantity numeric,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_existing record; v_stay uuid; v_folio uuid; v_location uuid; v_product record; v_consumption uuid; v_folio_item uuid;
begin
  if p_quantity<=0 then raise exception 'MINIBAR_INVALID_QUANTITY'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception 'MINIBAR_IDEMPOTENCY_KEY_REQUIRED'; end if;
  if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;

  select * into v_existing from public.hotel_os_minibar_consumptions where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key;
  if found then
    return jsonb_build_object('consumptionId',v_existing.id,'stayId',v_existing.stay_id,'folioId',v_existing.folio_id,'folioItemId',v_existing.folio_item_id,'productId',v_existing.product_id,'quantity',v_existing.quantity,'unitPrice',v_existing.unit_price,'total',v_existing.total);
  end if;

  select s.id,f.id into v_stay,v_folio
  from public.hotel_os_stays s join public.hotel_os_folios f on f.stay_id=s.id and f.status='open'
  where s.hotel_id=p_hotel_id and s.room_id=p_room_id and s.status='CHECKED_IN'
  order by s.actual_check_in_at desc limit 1;
  if v_stay is null then raise exception 'MINIBAR_ROOM_WITHOUT_ACTIVE_STAY'; end if;

  select id,nome,preco into v_product from public.pdv_produtos
  where id=p_product_id and hotel_id=p_hotel_id and ativo=true and status='ACTIVE' for share;
  if not found then raise exception 'MINIBAR_PRODUCT_UNAVAILABLE'; end if;

  v_location:=public.hotel_os_ensure_minibar_location(p_hotel_id,p_room_id);
  insert into public.hotel_os_minibar_consumptions(hotel_id,room_id,stay_id,folio_id,product_id,quantity,unit_price,total,stock_location_id,idempotency_key,created_by)
  values(p_hotel_id,p_room_id,v_stay,v_folio,p_product_id,p_quantity,v_product.preco,round(p_quantity*v_product.preco,2),v_location,p_idempotency_key,auth.uid())
  returning id into v_consumption;

  perform public.hotel_os_apply_stock_movement(p_hotel_id,p_product_id,v_location,'CONSUMPTION',-p_quantity,null,v_consumption,'MINIBAR_CONSUMPTION',null,null,null,null,jsonb_build_object('room_id',p_room_id,'stay_id',v_stay));
  select public.hotel_os_financial_add_charge(v_folio,'FRIGOBAR','minibar:'||p_idempotency_key,v_product.nome,p_quantity,v_product.preco) into v_folio_item;
  update public.hotel_os_minibar_consumptions set folio_item_id=v_folio_item where id=v_consumption;

  return jsonb_build_object('consumptionId',v_consumption,'stayId',v_stay,'folioId',v_folio,'folioItemId',v_folio_item,'productId',p_product_id,'quantity',p_quantity,'unitPrice',v_product.preco,'total',round(p_quantity*v_product.preco,2));
end; $$;

create or replace function public.hotel_os_minibar_restock(
  p_hotel_id uuid,p_room_id text,p_product_id uuid,p_quantity numeric,p_from_location_id uuid,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_existing uuid; v_to uuid; v_id uuid;
begin
  if p_quantity<=0 then raise exception 'MINIBAR_INVALID_QUANTITY'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception 'MINIBAR_IDEMPOTENCY_KEY_REQUIRED'; end if;
  if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;
  select id into v_existing from public.hotel_os_minibar_restocks where hotel_id=p_hotel_id and idempotency_key=p_idempotency_key;
  if v_existing is not null then return v_existing; end if;
  if not exists(select 1 from public.hotel_os_stock_locations where id=p_from_location_id and hotel_id=p_hotel_id and active=true) then raise exception 'MINIBAR_INVALID_SOURCE_LOCATION'; end if;
  v_to:=public.hotel_os_ensure_minibar_location(p_hotel_id,p_room_id);
  insert into public.hotel_os_minibar_restocks(hotel_id,room_id,product_id,from_location_id,to_location_id,quantity,idempotency_key,created_by)
  values(p_hotel_id,p_room_id,p_product_id,p_from_location_id,v_to,p_quantity,p_idempotency_key,auth.uid()) returning id into v_id;
  perform public.hotel_os_transfer_stock(p_hotel_id,p_product_id,p_from_location_id,v_to,p_quantity,v_id);
  return v_id;
end; $$;

create or replace function public.hotel_os_minibar_room_snapshot(p_hotel_id uuid,p_room_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_location uuid; v_numero text; v_items jsonb; v_total numeric; v_missing numeric;
begin
  if not public.usuario_pode_hotel(p_hotel_id) then raise exception 'Usuário sem acesso ao hotel'; end if;
  select numero into v_numero from public.quartos where id=p_room_id and hotel_id=p_hotel_id;
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

revoke all on function public.hotel_os_ensure_minibar_location(uuid,text) from public;
revoke all on function public.hotel_os_minibar_consume(uuid,text,uuid,numeric,text) from public;
revoke all on function public.hotel_os_minibar_restock(uuid,text,uuid,numeric,uuid,text) from public;
revoke all on function public.hotel_os_minibar_room_snapshot(uuid,text) from public;
grant execute on function public.hotel_os_ensure_minibar_location(uuid,text) to authenticated;
grant execute on function public.hotel_os_minibar_consume(uuid,text,uuid,numeric,text) to authenticated;
grant execute on function public.hotel_os_minibar_restock(uuid,text,uuid,numeric,uuid,text) to authenticated;
grant execute on function public.hotel_os_minibar_room_snapshot(uuid,text) to authenticated;
