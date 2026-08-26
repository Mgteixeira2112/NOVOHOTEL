-- FASE 15 — relatórios, exportações, metas e alertas gerenciais

create table if not exists public.hotel_os_dashboard_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  metric_code text references public.hotel_os_metric_definitions(code),
  alert_type text not null,
  severity text not null default 'WARNING' check(severity in ('INFO','WARNING','CRITICAL')),
  title text not null,
  description text not null,
  current_value numeric(14,4),
  target_value numeric(14,4),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_dashboard_alerts_hotel_open on public.hotel_os_dashboard_alerts(hotel_id,severity,created_at desc) where resolved_at is null;

create table if not exists public.hotel_os_report_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid references public.hoteis(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  report_code text not null,
  format text not null check(format in ('PDF','CSV','XLSX')),
  period_start date,
  period_end date,
  status text not null default 'REQUESTED' check(status in ('REQUESTED','PROCESSING','READY','FAILED')),
  file_path text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_report_exports_user_date on public.hotel_os_report_exports(user_id,created_at desc);
create index if not exists idx_report_exports_hotel_date on public.hotel_os_report_exports(hotel_id,created_at desc);

create table if not exists public.hotel_os_scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid references public.hoteis(id) on delete cascade,
  report_code text not null,
  frequency text not null check(frequency in ('DAILY','WEEKLY','MONTHLY')),
  channel text not null default 'EMAIL' check(channel in ('EMAIL','IN_APP')),
  recipients jsonb not null default '[]'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  next_run_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_scheduled_reports_due on public.hotel_os_scheduled_reports(enabled,next_run_at);

alter table public.hotel_os_dashboard_alerts enable row level security;
alter table public.hotel_os_report_exports enable row level security;
alter table public.hotel_os_scheduled_reports enable row level security;

drop policy if exists dashboard_alerts_hotel on public.hotel_os_dashboard_alerts;
create policy dashboard_alerts_hotel on public.hotel_os_dashboard_alerts for select to authenticated using(public.usuario_pode_hotel(hotel_id));
drop policy if exists report_exports_self_or_hotel on public.hotel_os_report_exports;
create policy report_exports_self_or_hotel on public.hotel_os_report_exports for select to authenticated using(user_id=auth.uid() or (hotel_id is not null and public.usuario_pode_hotel(hotel_id)));
drop policy if exists scheduled_reports_hotel on public.hotel_os_scheduled_reports;
create policy scheduled_reports_hotel on public.hotel_os_scheduled_reports for all to authenticated using(hotel_id is null or public.usuario_pode_hotel(hotel_id)) with check(hotel_id is null or public.usuario_pode_hotel(hotel_id));

insert into public.hotel_os_report_definitions(hotel_id,code,name,category,config)
select null,'ROOMS','Relatório de hospedagem','HOSPEDAGEM','{"formats":["PDF","CSV","XLSX"]}'::jsonb where not exists(select 1 from public.hotel_os_report_definitions where hotel_id is null and code='ROOMS');
insert into public.hotel_os_report_definitions(hotel_id,code,name,category,config)
select null,'RESERVATIONS','Relatório de reservas','RESERVAS','{"formats":["PDF","CSV","XLSX"]}'::jsonb where not exists(select 1 from public.hotel_os_report_definitions where hotel_id is null and code='RESERVATIONS');
insert into public.hotel_os_report_definitions(hotel_id,code,name,category,config)
select null,'FINANCE','Relatório financeiro','FINANCEIRO','{"formats":["PDF","CSV","XLSX"],"permission":"FINANCE_REPORT"}'::jsonb where not exists(select 1 from public.hotel_os_report_definitions where hotel_id is null and code='FINANCE');
insert into public.hotel_os_report_definitions(hotel_id,code,name,category,config)
select null,'PDV','Relatório de PDV','PDV','{"formats":["PDF","CSV","XLSX"]}'::jsonb where not exists(select 1 from public.hotel_os_report_definitions where hotel_id is null and code='PDV');
insert into public.hotel_os_report_definitions(hotel_id,code,name,category,config)
select null,'INVENTORY','Relatório de estoque','ESTOQUE','{"formats":["PDF","CSV","XLSX"]}'::jsonb where not exists(select 1 from public.hotel_os_report_definitions where hotel_id is null and code='INVENTORY');
insert into public.hotel_os_report_definitions(hotel_id,code,name,category,config)
select null,'OPERATIONS','Relatório operacional','OPERACAO','{"formats":["PDF","CSV","XLSX"]}'::jsonb where not exists(select 1 from public.hotel_os_report_definitions where hotel_id is null and code='OPERATIONS');
