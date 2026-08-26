-- FASE 16: compatibilidade, dispositivos e PWA.
-- Incremental: adiciona metadados sem remover dados legados.

alter table if exists public.hotel_devices
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists app_version text,
  add column if not exists device_name text;

create index if not exists idx_hotel_devices_org_hotel on public.hotel_devices(organization_id, hotel_id);
create index if not exists idx_hotel_devices_version on public.hotel_devices(app_version);

-- Registro genérico de dispositivos, mantendo hotel_devices compatível com o legado.
create table if not exists public.hotel_os_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  hotel_id text not null,
  device_type text not null check (device_type in ('TABLET','POS','DESKTOP','MOBILE','KIOSK','KITCHEN','HOUSEKEEPING','MAINTENANCE','OTHER')),
  device_name text not null,
  room_id text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','BLOCKED','REVOKED','MAINTENANCE')),
  last_seen timestamptz,
  app_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_devices_hotel_status on public.hotel_os_devices(hotel_id, status);
create index if not exists idx_hotel_os_devices_room on public.hotel_os_devices(hotel_id, room_id) where room_id is not null;

alter table public.hotel_os_devices enable row level security;
drop policy if exists hotel_os_devices_access on public.hotel_os_devices;
create policy hotel_os_devices_access on public.hotel_os_devices
  for all using (public.user_has_hotel_access(hotel_id))
  with check (public.user_has_hotel_access(hotel_id));

-- Fila local futura: somente operações explicitamente compatíveis; não armazena pagamento,
-- cartão, token de autenticação ou outros dados financeiros sensíveis.
create table if not exists public.hotel_os_device_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  hotel_id text not null,
  device_id uuid references public.hotel_os_devices(id) on delete set null,
  operation_key text not null,
  entity_type text not null,
  entity_id text,
  local_version text,
  server_version text,
  resolution text not null default 'PENDING' check (resolution in ('PENDING','LOCAL_WINS','SERVER_WINS','MANUAL')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.hotel_os_device_sync_conflicts enable row level security;
drop policy if exists hotel_os_device_sync_conflicts_access on public.hotel_os_device_sync_conflicts;
create policy hotel_os_device_sync_conflicts_access on public.hotel_os_device_sync_conflicts
  for all using (public.user_has_hotel_access(hotel_id))
  with check (public.user_has_hotel_access(hotel_id));
