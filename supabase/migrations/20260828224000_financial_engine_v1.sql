-- Financial Engine v1
-- Reuses the existing stay/folio/transaction model and adds canonical, idempotent RPCs.

alter table public.hotel_os_folio_items
  add column if not exists source_key text;

alter table public.hotel_os_transactions
  add column if not exists idempotency_key text;

create unique index if not exists uq_hotel_os_folio_item_source_key
  on public.hotel_os_folio_items(folio_id, source, source_key)
  where source_key is not null;

create unique index if not exists uq_hotel_os_transaction_idempotency
  on public.hotel_os_transactions(folio_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.hotel_os_financial_add_charge(
  p_folio_id uuid,
  p_source text,
  p_source_key text,
  p_description text,
  p_quantity numeric,
  p_unit_price numeric
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  f record;
  v_existing uuid;
  v_id uuid;
  v_item_type text;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  if f.status <> 'open' then raise exception 'Folio não está aberto'; end if;
  if p_quantity <= 0 or p_unit_price < 0 then raise exception 'Quantidade/preço inválidos'; end if;
  if coalesce(trim(p_description),'') = '' then raise exception 'Descrição obrigatória'; end if;
  if p_source not in ('ROOM','POS','FRIGOBAR','ROOM_SERVICE','LAUNDRY','MANUAL','TAX','DISCOUNT','ADJUSTMENT') then
    raise exception 'Origem de Folio inválida';
  end if;

  perform public.hotel_os_require_stay_permission(
    f.hotel_id,
    case p_source when 'DISCOUNT' then 'discount' when 'ADJUSTMENT' then 'folio_adjustment' else 'folio_item_add' end
  );

  if nullif(trim(coalesce(p_source_key,'')),'') is not null then
    select id into v_existing
    from public.hotel_os_folio_items
    where folio_id=p_folio_id and source=p_source and source_key=p_source_key
    limit 1;
    if v_existing is not null then return v_existing; end if;
  end if;

  v_item_type := case p_source
    when 'ROOM' then 'room'
    when 'POS' then 'order'
    when 'FRIGOBAR' then 'minibar'
    when 'TAX' then 'tax'
    when 'DISCOUNT' then 'adjustment'
    when 'ADJUSTMENT' then 'adjustment'
    else 'other'
  end;

  insert into public.hotel_os_folio_items(
    hotel_id, folio_id, item_type, source, source_key, description,
    quantity, unit_amount, total, status, created_by
  ) values (
    f.hotel_id, p_folio_id, v_item_type, p_source, nullif(trim(coalesce(p_source_key,'')),''), p_description,
    p_quantity, p_unit_price, round(p_quantity*p_unit_price,2), 'active', auth.uid()
  ) returning id into v_id;

  perform public.hotel_os_emit_event(
    f.hotel_id,'folio.item_added','FOLIO','Folio',f.id,
    jsonb_build_object('folio_item_id',v_id,'source',p_source,'source_key',p_source_key,'total',round(p_quantity*p_unit_price,2)),
    auth.uid()
  );
  return v_id;
end;
$$;

revoke all on function public.hotel_os_financial_add_charge(uuid,text,text,text,numeric,numeric) from public;
grant execute on function public.hotel_os_financial_add_charge(uuid,text,text,text,numeric,numeric) to authenticated;

create or replace function public.hotel_os_financial_receive_payment(
  p_folio_id uuid,
  p_amount numeric,
  p_method text,
  p_external_reference text default null,
  p_idempotency_key text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  f record;
  v_existing uuid;
  v_id uuid;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;

  if nullif(trim(coalesce(p_idempotency_key,'')),'') is not null then
    select id into v_existing from public.hotel_os_transactions
    where folio_id=p_folio_id and idempotency_key=p_idempotency_key
    limit 1;
    if v_existing is not null then return v_existing; end if;
  end if;

  select public.hotel_os_add_folio_payment(p_folio_id,p_amount,p_method,p_external_reference) into v_id;

  if nullif(trim(coalesce(p_idempotency_key,'')),'') is not null then
    update public.hotel_os_transactions
    set idempotency_key=p_idempotency_key
    where id=v_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.hotel_os_financial_receive_payment(uuid,numeric,text,text,text) from public;
grant execute on function public.hotel_os_financial_receive_payment(uuid,numeric,text,text,text) to authenticated;

create or replace function public.hotel_os_financial_folio_snapshot(p_folio_id uuid)
returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare
  f record;
  v_charges numeric:=0;
  v_payments numeric:=0;
  v_refunds numeric:=0;
  v_items jsonb:='[]'::jsonb;
  v_payment_rows jsonb:='[]'::jsonb;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id;
  if not found then raise exception 'Folio não encontrado'; end if;
  if not public.usuario_pode_hotel(f.hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;

  select coalesce(sum(case when status='active' then total else 0 end),0),
         coalesce(jsonb_agg(jsonb_build_object(
           'id',id,'source',source,'sourceKey',source_key,'description',description,
           'quantity',quantity,'unitPrice',unit_amount,'total',total,'status',status,'createdAt',created_at
         ) order by created_at) filter (where id is not null),'[]'::jsonb)
    into v_charges,v_items
  from public.hotel_os_folio_items
  where folio_id=f.id;

  select
    coalesce(sum(case when transaction_type='payment' and status='approved' then amount else 0 end),0),
    coalesce(sum(case when transaction_type='refund' and status in ('approved','refunded') then amount else 0 end),0),
    coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'amount',amount,'method',coalesce(payment_method,method),'status',status,
      'externalReference',external_reference,'idempotencyKey',idempotency_key,'createdAt',created_at
    ) order by created_at) filter (where transaction_type='payment'),'[]'::jsonb)
    into v_payments,v_refunds,v_payment_rows
  from public.hotel_os_transactions
  where folio_id=f.id;

  return jsonb_build_object(
    'folioId',f.id,'hotelId',f.hotel_id,'stayId',f.stay_id,'status',f.status,
    'currency',coalesce(f.currency,'BRL'),'chargesTotal',round(v_charges,2),
    'paymentsTotal',round(v_payments,2),'refundsTotal',round(v_refunds,2),
    'balance',round(v_charges-v_payments+v_refunds,2),'items',v_items,'payments',v_payment_rows
  );
end;
$$;

revoke all on function public.hotel_os_financial_folio_snapshot(uuid) from public;
grant execute on function public.hotel_os_financial_folio_snapshot(uuid) to authenticated;

create or replace function public.hotel_os_financial_folio_snapshot_by_stay(p_stay_id uuid)
returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare v_folio uuid;
begin
  select id into v_folio from public.hotel_os_folios where stay_id=p_stay_id order by created_at desc limit 1;
  if v_folio is null then raise exception 'Folio não encontrado'; end if;
  return public.hotel_os_financial_folio_snapshot(v_folio);
end;
$$;

revoke all on function public.hotel_os_financial_folio_snapshot_by_stay(uuid) from public;
grant execute on function public.hotel_os_financial_folio_snapshot_by_stay(uuid) to authenticated;

create or replace function public.hotel_os_financial_can_checkout(p_stay_id uuid)
returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare f record; s jsonb; v_balance numeric;
begin
  select * into f from public.hotel_os_folios where stay_id=p_stay_id order by created_at desc limit 1;
  if not found then
    return jsonb_build_object('stayId',p_stay_id,'folioId',null,'balance',0,'eligible',false,'reason','FOLIO_NOT_FOUND');
  end if;
  if not public.usuario_pode_hotel(f.hotel_id) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
  s := public.hotel_os_financial_folio_snapshot(f.id);
  v_balance := coalesce((s->>'balance')::numeric,0);
  if f.status <> 'open' then
    return jsonb_build_object('stayId',p_stay_id,'folioId',f.id,'balance',v_balance,'eligible',false,'reason','FOLIO_NOT_OPEN');
  end if;
  if v_balance > 0 then
    return jsonb_build_object('stayId',p_stay_id,'folioId',f.id,'balance',v_balance,'eligible',false,'reason','OUTSTANDING_BALANCE');
  end if;
  return jsonb_build_object('stayId',p_stay_id,'folioId',f.id,'balance',v_balance,'eligible',true,'reason','OK');
end;
$$;

revoke all on function public.hotel_os_financial_can_checkout(uuid) from public;
grant execute on function public.hotel_os_financial_can_checkout(uuid) to authenticated;

create or replace function public.hotel_os_financial_close_folio(p_folio_id uuid)
returns uuid
language plpgsql security definer set search_path=public as $$
declare f record; s jsonb; v_balance numeric;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  perform public.hotel_os_require_stay_permission(f.hotel_id,'folio_close');
  if f.status <> 'open' then return f.id; end if;
  s := public.hotel_os_financial_folio_snapshot(f.id);
  v_balance := coalesce((s->>'balance')::numeric,0);
  if v_balance > 0 then raise exception 'Folio possui saldo pendente: %',v_balance; end if;
  update public.hotel_os_folios set status='closed',closed_at=now() where id=f.id;
  perform public.hotel_os_record_audit(f.hotel_id,'folio_close','folio',f.id::text,jsonb_build_object('status','open'),jsonb_build_object('status','closed','balance',v_balance),'{}');
  return f.id;
end;
$$;

revoke all on function public.hotel_os_financial_close_folio(uuid) from public;
grant execute on function public.hotel_os_financial_close_folio(uuid) to authenticated;
