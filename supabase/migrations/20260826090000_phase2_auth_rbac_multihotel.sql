-- FASE 2: identidade, membership, RBAC, dispositivos, sessões e auditoria.
-- Incremental: não remove nem altera dados legados.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_id text not null,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, hotel_id)
);

create table if not exists public.hotel_roles (
  id uuid primary key default gen_random_uuid(),
  hotel_id text,
  name text not null,
  slug text not null,
  description text,
  system_role boolean not null default false,
  created_at timestamptz not null default now(),
  unique(hotel_id, slug)
);

create table if not exists public.hotel_permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_role_permissions (
  role_id uuid not null references public.hotel_roles(id) on delete cascade,
  permission_id uuid not null references public.hotel_permissions(id) on delete cascade,
  primary key(role_id, permission_id)
);

create table if not exists public.hotel_devices (
  id uuid primary key default gen_random_uuid(),
  hotel_id text not null,
  room_id text,
  device_type text not null check (device_type in ('POS','TABLET_ROOM','KDS','TOTEM','MOBILE')),
  name text not null,
  device_token_hash text,
  active boolean not null default true,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hotel_id text,
  device_id uuid references public.hotel_devices(id) on delete set null,
  active boolean not null default true,
  last_seen_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  hotel_id text,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_memberships_user_hotel on public.hotel_memberships(user_id, hotel_id) where active;
create index if not exists idx_hotel_devices_hotel_room on public.hotel_devices(hotel_id, room_id) where active;
create index if not exists idx_hotel_sessions_user_active on public.hotel_sessions(user_id, active);
create index if not exists idx_hotel_audit_hotel_created on public.hotel_audit_log(hotel_id, created_at desc);

insert into public.hotel_permissions(key, description) values
('reservations.view','Visualizar reservas'),('reservations.create','Criar reservas'),('reservations.edit','Editar reservas'),('reservations.cancel','Cancelar reservas'),('reservations.checkin','Realizar check-in'),('reservations.checkout','Realizar check-out'),
('pos.view','Visualizar PDV'),('pos.create_order','Criar pedido'),('pos.edit_order','Editar pedido'),('pos.cancel_item','Cancelar item'),('pos.apply_discount','Aplicar desconto'),('pos.open_cash','Abrir caixa'),('pos.close_cash','Fechar caixa'),('pos.refund','Estornar pagamento'),
('housekeeping.view','Visualizar governança'),('housekeeping.assign','Distribuir tarefas'),('housekeeping.start','Iniciar tarefa'),('housekeeping.complete','Concluir tarefa'),
('maintenance.view','Visualizar manutenção'),('maintenance.create','Criar chamado'),('maintenance.assign','Atribuir chamado'),('maintenance.complete','Concluir chamado'),
('finance.view','Visualizar financeiro'),('finance.create_payment','Registrar pagamento'),('finance.refund','Estornar pagamento'),('finance.close_cash','Fechar caixa financeiro'),
('tablet.menu.view','Visualizar menu no tablet'),('tablet.order.create','Criar pedido pelo tablet'),('tablet.order.view','Visualizar pedido'),('tablet.service.request','Solicitar serviço pelo tablet')
on conflict (key) do nothing;

create or replace function public.user_has_hotel_access(p_hotel_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hotel_memberships m
    where m.user_id = auth.uid() and m.hotel_id = p_hotel_id and m.active = true
  );
$$;

create or replace function public.user_has_permission(p_hotel_id text, p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.hotel_memberships m
    join public.hotel_roles r on r.hotel_id = p_hotel_id and r.slug = m.role
    join public.hotel_role_permissions rp on rp.role_id = r.id
    join public.hotel_permissions p on p.id = rp.permission_id and p.key = p_permission
    where m.user_id = auth.uid() and m.hotel_id = p_hotel_id and m.active = true
  );
$$;

create or replace function public.hotel_os_audit(p_event_type text, p_hotel_id text, p_entity_type text default null, p_entity_id text default null, p_metadata jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.hotel_audit_log(user_id, hotel_id, event_type, entity_type, entity_id, metadata)
  values(auth.uid(), p_hotel_id, p_event_type, p_entity_type, p_entity_id, coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return v_id;
end; $$;

alter table public.hotel_memberships enable row level security;
alter table public.hotel_roles enable row level security;
alter table public.hotel_permissions enable row level security;
alter table public.hotel_role_permissions enable row level security;
alter table public.hotel_devices enable row level security;
alter table public.hotel_sessions enable row level security;
alter table public.hotel_audit_log enable row level security;

drop policy if exists hotel_memberships_self on public.hotel_memberships;
create policy hotel_memberships_self on public.hotel_memberships for select using (user_id = auth.uid());

drop policy if exists hotel_roles_access on public.hotel_roles;
create policy hotel_roles_access on public.hotel_roles for select using (hotel_id is null or public.user_has_hotel_access(hotel_id));

drop policy if exists hotel_permissions_authenticated on public.hotel_permissions;
create policy hotel_permissions_authenticated on public.hotel_permissions for select using (auth.uid() is not null);

drop policy if exists hotel_role_permissions_access on public.hotel_role_permissions;
create policy hotel_role_permissions_access on public.hotel_role_permissions for select using (exists (select 1 from public.hotel_roles r where r.id = role_id and (r.hotel_id is null or public.user_has_hotel_access(r.hotel_id))));

drop policy if exists hotel_devices_access on public.hotel_devices;
create policy hotel_devices_access on public.hotel_devices for all using (public.user_has_hotel_access(hotel_id)) with check (public.user_has_hotel_access(hotel_id));

drop policy if exists hotel_sessions_access on public.hotel_sessions;
create policy hotel_sessions_access on public.hotel_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists hotel_audit_self_or_hotel on public.hotel_audit_log;
create policy hotel_audit_self_or_hotel on public.hotel_audit_log for select using (user_id = auth.uid() or public.user_has_hotel_access(hotel_id));
