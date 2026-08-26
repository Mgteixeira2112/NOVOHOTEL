-- FASE 11 — Financeiro administrativo incremental
create extension if not exists pgcrypto;

create table if not exists public.hotel_os_chart_of_accounts (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, parent_id uuid references public.hotel_os_chart_of_accounts(id), code text not null, name text not null, type text not null check(type in ('REVENUE','COST','EXPENSE','ASSET','LIABILITY','EQUITY')), is_active boolean not null default true, created_at timestamptz not null default now(), unique(hotel_id,code));
create table if not exists public.hotel_os_cost_centers (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, code text, name text not null, is_active boolean not null default true, created_at timestamptz not null default now(), unique(hotel_id,name));
create table if not exists public.hotel_os_accounts_receivable (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, customer_id uuid, folio_id uuid references public.hotel_os_folios(id), description text not null, amount numeric(14,2) not null check(amount>0), received_amount numeric(14,2) not null default 0 check(received_amount>=0), due_date date not null, status text not null default 'OPEN' check(status in ('OPEN','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED')), currency text not null default 'BRL', source text, source_id text, idempotency_key text, created_at timestamptz not null default now(), paid_at timestamptz);
create unique index if not exists uq_ar_idempotency on public.hotel_os_accounts_receivable(hotel_id,idempotency_key) where idempotency_key is not null;
create table if not exists public.hotel_os_accounts_payable (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, supplier_id uuid, description text not null, amount numeric(14,2) not null check(amount>0), paid_amount numeric(14,2) not null default 0 check(paid_amount>=0), due_date date not null, status text not null default 'OPEN' check(status in ('OPEN','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED')), approval_status text not null default 'NOT_REQUIRED' check(approval_status in ('NOT_REQUIRED','PENDING','APPROVED','REJECTED')), approved_by uuid, approved_at timestamptz, currency text not null default 'BRL', cost_center_id uuid references public.hotel_os_cost_centers(id), room_id uuid, source text, source_id text, idempotency_key text, created_at timestamptz not null default now(), paid_at timestamptz);
create unique index if not exists uq_ap_idempotency on public.hotel_os_accounts_payable(hotel_id,idempotency_key) where idempotency_key is not null;
create table if not exists public.hotel_os_financial_transactions (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, type text not null check(type in ('REVENUE','EXPENSE','TRANSFER','ADJUSTMENT','REFUND','REVERSAL')), account_id uuid references public.hotel_os_chart_of_accounts(id), cost_center_id uuid references public.hotel_os_cost_centers(id), room_id uuid, amount numeric(14,2) not null check(amount>0), currency text not null default 'BRL', description text not null, source text not null, source_id text, transaction_date date not null default current_date, created_by uuid, reversal_of uuid references public.hotel_os_financial_transactions(id), created_at timestamptz not null default now());
create unique index if not exists uq_financial_source on public.hotel_os_financial_transactions(hotel_id,source,source_id,type) where source_id is not null;
create table if not exists public.hotel_os_bank_accounts (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, name text not null, bank_name text, currency text not null default 'BRL', is_active boolean not null default true, created_at timestamptz not null default now());
create table if not exists public.hotel_os_bank_transactions (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, bank_account_id uuid not null references public.hotel_os_bank_accounts(id), external_id text, amount numeric(14,2) not null check(amount<>0), transaction_date date not null, description text, reference text, document text, status text not null default 'UNRECONCILED' check(status in ('UNRECONCILED','RECONCILED','IGNORED')), created_at timestamptz not null default now(), unique(bank_account_id,external_id));
create table if not exists public.hotel_os_reconciliations (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, bank_transaction_id uuid not null references public.hotel_os_bank_transactions(id), financial_transaction_id uuid not null references public.hotel_os_financial_transactions(id), method text not null check(method in ('AUTO','MANUAL')), confidence numeric(5,2), reconciled_by uuid, reconciled_at timestamptz not null default now(), unique(bank_transaction_id,financial_transaction_id));
create table if not exists public.hotel_os_cash_variances (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, cash_session_id uuid, type text not null check(type in ('SHORTAGE','OVERAGE')), expected_amount numeric(14,2) not null, counted_amount numeric(14,2) not null, difference numeric(14,2) not null, reason text, approved_by uuid, created_at timestamptz not null default now());
create table if not exists public.hotel_os_recurring_expenses (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, supplier_id uuid, description text not null, amount numeric(14,2) not null check(amount>0), currency text not null default 'BRL', frequency text not null check(frequency in ('WEEKLY','MONTHLY','QUARTERLY','YEARLY')), next_due_date date not null, cost_center_id uuid references public.hotel_os_cost_centers(id), is_active boolean not null default true, created_by uuid, created_at timestamptz not null default now());
create table if not exists public.hotel_os_finance_approval_rules (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null, minimum_amount numeric(14,2) not null default 0, maximum_amount numeric(14,2), permission text not null default 'FINANCE_APPROVE', is_active boolean not null default true);

-- permissões granulares da fase 11, sem remover permissões existentes
insert into public.hotel_os_permissions(code,name) values
 ('FINANCE_VIEW','Finance view'),('FINANCE_CREATE','Finance create'),('FINANCE_EDIT','Finance edit'),('FINANCE_APPROVE','Finance approve'),('FINANCE_PAY','Finance pay'),('FINANCE_RECEIVE','Finance receive'),('FINANCE_RECONCILE','Finance reconcile'),('FINANCE_CLOSE','Finance close'),('FINANCE_REPORT','Finance report') on conflict do nothing;

-- RPC central: recebe/paga títulos e gera transação idempotente
create or replace function public.hotel_os_settle_financial_account(p_account_type text,p_account_id uuid,p_amount numeric,p_method text,p_reference text default null,p_idempotency_key text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_hotel uuid; v_due numeric(14,2); v_paid numeric(14,2); v_source text; v_type text; v_tx uuid;
begin
 if p_amount<=0 then raise exception 'INVALID_AMOUNT'; end if;
 if upper(p_account_type)='RECEIVABLE' then
  select hotel_id,amount,received_amount into v_hotel,v_due,v_paid from public.hotel_os_accounts_receivable where id=p_account_id for update;
  v_source:='ACCOUNT_RECEIVABLE'; v_type:='REVENUE';
 else
  select hotel_id,amount,paid_amount into v_hotel,v_due,v_paid from public.hotel_os_accounts_payable where id=p_account_id for update;
  v_source:='ACCOUNT_PAYABLE'; v_type:='EXPENSE';
 end if;
 if v_hotel is null then raise exception 'ACCOUNT_NOT_FOUND'; end if;
 if not public.usuario_pode_hotel(v_hotel) then raise exception 'HOTEL_ACCESS_DENIED'; end if;
 if p_amount>v_due-v_paid then raise exception 'AMOUNT_EXCEEDS_BALANCE'; end if;
 insert into public.hotel_os_financial_transactions(hotel_id,type,amount,description,source,source_id,created_by)
 values(v_hotel,v_type,p_amount,coalesce(p_reference,'Settlement'),v_source,p_account_id::text,auth.uid()) on conflict(hotel_id,source,source_id,type) where source_id is not null do update set amount=excluded.amount returning id into v_tx;
 if upper(p_account_type)='RECEIVABLE' then
  update public.hotel_os_accounts_receivable set received_amount=received_amount+p_amount,status=case when received_amount+p_amount>=amount then 'PAID' else 'PARTIALLY_PAID' end,paid_at=case when received_amount+p_amount>=amount then now() else paid_at end where id=p_account_id;
 else
  update public.hotel_os_accounts_payable set paid_amount=paid_amount+p_amount,status=case when paid_amount+p_amount>=amount then 'PAID' else 'PARTIALLY_PAID' end,paid_at=case when paid_amount+p_amount>=amount then now() else paid_at end where id=p_account_id;
 end if;
 perform public.hotel_os_record_audit(v_hotel,case when v_type='REVENUE' then 'finance_receive' else 'finance_pay' end,'financial_transaction',v_tx::text,null,jsonb_build_object('account_id',p_account_id,'amount',p_amount,'method',p_method),'{}');
 return v_tx;
end; $$;
grant execute on function public.hotel_os_settle_financial_account(text,uuid,numeric,text,text,text) to authenticated;

-- tenant RLS
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['hotel_os_chart_of_accounts','hotel_os_cost_centers','hotel_os_accounts_receivable','hotel_os_accounts_payable','hotel_os_financial_transactions','hotel_os_bank_accounts','hotel_os_bank_transactions','hotel_os_reconciliations','hotel_os_cash_variances','hotel_os_recurring_expenses','hotel_os_finance_approval_rules'] LOOP
 EXECUTE format('alter table public.%I enable row level security',t);
 BEGIN EXECUTE format('create policy %I on public.%I for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id))',t||'_tenant',t); EXCEPTION WHEN duplicate_object THEN NULL; END;
 END LOOP; END $$;

create index if not exists idx_financial_tx_hotel_date on public.hotel_os_financial_transactions(hotel_id,transaction_date desc,type);
create index if not exists idx_ar_hotel_due on public.hotel_os_accounts_receivable(hotel_id,status,due_date);
create index if not exists idx_ap_hotel_due on public.hotel_os_accounts_payable(hotel_id,status,due_date);
