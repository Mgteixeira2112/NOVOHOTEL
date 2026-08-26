-- FASE 5 — operações de Folio e endurecimento incremental

-- ============================================================
-- 1. HÓSPEDES DA RESERVA
-- ============================================================
create table if not exists public.hotel_os_reservation_guests (
  reservation_id text not null references public.reservas(id) on delete cascade,
  guest_id text not null references public.hospedes(id) on delete restrict,
  role text not null default 'COMPANION' check (role in ('PRIMARY','COMPANION','CHILD')),
  child_age integer check (child_age is null or child_age >= 0),
  created_at timestamptz not null default now(),
  primary key(reservation_id,guest_id)
);

alter table public.hotel_os_reservation_guests enable row level security;
drop policy if exists hotel_os_reservation_guests_hotel_access on public.hotel_os_reservation_guests;
create policy hotel_os_reservation_guests_hotel_access on public.hotel_os_reservation_guests for all to authenticated
using (exists(select 1 from public.reservas r where r.id=reservation_id and public.usuario_pode_hotel(r.hotel_id)))
with check (exists(select 1 from public.reservas r join public.hospedes h on h.id=guest_id where r.id=reservation_id and r.hotel_id=h.hotel_id and public.usuario_pode_hotel(r.hotel_id)));

-- ============================================================
-- 2. INSERÇÃO CENTRALIZADA DE FOLIO ITEM
-- ============================================================
create or replace function public.hotel_os_add_folio_item(
  p_folio_id uuid,
  p_source text,
  p_description text,
  p_quantity numeric,
  p_unit_price numeric,
  p_reference_id uuid default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  f record;
  v_id uuid;
  v_permission text;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  if f.status <> 'open' then raise exception 'Folio não está aberto'; end if;
  if p_quantity <= 0 or p_unit_price < 0 then raise exception 'Quantidade/preço inválidos'; end if;
  if p_source not in ('ROOM','POS','FRIGOBAR','ROOM_SERVICE','LAUNDRY','MANUAL','TAX','DISCOUNT','ADJUSTMENT') then raise exception 'Origem de Folio inválida'; end if;

  v_permission := case p_source
    when 'DISCOUNT' then 'discount'
    when 'ADJUSTMENT' then 'folio_adjustment'
    else 'folio_item_add'
  end;
  perform public.hotel_os_require_stay_permission(f.hotel_id,v_permission);

  insert into public.hotel_os_folio_items(hotel_id,folio_id,item_type,source,description,quantity,unit_amount,total,status,reference_id,created_by)
  values(f.hotel_id,p_folio_id,case p_source when 'ROOM' then 'room' when 'POS' then 'order' when 'FRIGOBAR' then 'minibar' when 'TAX' then 'tax' when 'DISCOUNT' then 'adjustment' when 'ADJUSTMENT' then 'adjustment' else 'other' end,p_source,p_description,p_quantity,p_unit_price,round(p_quantity*p_unit_price,2),'active',p_reference_id,auth.uid())
  returning id into v_id;

  perform public.hotel_os_emit_event(f.hotel_id,'folio.item_added','FOLIO','Folio',f.id,jsonb_build_object('folio_item_id',v_id,'source',p_source,'total',round(p_quantity*p_unit_price,2)),auth.uid());
  return v_id;
end;
$$;
revoke all on function public.hotel_os_add_folio_item(uuid,text,text,numeric,numeric,uuid) from public;
grant execute on function public.hotel_os_add_folio_item(uuid,text,text,numeric,numeric,uuid) to authenticated;

-- ============================================================
-- 3. PAGAMENTO PARCIAL / MÚLTIPLOS PAGAMENTOS
-- ============================================================
create or replace function public.hotel_os_add_folio_payment(
  p_folio_id uuid,
  p_amount numeric,
  p_method text,
  p_external_reference text default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare
  f record;
  v_id uuid;
  v_balance numeric;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  perform public.hotel_os_require_stay_permission(f.hotel_id,'payment');
  if f.status <> 'open' then raise exception 'Folio não está aberto'; end if;
  if p_amount <= 0 then raise exception 'Valor do pagamento inválido'; end if;
  if p_method not in ('CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER') then raise exception 'Método de pagamento inválido'; end if;

  select balance into v_balance from public.hotel_os_stay_folio_balance where folio_id=f.id;
  if p_amount > greatest(v_balance,0) then raise exception 'Pagamento excede o saldo do Folio'; end if;

  insert into public.hotel_os_transactions(hotel_id,folio_id,transaction_type,amount,method,payment_method,status,external_reference,created_by)
  values(f.hotel_id,f.id,'payment',p_amount,p_method,p_method,'approved',p_external_reference,auth.uid())
  returning id into v_id;

  perform public.hotel_os_emit_event(f.hotel_id,'folio.payment_created','FOLIO','Folio',f.id,jsonb_build_object('transaction_id',v_id,'amount',p_amount,'method',p_method),auth.uid());
  return v_id;
end;
$$;
revoke all on function public.hotel_os_add_folio_payment(uuid,numeric,text,text) from public;
grant execute on function public.hotel_os_add_folio_payment(uuid,numeric,text,text) to authenticated;

-- ============================================================
-- 4. ESTORNO / VOID SEM APAGAR LANÇAMENTO
-- ============================================================
create or replace function public.hotel_os_void_folio_item(p_folio_item_id uuid,p_reason text)
returns uuid
language plpgsql security definer set search_path=public as $$
declare i record; v_audit uuid;
begin
  select i.*,f.status as folio_status into i from public.hotel_os_folio_items i join public.hotel_os_folios f on f.id=i.folio_id where i.id=p_folio_item_id for update;
  if not found then raise exception 'FolioItem não encontrado'; end if;
  perform public.hotel_os_require_stay_permission(i.hotel_id,'refund');
  if i.status <> 'active' then raise exception 'Item não está ativo'; end if;
  update public.hotel_os_folio_items set status='voided' where id=i.id;
  select public.hotel_os_record_audit(i.hotel_id,'refund','folio_item',i.id::text,jsonb_build_object('status','active'),jsonb_build_object('status','voided','reason',p_reason),'{}') into v_audit;
  return i.id;
end;
$$;
revoke all on function public.hotel_os_void_folio_item(uuid,text) from public;
grant execute on function public.hotel_os_void_folio_item(uuid,text) to authenticated;

-- ============================================================
-- 5. TRANSFERÊNCIA DE ITEM ENTRE FOLIOS
-- ============================================================
create or replace function public.hotel_os_transfer_folio_item(p_folio_item_id uuid,p_target_folio_id uuid,p_reason text)
returns uuid
language plpgsql security definer set search_path=public as $$
declare i record; target record;
begin
  select i.* into i from public.hotel_os_folio_items i where i.id=p_folio_item_id for update;
  if not found then raise exception 'FolioItem não encontrado'; end if;
  select * into target from public.hotel_os_folios where id=p_target_folio_id for update;
  if not found then raise exception 'Folio destino não encontrado'; end if;
  if i.hotel_id <> target.hotel_id then raise exception 'Folios pertencem a hotéis diferentes'; end if;
  perform public.hotel_os_require_stay_permission(i.hotel_id,'folio_transfer');
  if target.status <> 'open' then raise exception 'Folio destino não está aberto'; end if;
  if i.status <> 'active' then raise exception 'Item não está ativo'; end if;
  update public.hotel_os_folio_items set status='transferred' where id=i.id;
  insert into public.hotel_os_folio_items(hotel_id,folio_id,item_type,source,description,quantity,unit_amount,total,status,reference_id,created_by)
  values(i.hotel_id,target.id,i.item_type,i.source,i.description,i.quantity,i.unit_amount,i.total,'active',i.id,auth.uid());
  perform public.hotel_os_record_audit(i.hotel_id,'folio_transfer','folio_item',i.id::text,jsonb_build_object('folio_id',i.folio_id),jsonb_build_object('folio_id',target.id,'reason',p_reason),'{}');
  return i.id;
end;
$$;
revoke all on function public.hotel_os_transfer_folio_item(uuid,uuid,text) from public;
grant execute on function public.hotel_os_transfer_folio_item(uuid,uuid,text) to authenticated;

-- ============================================================
-- 6. REABERTURA CONTROLADA DE FOLIO
-- ============================================================
create or replace function public.hotel_os_reopen_folio(p_folio_id uuid,p_reason text)
returns uuid
language plpgsql security definer set search_path=public as $$
declare f record;
begin
  select * into f from public.hotel_os_folios where id=p_folio_id for update;
  if not found then raise exception 'Folio não encontrado'; end if;
  perform public.hotel_os_require_stay_permission(f.hotel_id,'folio_reopen');
  if f.status <> 'closed' then raise exception 'Somente Folio fechado pode ser reaberto'; end if;
  update public.hotel_os_folios set status='open',closed_at=null where id=f.id;
  perform public.hotel_os_record_audit(f.hotel_id,'folio_reopen','folio',f.id::text,jsonb_build_object('status','closed'),jsonb_build_object('status','open','reason',p_reason),'{}');
  return f.id;
end;
$$;
revoke all on function public.hotel_os_reopen_folio(uuid,text) from public;
grant execute on function public.hotel_os_reopen_folio(uuid,text) to authenticated;

-- ============================================================
-- 7. AUDITORIA DE ALTERAÇÃO DE HOSPEDAGEM
-- ============================================================
create or replace function public.hotel_os_update_stay_primary_guest(p_stay_id uuid,p_guest_id text)
returns uuid
language plpgsql security definer set search_path=public as $$
declare s record; old_guest text;
begin
  select * into s from public.hotel_os_stays where id=p_stay_id for update;
  if not found then raise exception 'Stay não encontrada'; end if;
  perform public.hotel_os_require_stay_permission(s.hotel_id,'stay_edit');
  if not exists(select 1 from public.hospedes h where h.id=p_guest_id and h.hotel_id=s.hotel_id) then raise exception 'Hóspede inválido'; end if;
  old_guest:=s.primary_guest_id;
  update public.hotel_os_stays set primary_guest_id=p_guest_id where id=s.id;
  update public.hotel_os_stay_guests set is_primary=false where stay_id=s.id;
  insert into public.hotel_os_stay_guests(stay_id,guest_id,is_primary) values(s.id,p_guest_id,true) on conflict(stay_id,guest_id) do update set is_primary=true;
  perform public.hotel_os_record_audit(s.hotel_id,'stay_guest_changed','stay',s.id::text,jsonb_build_object('primary_guest_id',old_guest),jsonb_build_object('primary_guest_id',p_guest_id),'{}');
  return s.id;
end;
$$;
revoke all on function public.hotel_os_update_stay_primary_guest(uuid,text) from public;
grant execute on function public.hotel_os_update_stay_primary_guest(uuid,text) to authenticated;

-- ============================================================
-- 8. EVENTOS DE ROOM CHANGE / HOUSEKEEPING
-- ============================================================
create index if not exists idx_hotel_os_stays_active_room
  on public.hotel_os_stays(hotel_id,room_id,status) where status in ('EXPECTED','CHECKED_IN');
create index if not exists idx_hotel_os_folio_balance
  on public.hotel_os_folios(hotel_id,stay_id,status);
