-- FASE 12 — Governança, auditoria e segurança operacional.
-- Migration aditiva: preserva hotel_audit_log, hotel_sessions e hotel_devices existentes.

create extension if not exists pgcrypto;

-- Estende a trilha de auditoria existente; não cria uma segunda auditoria.
alter table if exists public.hotel_audit_log
  add column if not exists action text,
  add column if not exists before_data jsonb,
  add column if not exists after_data jsonb,
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists device_id uuid,
  add column if not exists request_id uuid,
  add column if not exists correlation_id uuid;

-- Sessões da aplicação complementam a sessão do Supabase Auth.
alter table if exists public.hotel_sessions
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists last_activity_at timestamptz;

alter table if exists public.hotel_devices
  add column if not exists status text,
  add column if not exists device_identifier text;

create table if not exists public.hotel_os_error_log (
  id uuid primary key default gen_random_uuid(),
  hotel_id text,
  user_id uuid,
  request_id uuid,
  correlation_id uuid,
  severity text not null check (severity in ('DEBUG','INFO','WARNING','ERROR','CRITICAL')),
  message text not null,
  stack text,
  endpoint text,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_os_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  hotel_id text,
  user_id uuid,
  idempotency_key text not null,
  operation text not null,
  request_hash text,
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique(hotel_id, operation, idempotency_key)
);

create table if not exists public.hotel_os_approval_requests (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null,
  action text not null,
  entity_type text,
  entity_id text,
  requested_by uuid,
  approved_by uuid,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  reason text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELLED'))
);

create table if not exists public.hotel_os_rate_limits (
  id uuid primary key default gen_random_uuid(),
  subject_key text not null,
  action text not null,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  blocked_until timestamptz,
  unique(subject_key, action)
);

create table if not exists public.hotel_os_health_checks (
  id uuid primary key default gen_random_uuid(),
  hotel_id text,
  component text not null check (component in ('API','DATABASE','REALTIME','STORAGE','BACKUP','NOTIFICATIONS','INTEGRATIONS')),
  check_type text not null check (check_type in ('LIVENESS','READINESS','DEPENDENCY')),
  status text not null check (status in ('HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN')),
  latency_ms integer,
  message text,
  checked_at timestamptz not null default now()
);

create table if not exists public.hotel_os_backup_policies (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null,
  retention_days integer not null default 30 check (retention_days > 0),
  rpo_minutes integer not null default 1440 check (rpo_minutes > 0),
  rto_minutes integer not null default 240 check (rto_minutes > 0),
  encryption_required boolean not null default true,
  restore_test_frequency_days integer not null default 30 check (restore_test_frequency_days > 0),
  storage_class text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(hotel_id)
);

create table if not exists public.hotel_os_backup_runs (
  id uuid primary key default gen_random_uuid(),
  hotel_id text,
  backup_type text not null check (backup_type in ('FULL','INCREMENTAL','SNAPSHOT')),
  status text not null check (status in ('STARTED','COMPLETED','FAILED','RESTORE_TESTED')),
  storage_reference text,
  encrypted boolean not null default true,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  verified_at timestamptz,
  error_message text
);

-- Roles sistêmicos solicitados, preservando papéis existentes.
insert into public.rbac_papeis(codigo,nome,descricao,nivel,exclusivo,ativo) values
('SUPER_ADMIN','Super Administrador','Governança global da plataforma',100,false,true),
('HOTEL_ADMIN','Administrador do Hotel','Governança administrativa do hotel',90,false,true),
('FINANCE_MANAGER','Gestor Financeiro','Governança financeira',70,false,true),
('OPERATIONS_MANAGER','Gestor Operacional','Governança operacional',70,false,true)
on conflict (codigo) do update set nome=excluded.nome, descricao=excluded.descricao, nivel=excluded.nivel, ativo=true;

insert into public.hotel_permissions(key,description) values
('AUDIT_VIEW','Visualizar auditoria'),
('AUDIT_EXPORT','Exportar auditoria'),
('SECURITY_VIEW','Visualizar segurança operacional'),
('SESSION_VIEW','Visualizar sessões'),
('SESSION_REVOKE','Revogar sessões'),
('DEVICE_VIEW','Visualizar dispositivos'),
('DEVICE_BLOCK','Bloquear dispositivos'),
('BACKUP_VIEW','Visualizar backups'),
('BACKUP_MANAGE','Gerenciar política de backup'),
('HEALTH_VIEW','Visualizar saúde do sistema'),
('ERROR_LOG_VIEW','Visualizar logs de erro'),
('APPROVAL_VIEW','Visualizar aprovações'),
('APPROVAL_DECIDE','Aprovar/rejeitar operações críticas'),
('SECURITY_RATE_LIMIT','Administrar limites de segurança')
on conflict (key) do nothing;

create index if not exists idx_hotel_audit_request on public.hotel_audit_log(hotel_id,request_id,created_at desc);
create index if not exists idx_hotel_audit_correlation on public.hotel_audit_log(hotel_id,correlation_id,created_at desc);
create index if not exists idx_error_log_hotel_created on public.hotel_os_error_log(hotel_id,created_at desc,severity);
create index if not exists idx_health_component_checked on public.hotel_os_health_checks(component,checked_at desc);
create index if not exists idx_backup_runs_hotel_started on public.hotel_os_backup_runs(hotel_id,started_at desc);
create index if not exists idx_approval_hotel_status on public.hotel_os_approval_requests(hotel_id,status,requested_at desc);

-- Sanitização de dados sensíveis antes de persistir auditoria.
create or replace function public.hotel_os_redact_jsonb(p_data jsonb)
returns jsonb language plpgsql immutable as $$
declare v jsonb := coalesce(p_data,'{}'::jsonb); k text;
begin
  foreach k in array array['password','senha','token','access_token','refresh_token','secret','api_key','service_role_key','card_number','numero_cartao','cvv','cvc'] loop
    v := v - k;
  end loop;
  return v;
end;
$$;

-- Auditoria segura: user_id é derivado da sessão autenticada, não do cliente.
create or replace function public.hotel_os_audit_secure(
  p_action text,
  p_hotel_id text default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_before_data jsonb default '{}'::jsonb,
  p_after_data jsonb default '{}'::jsonb,
  p_request_id uuid default null,
  p_correlation_id uuid default null,
  p_device_id uuid default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_hotel_id is not null and not public.user_has_hotel_access(p_hotel_id) then
    raise exception 'HOTEL_ACCESS_DENIED';
  end if;
  insert into public.hotel_audit_log(
    user_id,hotel_id,event_type,action,entity_type,entity_id,before_data,after_data,
    request_id,correlation_id,device_id,ip_address,user_agent,metadata
  ) values (
    auth.uid(),p_hotel_id,p_action,p_action,p_entity_type,p_entity_id,
    public.hotel_os_redact_jsonb(p_before_data),public.hotel_os_redact_jsonb(p_after_data),
    p_request_id,p_correlation_id,p_device_id,p_ip_address,p_user_agent,'{}'::jsonb
  ) returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.hotel_os_audit_secure(text,text,text,text,jsonb,jsonb,uuid,uuid,uuid,inet,text) to authenticated;

-- Rate limit atômico para serviços server-side/Edge Functions.
create or replace function public.hotel_os_rate_limit_check(
  p_subject_key text,
  p_action text,
  p_limit integer,
  p_window_seconds integer default 60
)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_attempts integer; v_started timestamptz; v_blocked timestamptz;
begin
  if p_limit <= 0 or p_window_seconds <= 0 then raise exception 'INVALID_RATE_LIMIT'; end if;
  insert into public.hotel_os_rate_limits(subject_key,action,attempts,window_started_at)
  values(p_subject_key,p_action,1,now())
  on conflict(subject_key,action) do update set
    attempts=case when now()-hotel_os_rate_limits.window_started_at > make_interval(secs=>p_window_seconds) then 1 else hotel_os_rate_limits.attempts+1 end,
    window_started_at=case when now()-hotel_os_rate_limits.window_started_at > make_interval(secs=>p_window_seconds) then now() else hotel_os_rate_limits.window_started_at end
  returning attempts,window_started_at,blocked_until into v_attempts,v_started,v_blocked;
  return v_blocked is null and v_attempts <= p_limit;
end;
$$;
grant execute on function public.hotel_os_rate_limit_check(text,text,integer,integer) to authenticated;

-- RLS: tenant scoped. Logs de segurança não ficam públicos.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['hotel_os_error_log','hotel_os_idempotency_keys','hotel_os_approval_requests','hotel_os_health_checks','hotel_os_backup_policies','hotel_os_backup_runs'] LOOP
    EXECUTE format('alter table public.%I enable row level security',t);
    BEGIN
      EXECUTE format('create policy %I on public.%I for all to authenticated using (hotel_id is null or public.user_has_hotel_access(hotel_id)) with check (hotel_id is null or public.user_has_hotel_access(hotel_id))',t||'_tenant',t);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END LOOP;
END $$;

-- Auditoria: leitura restrita ao próprio hotel/usuário; escrita preferencialmente via RPC.
DROP POLICY IF EXISTS hotel_audit_self_or_hotel ON public.hotel_audit_log;
CREATE POLICY hotel_audit_self_or_hotel ON public.hotel_audit_log
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (hotel_id IS NOT NULL AND public.user_has_hotel_access(hotel_id)));

-- Sessões: usuário só pode consultar/revogar as próprias sessões.
DROP POLICY IF EXISTS hotel_sessions_access ON public.hotel_sessions;
CREATE POLICY hotel_sessions_access ON public.hotel_sessions
FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Dispositivos permanecem tenant-scoped; bloqueio definitivo deve ser feito por backend/RPC.
DROP POLICY IF EXISTS hotel_devices_access ON public.hotel_devices;
CREATE POLICY hotel_devices_access ON public.hotel_devices
FOR ALL TO authenticated USING (public.user_has_hotel_access(hotel_id)) WITH CHECK (public.user_has_hotel_access(hotel_id));
