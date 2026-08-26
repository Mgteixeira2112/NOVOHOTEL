-- FASE 14 — Central de Eventos, Notificações e Comunicação em Tempo Real
-- Incremental: reutiliza organizations/hoteis/RBAC existentes e não remove entidades legadas.

create extension if not exists pgcrypto;

create table if not exists public.event_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  hotel_id uuid references public.hoteis(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  correlation_id uuid,
  idempotency_key text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'PENDING'
    check (status in ('PENDING','PROCESSING','PROCESSED','FAILED','DEAD_LETTER')),
  retry_count integer not null default 0 check (retry_count >= 0),
  last_error text
);

create unique index if not exists uq_event_log_idempotency
  on public.event_log(idempotency_key) where idempotency_key is not null;
create index if not exists idx_event_log_tenant_date
  on public.event_log(organization_id,hotel_id,created_at desc);
create index if not exists idx_event_log_type_status
  on public.event_log(event_type,status,created_at desc);
create index if not exists idx_event_log_entity
  on public.event_log(entity_type,entity_id,created_at desc);

create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid references public.hoteis(id) on delete cascade,
  name text not null,
  event_type text not null,
  condition jsonb not null default '{}'::jsonb,
  recipient_type text not null
    check (recipient_type in ('USER','ROLE','DEPARTMENT','HOTEL','ROOM','DEVICE','POS')),
  recipient_config jsonb not null default '{}'::jsonb,
  channel text not null
    check (channel in ('IN_APP','REALTIME','PUSH','EMAIL','SMS','WHATSAPP')),
  priority text not null default 'NORMAL'
    check (priority in ('LOW','NORMAL','HIGH','URGENT','CRITICAL')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (organization_id is not null or hotel_id is not null)
);

create index if not exists idx_notification_rules_scope_event
  on public.notification_rules(organization_id,hotel_id,event_type,enabled);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.event_log(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete restrict,
  hotel_id uuid references public.hoteis(id) on delete restrict,
  recipient_type text not null
    check (recipient_type in ('USER','ROLE','DEPARTMENT','HOTEL','ROOM','DEVICE','POS')),
  recipient_id text,
  channel text not null
    check (channel in ('IN_APP','REALTIME','PUSH','EMAIL','SMS','WHATSAPP')),
  priority text not null default 'NORMAL'
    check (priority in ('LOW','NORMAL','HIGH','URGENT','CRITICAL')),
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  delivery_status text not null default 'PENDING'
    check (delivery_status in ('PENDING','PROCESSING','SENT','DELIVERED','READ','FAILED','CANCELLED')),
  read_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(recipient_type,recipient_id,read_at,created_at desc);
create index if not exists idx_notifications_tenant_date
  on public.notifications(organization_id,hotel_id,created_at desc);
create index if not exists idx_notifications_event
  on public.notifications(event_id);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid references public.hoteis(id) on delete cascade,
  event_type text not null,
  channel text not null
    check (channel in ('IN_APP','REALTIME','PUSH','EMAIL','SMS','WHATSAPP')),
  enabled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,organization_id,hotel_id,event_type,channel)
);

create index if not exists idx_notification_preferences_user_scope
  on public.notification_preferences(user_id,organization_id,hotel_id,event_type);

create table if not exists public.device_presence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  hotel_id uuid references public.hoteis(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  device_id uuid,
  presence_type text not null check (presence_type in ('USER','DEVICE','POS','TABLET')),
  status text not null check (status in ('ONLINE','OFFLINE')),
  last_seen_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_device_presence_tenant_seen
  on public.device_presence(organization_id,hotel_id,last_seen_at desc);
create unique index if not exists uq_device_presence_device
  on public.device_presence(device_id) where device_id is not null;

-- Extensibilidade do catálogo de eventos sem espalhar strings de domínio.
create table if not exists public.event_catalog (
  event_type text primary key,
  description text,
  critical boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.event_catalog(event_type,description,critical) values
('RESERVATION_CREATED','Reserva criada',false),
('RESERVATION_CANCELLED','Reserva cancelada',false),
('GUEST_CHECKED_IN','Hóspede realizou check-in',false),
('GUEST_CHECKED_OUT','Hóspede realizou checkout',false),
('ORDER_CREATED','Pedido criado',false),
('ORDER_CONFIRMED','Pedido confirmado',false),
('ORDER_PREPARING','Pedido em preparação',false),
('ORDER_READY','Pedido pronto',false),
('ORDER_DELIVERED','Pedido entregue',false),
('ROOM_DIRTY','Quarto marcado como sujo',false),
('ROOM_CLEANING','Limpeza iniciada',false),
('ROOM_CLEAN','Quarto limpo',false),
('ROOM_INSPECTED','Quarto inspecionado',false),
('MAINTENANCE_CREATED','Manutenção criada',false),
('MAINTENANCE_STARTED','Manutenção iniciada',false),
('MAINTENANCE_COMPLETED','Manutenção concluída',false),
('MINIBAR_ITEM_ADDED','Item de frigobar lançado',false),
('MINIBAR_REVIEW_REQUIRED','Revisão de frigobar necessária',false),
('PAYMENT_RECEIVED','Pagamento recebido',false),
('PAYMENT_FAILED','Pagamento falhou',true),
('PAYMENT_REFUNDED','Pagamento estornado',false),
('LOW_STOCK','Estoque baixo',false),
('OUT_OF_STOCK','Produto sem estoque',false),
('LOGIN_FAILED','Falha de login',true)
on conflict (event_type) do update set description=excluded.description,critical=excluded.critical,enabled=true;

-- Exemplos de regras iniciais. Regras reais devem ser configuradas por hotel.
insert into public.notification_rules(
  organization_id,hotel_id,name,event_type,condition,recipient_type,recipient_config,channel,priority
)
select h.organization_id,h.id,'Pedido de tablet para cozinha','ORDER_CREATED',
       '{"source":"ROOM_TABLET"}'::jsonb,'DEPARTMENT','{"department":"KITCHEN"}'::jsonb,'REALTIME','HIGH'
from public.hoteis h
where not exists (
  select 1 from public.notification_rules r
  where r.hotel_id=h.id and r.name='Pedido de tablet para cozinha'
);

-- RLS: leitura somente no escopo autorizado. Escrita crítica deve ocorrer pelo backend/service role.
alter table public.event_log enable row level security;
alter table public.notification_rules enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.device_presence enable row level security;
alter table public.event_catalog enable row level security;

DROP POLICY IF EXISTS event_log_select_authorized ON public.event_log;
CREATE POLICY event_log_select_authorized ON public.event_log
FOR SELECT TO authenticated USING (
  (hotel_id is not null and public.user_has_hotel_access(hotel_id::text))
  OR (hotel_id is null and organization_id is not null and public.user_has_organization_access(organization_id))
);

DROP POLICY IF EXISTS notification_rules_select_authorized ON public.notification_rules;
CREATE POLICY notification_rules_select_authorized ON public.notification_rules
FOR SELECT TO authenticated USING (
  (hotel_id is not null and public.user_has_hotel_access(hotel_id::text))
  OR (hotel_id is null and organization_id is not null and public.user_has_organization_access(organization_id))
);

DROP POLICY IF EXISTS notifications_select_authorized ON public.notifications;
CREATE POLICY notifications_select_authorized ON public.notifications
FOR SELECT TO authenticated USING (
  (recipient_type='USER' and recipient_id=auth.uid()::text)
  OR (hotel_id is not null and public.user_has_hotel_access(hotel_id::text))
  OR (hotel_id is null and organization_id is not null and public.user_has_organization_access(organization_id))
);

DROP POLICY IF EXISTS notification_preferences_self ON public.notification_preferences;
CREATE POLICY notification_preferences_self ON public.notification_preferences
FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

DROP POLICY IF EXISTS device_presence_select_authorized ON public.device_presence;
CREATE POLICY device_presence_select_authorized ON public.device_presence
FOR SELECT TO authenticated USING (
  (hotel_id is not null and public.user_has_hotel_access(hotel_id::text))
  OR (hotel_id is null and organization_id is not null and public.user_has_organization_access(organization_id))
);

DROP POLICY IF EXISTS event_catalog_read ON public.event_catalog;
CREATE POLICY event_catalog_read ON public.event_catalog
FOR SELECT TO authenticated USING (enabled=true);

-- Função atômica para registrar evento com idempotência.
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
set search_path=public
as $$
declare v_id uuid;
begin
  if p_hotel_id is not null and p_organization_id is null then
    select organization_id into p_organization_id from public.hoteis where id=p_hotel_id;
  end if;
  if p_event_type is null or length(trim(p_event_type))=0 then
    raise exception 'event_type is required';
  end if;
  if p_idempotency_key is not null then
    select id into v_id from public.event_log where idempotency_key=p_idempotency_key;
    if v_id is not null then return v_id; end if;
  end if;
  insert into public.event_log(event_type,organization_id,hotel_id,actor_user_id,entity_type,entity_id,payload,correlation_id,idempotency_key)
  values(p_event_type,p_organization_id,p_hotel_id,p_actor_user_id,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb),p_correlation_id,p_idempotency_key)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.emit_event(text,uuid,uuid,uuid,text,text,jsonb,uuid,text) from public;
grant execute on function public.emit_event(text,uuid,uuid,uuid,text,text,jsonb,uuid,text) to authenticated;
