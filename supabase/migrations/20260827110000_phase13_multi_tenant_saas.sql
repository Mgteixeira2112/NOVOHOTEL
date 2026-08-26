-- FASE 13 — Multi-hotel / Multi-tenant / SaaS
-- Incremental: consolida organizations + hoteis existentes e adiciona apenas
-- os conceitos SaaS que ainda não existem. Nenhuma entidade operacional legada
-- é removida nesta migration.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ORGANIZATION -> HOTEL
-- ============================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  legal_name text,
  document text,
  email text,
  phone text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','SUSPENDED','ARCHIVED','DEACTIVATED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations
  add column if not exists legal_name text,
  add column if not exists document text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists status text default 'ACTIVE',
  add column if not exists updated_at timestamptz default now();

alter table public.hoteis
  add column if not exists organization_id uuid,
  add column if not exists timezone text default 'America/Sao_Paulo',
  add column if not exists currency text default 'BRL',
  add column if not exists locale text default 'pt-BR',
  add column if not exists status text default 'ACTIVE',
  add column if not exists branding jsonb not null default '{}'::jsonb,
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz default now();

insert into public.organizations(name, slug, status)
values ('Organização padrão do HOTEL OS', 'default-hotel-os', 'ACTIVE')
on conflict (slug) do nothing;

update public.hoteis h
set organization_id = o.id
from public.organizations o
where h.organization_id is null
  and o.slug = 'default-hotel-os';

alter table public.hoteis
  alter column organization_id set not null;

alter table public.hoteis
  drop constraint if exists hoteis_organization_id_fkey;
alter table public.hoteis
  add constraint hoteis_organization_id_fkey
  foreign key (organization_id) references public.organizations(id)
  on delete restrict;

create index if not exists idx_hoteis_organization_status
  on public.hoteis(organization_id, status);

-- ============================================================
-- 2. MEMBERSHIP DE ORGANIZAÇÃO
-- ============================================================

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('PLATFORM_ADMIN','ORGANIZATION_ADMIN','VIEWER')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id,user_id)
);

alter table public.hotel_memberships
  add column if not exists organization_id uuid;

update public.hotel_memberships m
set organization_id = h.organization_id
from public.hoteis h
where m.organization_id is null
  and h.id::text = m.hotel_id;

create index if not exists idx_org_memberships_user_org
  on public.organization_memberships(user_id,organization_id) where active;
create index if not exists idx_hotel_memberships_org_user
  on public.hotel_memberships(organization_id,user_id) where active;

create or replace function public.user_has_organization_access(p_organization_id uuid)
returns boolean
language sql stable security definer set search_path=public
as $$
  select
    exists (
      select 1 from public.organization_memberships om
      where om.organization_id = p_organization_id
        and om.user_id = auth.uid()
        and om.active
    )
    or exists (
      select 1
      from public.hotel_memberships hm
      join public.hoteis h on h.id::text = hm.hotel_id
      where h.organization_id = p_organization_id
        and hm.user_id = auth.uid()
        and hm.active
    );
$$;

-- ============================================================
-- 3. CONTEXTO MULTI-HOTEL E RBAC
-- ============================================================

create or replace function public.user_has_hotel_access(p_hotel_id text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.hotel_memberships m
    where m.user_id = auth.uid()
      and m.hotel_id = p_hotel_id
      and m.active = true
  )
  or exists (
    select 1
    from public.organization_memberships om
    join public.hoteis h on h.organization_id = om.organization_id
    where h.id::text = p_hotel_id
      and om.user_id = auth.uid()
      and om.active = true
  );
$$;

create or replace function public.user_has_permission(p_hotel_id text, p_permission text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select
    exists (
      select 1
      from public.hotel_memberships m
      join public.hotel_roles r
        on (r.hotel_id = p_hotel_id or r.hotel_id is null)
       and r.slug = m.role
      join public.hotel_role_permissions rp on rp.role_id = r.id
      join public.hotel_permissions p on p.id = rp.permission_id
      where m.user_id = auth.uid()
        and m.hotel_id = p_hotel_id
        and m.active = true
        and p.key = p_permission
    )
    or exists (
      select 1
      from public.organization_memberships om
      join public.hoteis h on h.organization_id = om.organization_id
      join public.hotel_roles r on r.hotel_id is null and r.slug = om.role
      join public.hotel_role_permissions rp on rp.role_id = r.id
      join public.hotel_permissions p on p.id = rp.permission_id
      where h.id::text = p_hotel_id
        and om.user_id = auth.uid()
        and om.active = true
        and p.key = p_permission
    );
$$;

insert into public.hotel_permissions(key,description) values
('TENANT_VIEW','Visualizar contexto multi-hotel'),
('TENANT_SWITCH','Trocar hotel ativo'),
('ORGANIZATION_VIEW','Visualizar organização'),
('ORGANIZATION_MANAGE','Gerenciar organização'),
('HOTEL_VIEW','Visualizar hotel'),
('HOTEL_MANAGE','Gerenciar hotel'),
('HOTEL_SUSPEND','Suspender hotel'),
('REPORTS_CONSOLIDATED_VIEW','Visualizar relatórios consolidados'),
('FEATURE_FLAG_VIEW','Visualizar feature flags'),
('FEATURE_FLAG_MANAGE','Gerenciar feature flags'),
('SAAS_VIEW','Visualizar assinatura/plano'),
('SAAS_MANAGE','Gerenciar assinatura/plano'),
('USER_CROSS_HOTEL_VIEW','Visualizar usuários de hotéis autorizados')
on conflict (key) do nothing;

insert into public.hotel_roles(hotel_id,name,slug,description,system_role)
select null, x.name, x.slug, x.description, true
from (values
  ('Platform Admin','PLATFORM_ADMIN','Acesso global controlado da plataforma'),
  ('Organization Admin','ORGANIZATION_ADMIN','Administrador da organização'),
  ('Viewer','VIEWER','Visualização autorizada')
) as x(name,slug,description)
where not exists (select 1 from public.hotel_roles r where r.hotel_id is null and r.slug=x.slug);

insert into public.hotel_roles(hotel_id,name,slug,description,system_role)
select h.id::text, x.name, x.slug, x.description, true
from public.hoteis h
cross join (values
  ('Organization Admin','ORGANIZATION_ADMIN','Administrador da organização'),
  ('Hotel Admin','HOTEL_ADMIN','Administrador do hotel'),
  ('Manager','MANAGER','Gestor do hotel'),
  ('Operator','OPERATOR','Operador'),
  ('Viewer','VIEWER','Visualização operacional')
) as x(name,slug,description)
where not exists (
  select 1 from public.hotel_roles r
  where r.hotel_id=h.id::text and r.slug=x.slug
);

-- ============================================================
-- 4. FEATURE FLAGS POR ORGANIZAÇÃO / HOTEL / PLANO
-- ============================================================

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  description text,
  enabled boolean not null default false,
  organization_id uuid references public.organizations(id) on delete cascade,
  hotel_id uuid references public.hoteis(id) on delete cascade,
  plan_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (organization_id is not null or hotel_id is not null or plan_code is not null),
  unique(key,organization_id,hotel_id,plan_code)
);

create index if not exists idx_feature_flags_org_hotel on public.feature_flags(organization_id,hotel_id,key);

create or replace function public.hotel_os_feature_enabled(p_hotel_id uuid, p_key text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select coalesce((
    select ff.enabled
    from public.feature_flags ff
    where ff.key=p_key and ff.hotel_id=p_hotel_id
    order by ff.updated_at desc limit 1
  ),(
    select ff.enabled
    from public.feature_flags ff
    join public.hoteis h on h.organization_id=ff.organization_id
    where ff.key=p_key and h.id=p_hotel_id
    order by ff.updated_at desc limit 1
  ),false);
$$;

insert into public.feature_flags(key,description,enabled,hotel_id)
select x.key,x.description,false,h.id
from public.hoteis h
cross join (values
 ('PDV','PDV'),
 ('REALTIME','Atualizações em tempo real'),
 ('TABLET','Tablet de quarto'),
 ('FINANCE','Financeiro'),
 ('ADVANCED_REPORTS','Relatórios avançados')
) x(key,description)
where not exists (select 1 from public.feature_flags ff where ff.key=x.key and ff.hotel_id=h.id);

-- ============================================================
-- 4B. CONFIGURAÇÕES COM HERANÇA ORGANIZATION -> HOTEL
-- ============================================================

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(organization_id,key)
);

create index if not exists idx_org_settings_org_key
  on public.organization_settings(organization_id,key);

create or replace function public.hotel_os_resolved_setting(p_hotel_id uuid, p_key text)
returns jsonb
language sql stable security definer set search_path=public
as $$
  select coalesce(
    (select h.settings -> p_key from public.hoteis h where h.id=p_hotel_id and h.settings ? p_key),
    (select os.value from public.organization_settings os
      join public.hoteis h on h.organization_id=os.organization_id
      where h.id=p_hotel_id and os.key=p_key),
    '{}'::jsonb
  );
$$;

-- ============================================================
-- 5. SAAS: PLANS / SUBSCRIPTIONS / BILLING EVENTS
-- ============================================================

create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  active boolean not null default true,
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  plan_id uuid not null references public.saas_plans(id) on delete restrict,
  status text not null default 'ACTIVE' check (status in ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED','EXPIRED')),
  external_reference text,
  started_at timestamptz not null default now(),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.saas_subscriptions(id) on delete cascade,
  key text not null,
  quantity numeric(12,2) not null default 1 check (quantity >= 0),
  unit_amount numeric(12,2) not null default 0 check (unit_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(subscription_id,key)
);

create table if not exists public.saas_billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  subscription_id uuid references public.saas_subscriptions(id) on delete set null,
  event_type text not null,
  external_id text,
  amount numeric(12,2),
  currency text not null default 'BRL',
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(organization_id,event_type,external_id)
);

create index if not exists idx_saas_subscriptions_org_status on public.saas_subscriptions(organization_id,status);
create index if not exists idx_saas_billing_events_org_date on public.saas_billing_events(organization_id,occurred_at desc);

insert into public.saas_plans(code,name,limits,features)
values
('STARTER','Starter','{"hotels":1,"rooms":30,"users":10,"pdv":1,"reservations":1000,"storage_mb":1024}'::jsonb,'{"PDV":true,"REALTIME":true,"TABLET":false,"FINANCE":false,"ADVANCED_REPORTS":false}'::jsonb),
('PRO','Pro','{"hotels":3,"rooms":150,"users":50,"pdv":5,"reservations":10000,"storage_mb":10240}'::jsonb,'{"PDV":true,"REALTIME":true,"TABLET":true,"FINANCE":true,"ADVANCED_REPORTS":true}'::jsonb),
('ENTERPRISE','Enterprise','{"hotels":null,"rooms":null,"users":null,"pdv":null,"reservations":null,"storage_mb":null}'::jsonb,'{"PDV":true,"REALTIME":true,"TABLET":true,"FINANCE":true,"ADVANCED_REPORTS":true}'::jsonb)
on conflict (code) do update set name=excluded.name, limits=excluded.limits, features=excluded.features, active=true, updated_at=now();

insert into public.saas_subscriptions(organization_id,plan_id,status)
select o.id,p.id,'ACTIVE'
from public.organizations o
join public.saas_plans p on p.code='STARTER'
where not exists (select 1 from public.saas_subscriptions s where s.organization_id=o.id and s.status in ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED'));

-- ============================================================
-- 6. RLS DAS NOVAS ESTRUTURAS
-- ============================================================

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.saas_plans enable row level security;
alter table public.saas_subscriptions enable row level security;
alter table public.saas_subscription_items enable row level security;
alter table public.saas_billing_events enable row level security;

DROP POLICY IF EXISTS organizations_access ON public.organizations;
CREATE POLICY organizations_access ON public.organizations
FOR SELECT TO authenticated
USING (public.user_has_organization_access(id));

DROP POLICY IF EXISTS organization_memberships_access ON public.organization_memberships;
CREATE POLICY organization_memberships_access ON public.organization_memberships
FOR SELECT TO authenticated
USING (user_id=auth.uid() or public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS organization_settings_access ON public.organization_settings;
CREATE POLICY organization_settings_access ON public.organization_settings
FOR SELECT TO authenticated
USING (public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS feature_flags_access ON public.feature_flags;
CREATE POLICY feature_flags_access ON public.feature_flags
FOR SELECT TO authenticated
USING (
  (hotel_id is not null and public.user_has_hotel_access(hotel_id::text))
  or (organization_id is not null and public.user_has_organization_access(organization_id))
);

DROP POLICY IF EXISTS saas_plans_read ON public.saas_plans;
CREATE POLICY saas_plans_read ON public.saas_plans
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS saas_subscriptions_access ON public.saas_subscriptions;
CREATE POLICY saas_subscriptions_access ON public.saas_subscriptions
FOR SELECT TO authenticated
USING (public.user_has_organization_access(organization_id));

DROP POLICY IF EXISTS saas_subscription_items_access ON public.saas_subscription_items;
CREATE POLICY saas_subscription_items_access ON public.saas_subscription_items
FOR SELECT TO authenticated
USING (exists(select 1 from public.saas_subscriptions s where s.id=subscription_id and public.user_has_organization_access(s.organization_id)));

DROP POLICY IF EXISTS saas_billing_events_access ON public.saas_billing_events;
CREATE POLICY saas_billing_events_access ON public.saas_billing_events
FOR SELECT TO authenticated
USING (public.user_has_organization_access(organization_id));

ALTER TABLE public.hoteis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hoteis_tenant_access ON public.hoteis;
CREATE POLICY hoteis_tenant_access ON public.hoteis
FOR SELECT TO authenticated
USING (public.user_has_hotel_access(id::text));

-- ============================================================
-- 6B. CONTEXTO ORGANIZACIONAL DERIVADO PARA GOVERNANÇA
-- ============================================================

alter table public.hotel_devices add column if not exists organization_id uuid;
alter table public.hotel_sessions add column if not exists organization_id uuid;
alter table public.hotel_audit_log add column if not exists organization_id uuid;
alter table public.hotel_os_events add column if not exists organization_id uuid;
alter table public.hotel_os_tasks add column if not exists organization_id uuid;

update public.hotel_devices d set organization_id=h.organization_id
from public.hoteis h where d.organization_id is null and h.id::text=d.hotel_id;
update public.hotel_sessions s set organization_id=h.organization_id
from public.hoteis h where s.organization_id is null and h.id::text=s.hotel_id;
update public.hotel_audit_log a set organization_id=h.organization_id
from public.hoteis h where a.organization_id is null and a.hotel_id is not null and h.id::text=a.hotel_id;
update public.hotel_os_events e set organization_id=h.organization_id
from public.hoteis h where e.organization_id is null and e.hotel_id is not null and h.id=e.hotel_id;
update public.hotel_os_tasks t set organization_id=h.organization_id
from public.hoteis h where t.organization_id is null and t.hotel_id is not null and h.id=t.hotel_id;

create index if not exists idx_hotel_devices_org on public.hotel_devices(organization_id,hotel_id);
create index if not exists idx_hotel_sessions_org on public.hotel_sessions(organization_id,hotel_id);
create index if not exists idx_hotel_audit_org on public.hotel_audit_log(organization_id,hotel_id,created_at desc);
create index if not exists idx_hotel_os_events_org on public.hotel_os_events(organization_id,hotel_id,created_at desc);
create index if not exists idx_hotel_os_tasks_org on public.hotel_os_tasks(organization_id,hotel_id,status);

-- ============================================================
-- 7. INTEGRIDADE CROSS-TENANT
-- ============================================================

create or replace function public.hotel_os_validate_hotel_organization()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.organization_id is null then raise exception 'HOTEL_REQUIRES_ORGANIZATION'; end if;
  if not exists(select 1 from public.organizations o where o.id=new.organization_id) then raise exception 'ORGANIZATION_NOT_FOUND'; end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_hotel_organization on public.hoteis;
create trigger trg_hotel_os_validate_hotel_organization
before insert or update on public.hoteis
for each row execute function public.hotel_os_validate_hotel_organization();

create or replace function public.hotel_os_validate_membership_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.organization_id is not null and not exists(
    select 1 from public.hoteis h where h.id::text=new.hotel_id and h.organization_id=new.organization_id
  ) then raise exception 'MEMBERSHIP_CROSS_ORGANIZATION'; end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_membership_tenant on public.hotel_memberships;
create trigger trg_hotel_os_validate_membership_tenant
before insert or update on public.hotel_memberships
for each row execute function public.hotel_os_validate_membership_tenant();

-- ============================================================
-- 8. VIEWS / HELPERS DE CONTEXTO
-- ============================================================

create or replace view public.hotel_os_user_hotel_context as
select hm.user_id, hm.hotel_id::uuid as hotel_id, h.organization_id, hm.role, hm.active
from public.hotel_memberships hm
join public.hoteis h on h.id::text=hm.hotel_id
where hm.active;

create or replace function public.hotel_os_allowed_hotel_ids()
returns table(hotel_id uuid)
language sql stable security definer set search_path=public
as $$
  select h.id from public.hoteis h where public.user_has_hotel_access(h.id::text);
$$;

revoke all on function public.user_has_organization_access(uuid) from public;
grant execute on function public.user_has_organization_access(uuid) to authenticated;
revoke all on function public.user_has_hotel_access(text) from public;
grant execute on function public.user_has_hotel_access(text) to authenticated, anon;
revoke all on function public.user_has_permission(text,text) from public;
grant execute on function public.user_has_permission(text,text) to authenticated;
revoke all on function public.hotel_os_feature_enabled(uuid,text) from public;
grant execute on function public.hotel_os_feature_enabled(uuid,text) to authenticated;
revoke all on function public.hotel_os_resolved_setting(uuid,text) from public;
grant execute on function public.hotel_os_resolved_setting(uuid,text) to authenticated;
revoke all on function public.hotel_os_allowed_hotel_ids() from public;
grant execute on function public.hotel_os_allowed_hotel_ids() to authenticated;

-- ============================================================
-- 9. GOVERNANÇA
-- ============================================================

comment on table public.organizations is 'Tenant raiz do HOTEL OS; consolidada a partir da organização criada na Fase 2.';
comment on table public.hoteis is 'Hotel pertencente a uma Organization; dados operacionais continuam tenant-scoped por hotel_id.';
comment on table public.hotel_memberships is 'Membership operacional usuário -> hotel -> role; organization_id é contexto derivado.';
comment on table public.feature_flags is 'Flags por hotel/organização/plano. Não substituem autorização RBAC/RLS.';
comment on table public.saas_subscriptions is 'Assinatura técnica da organização; cobrança comercial permanece desacoplada.';
SQL