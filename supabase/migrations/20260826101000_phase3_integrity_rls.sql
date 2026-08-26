-- FASE 3 — endurecimento da integridade do Domain Core.
-- Corrige permissões amplas do Event Bus/Tasks e impede referências cross-hotel.

-- ============================================================
-- RLS: eventos, tarefas e workflows operacionais
-- ============================================================

drop policy if exists hotel_os_events_read on public.hotel_os_events;
drop policy if exists hotel_os_tasks_read on public.hotel_os_tasks;
drop policy if exists hotel_os_workflows_read on public.hotel_os_workflows;

drop policy if exists hotel_os_events_hotel_access on public.hotel_os_events;
create policy hotel_os_events_hotel_access on public.hotel_os_events
for select to authenticated
using (hotel_id is not null and public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_tasks_hotel_access on public.hotel_os_tasks;
create policy hotel_os_tasks_hotel_access on public.hotel_os_tasks
for all to authenticated
using (hotel_id is not null and public.usuario_pode_hotel(hotel_id))
with check (hotel_id is not null and public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_workflows_hotel_access on public.hotel_os_workflows;
create policy hotel_os_workflows_hotel_access on public.hotel_os_workflows
for all to authenticated
using (hotel_id is null or public.usuario_pode_hotel(hotel_id))
with check (hotel_id is null or public.usuario_pode_hotel(hotel_id));

-- ============================================================
-- CASH: somente uma sessão aberta por caixa
-- ============================================================

alter table public.hotel_os_cash_sessions
drop constraint if exists hotel_os_cash_sessions_cash_register_id_status_key;

create unique index if not exists uq_hotel_os_one_open_cash_session
on public.hotel_os_cash_sessions(cash_register_id)
where status = 'open';

-- ============================================================
-- FOLIO: item deve pertencer ao mesmo hotel da conta
-- ============================================================

create or replace function public.hotel_os_validate_folio_item_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (
    select 1 from public.hotel_os_folios f
    where f.id=new.folio_id and f.hotel_id=new.hotel_id
  ) then
    raise exception 'Folio não pertence ao hotel informado';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_folio_item_tenant on public.hotel_os_folio_items;
create trigger trg_hotel_os_validate_folio_item_tenant
before insert or update on public.hotel_os_folio_items
for each row execute function public.hotel_os_validate_folio_item_tenant();

-- ============================================================
-- INVENTORY: produto e movimento devem estar no mesmo hotel
-- ============================================================

create or replace function public.hotel_os_validate_inventory_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (
    select 1 from public.pdv_produtos p
    where p.id=new.product_id and p.hotel_id=new.hotel_id
  ) then
    raise exception 'Produto não pertence ao hotel da movimentação';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_inventory_tenant on public.hotel_os_inventory_movements;
create trigger trg_hotel_os_validate_inventory_tenant
before insert or update on public.hotel_os_inventory_movements
for each row execute function public.hotel_os_validate_inventory_tenant();

-- ============================================================
-- TRANSACTION: todas as referências devem respeitar o tenant
-- ============================================================

create or replace function public.hotel_os_validate_transaction_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.folio_id is not null and not exists(select 1 from public.hotel_os_folios f where f.id=new.folio_id and f.hotel_id=new.hotel_id) then
    raise exception 'Folio da transação pertence a outro hotel';
  end if;
  if new.order_id is not null and not exists(select 1 from public.pdv_pedidos p where p.id=new.order_id and p.hotel_id=new.hotel_id) then
    raise exception 'Pedido da transação pertence a outro hotel';
  end if;
  if new.cash_session_id is not null and not exists(select 1 from public.hotel_os_cash_sessions c where c.id=new.cash_session_id and c.hotel_id=new.hotel_id) then
    raise exception 'Sessão de caixa pertence a outro hotel';
  end if;
  if new.payment_id is not null and not exists(select 1 from public.pagamentos p where p.id=new.payment_id and p.hotel_id=new.hotel_id) then
    raise exception 'Pagamento pertence a outro hotel';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_transaction_tenant on public.hotel_os_transactions;
create trigger trg_hotel_os_validate_transaction_tenant
before insert or update on public.hotel_os_transactions
for each row execute function public.hotel_os_validate_transaction_tenant();

-- ============================================================
-- STAY: reservation e room devem ser do mesmo hotel
-- ============================================================

create or replace function public.hotel_os_validate_stay_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.reservas r where r.id=new.reservation_id and r.hotel_id=new.hotel_id and r.quarto_id=new.room_id) then
    raise exception 'Reservation/Room incompatíveis com o hotel da Stay';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_stay_tenant on public.hotel_os_stays;
create trigger trg_hotel_os_validate_stay_tenant
before insert or update on public.hotel_os_stays
for each row execute function public.hotel_os_validate_stay_tenant();

-- ============================================================
-- DEVICE: quarto associado deve pertencer ao mesmo hotel
-- ============================================================

create or replace function public.hotel_os_validate_device_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.room_id is not null and not exists(select 1 from public.quartos q where q.id=new.room_id and q.hotel_id::text=new.hotel_id) then
    raise exception 'Quarto do dispositivo pertence a outro hotel';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_device_tenant on public.hotel_devices;
create trigger trg_hotel_os_validate_device_tenant
before insert or update on public.hotel_devices
for each row execute function public.hotel_os_validate_device_tenant();

-- ============================================================
-- AUDITORIA CANÔNICA
-- ============================================================

create or replace function public.hotel_os_record_audit(
  p_hotel_id text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_old_data jsonb default null,
  p_new_data jsonb default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_hotel_id is not null and not public.user_has_hotel_access(p_hotel_id) then
    raise exception 'Usuário sem acesso ao hotel para auditoria';
  end if;
  insert into public.hotel_audit_log(user_id,actor_id,hotel_id,action,event_type,entity_type,entity_id,old_data,new_data,metadata)
  values(auth.uid(),auth.uid(),p_hotel_id,p_action,p_action,p_entity_type,p_entity_id,p_old_data,p_new_data,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.hotel_os_record_audit(text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.hotel_os_record_audit(text,text,text,text,jsonb,jsonb,jsonb) to authenticated;

-- ============================================================
-- DOMAIN EVENT: evento não pode ser emitido para outro hotel
-- ============================================================

create or replace function public.hotel_os_emit_event(
  p_hotel_id uuid,
  p_event_type text,
  p_source_module text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_created_by uuid default null
) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_hotel_id is null or not public.usuario_pode_hotel(p_hotel_id) then
    raise exception 'Usuário sem acesso ao hotel do evento';
  end if;
  insert into public.hotel_os_events(hotel_id,event_type,source_module,entity_type,entity_id,payload,created_by)
  values(p_hotel_id,p_event_type,p_source_module,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb),coalesce(p_created_by,auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.hotel_os_emit_event(uuid,text,text,text,uuid,jsonb,uuid) from public;
grant execute on function public.hotel_os_emit_event(uuid,text,text,text,uuid,jsonb,uuid) to authenticated;

-- ============================================================
-- RELATÓRIO DE DADOS NÃO MAPEADOS
-- ============================================================

create or replace function public.hotel_os_phase3_unmapped_report()
returns table(metric text,value bigint)
language sql stable security invoker as $$
  select 'rooms_without_hotel'::text,count(*)::bigint from public.quartos where hotel_id is null
  union all select 'room_types_without_hotel',count(*) from public.tipos_quarto where hotel_id is null
  union all select 'guests_without_hotel',count(*) from public.hospedes where hotel_id is null
  union all select 'reservations_without_hotel',count(*) from public.reservas where hotel_id is null
  union all select 'payments_without_hotel',count(*) from public.pagamentos where hotel_id is null
  union all select 'blocks_without_hotel',count(*) from public.bloqueios where hotel_id is null;
$$;
