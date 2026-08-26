-- FASE 17 — Auditoria final e hardening de produção.
-- Migration aditiva: corrige invariantes críticos sem remover dados operacionais.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. AUDITORIA APPEND-ONLY
-- ============================================================

create or replace function public.hotel_os_audit_log_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Somente operações de infraestrutura/service-role podem alterar a trilha.
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'AUDIT_LOG_IMMUTABLE';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_hotel_os_audit_log_immutable on public.hotel_audit_log;
create trigger trg_hotel_os_audit_log_immutable
before update or delete on public.hotel_audit_log
for each row execute function public.hotel_os_audit_log_immutable();

-- ============================================================
-- 2. EVENT BUS: TENANT E ACTOR DERIVADOS DO CONTEXTO
-- ============================================================

create or replace function public.emit_event(
  p_event_type text,
  p_organization_id uuid,
  p_hotel_id uuid,
  p_actor_user_id uuid,
  p_entity_type text,
  p_entity_id text,
  p_payload jsonb default '{}'::jsonb,
  p_correlation_id uuid default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_org uuid;
  v_actor uuid := auth.uid();
  v_catalog boolean;
begin
  if v_actor is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select exists(
    select 1 from public.event_catalog
    where event_type = p_event_type and enabled
  ) into v_catalog;
  if not v_catalog then
    raise exception 'EVENT_TYPE_NOT_ALLOWED';
  end if;

  if p_hotel_id is not null then
    select organization_id into v_org from public.hoteis where id = p_hotel_id;
    if v_org is null then raise exception 'HOTEL_NOT_FOUND'; end if;
    if not public.user_has_hotel_access(p_hotel_id::text) then
      raise exception 'HOTEL_ACCESS_DENIED';
    end if;
    if p_organization_id is not null and p_organization_id <> v_org then
      raise exception 'ORGANIZATION_HOTEL_MISMATCH';
    end if;
  elsif p_organization_id is not null and not public.user_has_organization_access(p_organization_id) then
    raise exception 'ORGANIZATION_ACCESS_DENIED';
  end if;

  if p_idempotency_key is not null then
    select id into v_id
    from public.event_log
    where idempotency_key = p_idempotency_key;
    if v_id is not null then return v_id; end if;
  end if;

  begin
    insert into public.event_log(
      event_type, organization_id, hotel_id, actor_user_id, entity_type,
      entity_id, payload, correlation_id, idempotency_key
    ) values (
      p_event_type, coalesce(v_org, p_organization_id), p_hotel_id, v_actor,
      p_entity_type, p_entity_id, coalesce(p_payload, '{}'::jsonb),
      p_correlation_id, p_idempotency_key
    ) returning id into v_id;
  exception when unique_violation then
    if p_idempotency_key is null then raise; end if;
    select id into v_id from public.event_log where idempotency_key = p_idempotency_key;
  end;

  return v_id;
end;
$$;

revoke all on function public.emit_event(text,uuid,uuid,uuid,text,text,jsonb,uuid,text) from public;
grant execute on function public.emit_event(text,uuid,uuid,uuid,text,text,jsonb,uuid,text) to authenticated;

-- ============================================================
-- 3. PAGAMENTOS FINANCEIROS: IDEMPOTÊNCIA SEM QUEBRAR PARCELAS
-- ============================================================

alter table public.hotel_os_financial_transactions
  add column if not exists idempotency_key text;

drop index if exists public.uq_financial_source;
create unique index if not exists uq_financial_idempotency
  on public.hotel_os_financial_transactions(hotel_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_financial_source_trace
  on public.hotel_os_financial_transactions(hotel_id, source, source_id, transaction_date desc);

create or replace function public.hotel_os_settle_financial_account(
  p_account_type text,
  p_account_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_hotel uuid;
  v_due numeric(14,2);
  v_paid numeric(14,2);
  v_source text;
  v_type text;
  v_tx uuid;
begin
  if upper(p_account_type) not in ('RECEIVABLE','PAYABLE') then
    raise exception 'INVALID_ACCOUNT_TYPE';
  end if;
  if p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;

  if upper(p_account_type)='RECEIVABLE' then
    select hotel_id, amount, received_amount
      into v_hotel, v_due, v_paid
      from public.hotel_os_accounts_receivable
     where id=p_account_id for update;
    v_source := 'ACCOUNT_RECEIVABLE';
    v_type := 'REVENUE';
  else
    select hotel_id, amount, paid_amount
      into v_hotel, v_due, v_paid
      from public.hotel_os_accounts_payable
     where id=p_account_id for update;
    v_source := 'ACCOUNT_PAYABLE';
    v_type := 'EXPENSE';
  end if;

  if v_hotel is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if not public.usuario_pode_hotel(v_hotel) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
  if p_amount > v_due - v_paid then raise exception 'AMOUNT_EXCEEDS_BALANCE'; end if;

  if p_idempotency_key is not null then
    select id into v_tx
      from public.hotel_os_financial_transactions
     where hotel_id=v_hotel and idempotency_key=p_idempotency_key;
    if v_tx is not null then return v_tx; end if;
  end if;

  insert into public.hotel_os_financial_transactions(
    hotel_id,type,amount,description,source,source_id,created_by,idempotency_key
  ) values (
    v_hotel,v_type,p_amount,coalesce(p_reference,'Settlement'),v_source,
    p_account_id::text,auth.uid(),p_idempotency_key
  ) returning id into v_tx;

  if upper(p_account_type)='RECEIVABLE' then
    update public.hotel_os_accounts_receivable
       set received_amount=received_amount+p_amount,
           status=case when received_amount+p_amount>=amount then 'PAID' else 'PARTIALLY_PAID' end,
           paid_at=case when received_amount+p_amount>=amount then now() else paid_at end
     where id=p_account_id;
  else
    update public.hotel_os_accounts_payable
       set paid_amount=paid_amount+p_amount,
           status=case when paid_amount+p_amount>=amount then 'PAID' else 'PARTIALLY_PAID' end,
           paid_at=case when paid_amount+p_amount>=amount then now() else paid_at end
     where id=p_account_id;
  end if;

  perform public.hotel_os_record_audit(
    v_hotel,
    case when v_type='REVENUE' then 'finance_receive' else 'finance_pay' end,
    'financial_transaction',
    v_tx::text,
    null,
    jsonb_build_object('account_id',p_account_id,'amount',p_amount,'method',p_method,'idempotency_key',p_idempotency_key),
    '{}'
  );
  return v_tx;
end;
$$;

revoke all on function public.hotel_os_settle_financial_account(text,uuid,numeric,text,text,text) from public;
grant execute on function public.hotel_os_settle_financial_account(text,uuid,numeric,text,text,text) to authenticated;

-- ============================================================
-- 4. CAIXA: NÃO DUPLICAR A ABERTURA NO EXPECTED CASH
-- ============================================================

create or replace function public.hotel_os_close_cash(p_cash_session_id uuid,p_actual_cash numeric)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  s record;
  expected numeric(12,2);
  diff numeric(12,2);
begin
  select cs.*, cr.hotel_id
    into s
    from public.pdv_cash_sessions cs
    join public.pdv_cash_registers cr on cr.id=cs.cash_register_id
   where cs.id=p_cash_session_id
   for update;

  if not found then raise exception 'Sessão não encontrada'; end if;
  perform public.hotel_os_require_permission(s.hotel_id,'pos.close_cash');
  if s.status <> 'OPEN' then raise exception 'Caixa já fechado'; end if;
  if p_actual_cash < 0 then raise exception 'Valor contado inválido'; end if;

  select round(
    s.opening_amount
    + coalesce(sum(case when type in ('SALE','SUPPLY','ADJUSTMENT') and payment_method='CASH' then amount else 0 end),0)
    - coalesce(sum(case when type in ('REFUND','WITHDRAWAL') and payment_method='CASH' then amount else 0 end),0),
    2
  ) into expected
  from public.pdv_cash_movements
  where cash_session_id=s.id;

  diff:=round(p_actual_cash-expected,2);

  update public.pdv_cash_sessions
     set status='CLOSED',closed_at=now(),expected_cash=expected,
         actual_cash=p_actual_cash,difference=diff
   where id=s.id;

  insert into public.pdv_cash_movements(
    hotel_id,cash_session_id,type,amount,payment_method,description,created_by
  ) values (
    s.hotel_id,s.id,'CLOSING',p_actual_cash,'CASH',
    'Fechamento; diferença '||diff,auth.uid()::text
  );

  begin
    perform public.hotel_os_record_audit(
      s.hotel_id,'cash_closed','cash_session',s.id::text,
      jsonb_build_object('expected_cash',expected),
      jsonb_build_object('actual_cash',p_actual_cash,'difference',diff),'{}'
    );
  exception when undefined_function then null;
  end;

  return s.id;
end;
$$;

revoke all on function public.hotel_os_close_cash(uuid,numeric) from public;
grant execute on function public.hotel_os_close_cash(uuid,numeric) to authenticated;

-- ============================================================
-- 5. PAGAMENTOS/FOLIO: IMPEDIR ESCRITA DIRETA PELO CLIENTE
-- ============================================================

DROP POLICY IF EXISTS hotel_os_payments_tenant ON public.hotel_os_payments;
CREATE POLICY hotel_os_payments_select ON public.hotel_os_payments
FOR SELECT TO authenticated
USING (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS hotel_os_financial_transactions_tenant ON public.hotel_os_financial_transactions;
CREATE POLICY hotel_os_financial_transactions_select ON public.hotel_os_financial_transactions
FOR SELECT TO authenticated
USING (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS hotel_os_reconciliations_tenant ON public.hotel_os_reconciliations;
CREATE POLICY hotel_os_reconciliations_select ON public.hotel_os_reconciliations
FOR SELECT TO authenticated
USING (public.usuario_pode_hotel(hotel_id));

-- Idempotência interna não deve expor response bodies a usuários comuns.
DROP POLICY IF EXISTS hotel_os_idempotency_keys_tenant ON public.hotel_os_idempotency_keys;

-- ============================================================
-- 6. INTEGRIDADE DE REFERÊNCIAS FINANCEIRAS
-- ============================================================

create or replace function public.hotel_os_validate_financial_refs()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.account_id is not null and not exists (
    select 1 from public.hotel_os_chart_of_accounts a
    where a.id=new.account_id and a.hotel_id=new.hotel_id
  ) then raise exception 'ACCOUNT_CROSS_HOTEL'; end if;

  if new.cost_center_id is not null and not exists (
    select 1 from public.hotel_os_cost_centers c
    where c.id=new.cost_center_id and c.hotel_id=new.hotel_id
  ) then raise exception 'COST_CENTER_CROSS_HOTEL'; end if;

  if new.room_id is not null and not exists (
    select 1 from public.quartos q
    where q.id::text=new.room_id::text and q.hotel_id::text=new.hotel_id::text
  ) then raise exception 'ROOM_CROSS_HOTEL'; end if;

  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_financial_refs on public.hotel_os_financial_transactions;
create trigger trg_hotel_os_validate_financial_refs
before insert or update on public.hotel_os_financial_transactions
for each row execute function public.hotel_os_validate_financial_refs();

-- ============================================================
-- 7. DIAGNÓSTICO DE PRODUÇÃO
-- ============================================================

create or replace function public.hotel_os_phase17_integrity_report()
returns table(check_name text, issue_count bigint)
language sql
security invoker
as $$
  select 'rooms_without_hotel', count(*)::bigint from public.quartos where hotel_id is null
  union all select 'reservations_without_hotel', count(*)::bigint from public.reservas where hotel_id is null
  union all select 'payments_without_hotel', count(*)::bigint from public.pagamentos where hotel_id is null
  union all select 'orders_without_hotel', count(*)::bigint from public.pdv_pedidos where hotel_id is null
  union all select 'folio_items_without_hotel', count(*)::bigint from public.hotel_os_folio_items where hotel_id is null
  union all select 'financial_transactions_without_hotel', count(*)::bigint from public.hotel_os_financial_transactions where hotel_id is null
  union all select 'devices_without_hotel', count(*)::bigint from public.hotel_os_devices where hotel_id is null;
$$;
