-- FASE 3 — Banco de Dados e Domain Core do HOTEL OS
-- Estratégia: consolidar o que já existe e criar apenas conceitos ausentes.
-- Nenhuma tabela legada é removida nesta fase.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. CATÁLOGOS DE DOMÍNIO
-- ============================================================

create table if not exists public.hotel_os_bed_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  capacity integer not null default 1 check (capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.hotel_os_bed_types(code,name,capacity) values
('king','King',2),
('queen','Queen',2),
('casal','Double/Casal',2),
('solteiro','Single',1),
('beliche','Beliche',2),
('sofa_cama','Sofá-cama',2),
('berco','Berço',1),
('outro','Outro',1)
on conflict (code) do update set name = excluded.name, capacity = excluded.capacity, active = true;

alter table public.quarto_camas add column if not exists tipo_cama_id uuid;

update public.quarto_camas qc
set tipo_cama_id = bt.id
from public.hotel_os_bed_types bt
where qc.tipo_cama_id is null and bt.code = qc.tipo;

create index if not exists idx_quarto_camas_tipo_cama on public.quarto_camas(tipo_cama_id);

-- ============================================================
-- 2. STAY — HOSPEDAGEM EFETIVAMENTE INICIADA
-- ============================================================

create table if not exists public.hotel_os_stays (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  reservation_id text not null references public.reservas(id) on delete restrict,
  room_id text not null references public.quartos(id) on delete restrict,
  status text not null default 'checked_in' check (status in ('checked_in','checked_out','cancelled')),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(reservation_id)
);

create table if not exists public.hotel_os_stay_guests (
  stay_id uuid not null references public.hotel_os_stays(id) on delete cascade,
  guest_id text not null references public.hospedes(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(stay_id, guest_id)
);

create unique index if not exists uq_hotel_os_primary_stay_guest
  on public.hotel_os_stay_guests(stay_id) where is_primary;

create index if not exists idx_hotel_os_stays_hotel_status
  on public.hotel_os_stays(hotel_id,status,room_id);
create index if not exists idx_hotel_os_stay_guests_guest on public.hotel_os_stay_guests(guest_id);

-- Migração conservadora: somente reservas que o modelo atual marca como
-- efetivamente iniciadas/finalizadas viram Stay. Reservas futuras permanecem
-- somente em reservas até que o fluxo de check-in seja executado.
insert into public.hotel_os_stays(hotel_id,reservation_id,room_id,status,checked_out_at)
select r.hotel_id,r.id,r.quarto_id,
       case when r.status = 'checkout_concluido' then 'checked_out' else 'checked_in' end,
       case when r.status = 'checkout_concluido' then r.checkout_horario::timestamptz else null end
from public.reservas r
where r.hotel_id is not null
  and r.quarto_id is not null
  and r.status in ('checkin_realizado','checkout_concluido')
on conflict (reservation_id) do nothing;

insert into public.hotel_os_stay_guests(stay_id,guest_id,is_primary)
select s.id,r.hospede_id,true
from public.hotel_os_stays s
join public.reservas r on r.id=s.reservation_id
where r.hospede_id is not null
on conflict (stay_id,guest_id) do update set is_primary=true;

-- ============================================================
-- 3. FOLIO — CONTA FINANCEIRA DA HOSPEDAGEM
-- ============================================================

create table if not exists public.hotel_os_folios (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  stay_id uuid not null references public.hotel_os_stays(id) on delete restrict,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  unique(stay_id)
);

create table if not exists public.hotel_os_folio_items (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  folio_id uuid not null references public.hotel_os_folios(id) on delete cascade,
  item_type text not null check (item_type in ('room','tax','order','minibar','adjustment','payment','refund','other')),
  description text not null,
  quantity numeric(12,3) not null default 1 check (quantity > 0),
  unit_amount numeric(12,2) not null check (unit_amount >= 0),
  reference_id uuid,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_folios_hotel_status on public.hotel_os_folios(hotel_id,status);
create index if not exists idx_hotel_os_folio_items_folio on public.hotel_os_folio_items(folio_id,created_at);

insert into public.hotel_os_folios(hotel_id,stay_id,status,closed_at)
select c.hotel_id,s.id,
       case when c.status='fechada' then 'closed' when c.status='cancelada' then 'cancelled' else 'open' end,
       c.fechado_em
from public.contas_quarto c
join public.hotel_os_stays s on s.reservation_id=c.reserva_id
where c.hotel_id is not null
on conflict (stay_id) do nothing;

insert into public.hotel_os_folio_items(hotel_id,folio_id,item_type,description,quantity,unit_amount,reference_id,created_by,created_at)
select l.hotel_id,f.id,
       case l.tipo when 'pdv' then 'order' when 'diaria' then 'room' when 'taxa' then 'tax' when 'pagamento' then 'payment' when 'estorno' then 'refund' else 'adjustment' end,
       l.descricao,1,l.valor,l.referencia_id,l.criado_por,l.criado_em
from public.contas_quarto_lancamentos l
join public.hotel_os_folios f on f.id=l.conta_id
where l.hotel_id is not null;

-- ============================================================
-- 4. ORDER — CONSOLIDAÇÃO DO PEDIDO EXISTENTE
-- ============================================================

alter table public.pdv_pedidos add column if not exists stay_id uuid references public.hotel_os_stays(id) on delete set null;
alter table public.pdv_pedidos add column if not exists device_id uuid references public.hotel_devices(id) on delete set null;
alter table public.pdv_pedidos add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.pdv_pedidos add column if not exists origin_os text;

update public.pdv_pedidos p
set stay_id=s.id
from public.hotel_os_stays s
where p.stay_id is null and p.reserva_id=s.reservation_id;

update public.pdv_pedidos
set origin_os = case lower(origem)
  when 'pdv' then 'POS'
  when 'tablet_quarto' then 'ROOM_TABLET'
  when 'quarto' then 'ROOM_SERVICE'
  when 'balcao' then 'POS'
  when 'recepcao' then 'RESTAURANT'
  when 'cozinha' then 'RESTAURANT'
  else 'POS'
end
where origin_os is null;

alter table public.pdv_pedidos drop constraint if exists pdv_pedidos_origin_os_check;
alter table public.pdv_pedidos add constraint pdv_pedidos_origin_os_check
  check (origin_os is null or origin_os in ('POS','ROOM_TABLET','RESTAURANT','BAR','ROOM_SERVICE','KIOSK'));

create index if not exists idx_pdv_pedidos_stay on public.pdv_pedidos(stay_id);
create index if not exists idx_pdv_pedidos_device on public.pdv_pedidos(device_id);
create index if not exists idx_pdv_pedidos_user on public.pdv_pedidos(user_id);

create or replace view public.hotel_os_orders as
select p.id,
       p.hotel_id,
       p.stay_id,
       p.quarto_id as room_id,
       p.device_id,
       coalesce(p.user_id,p.criado_por::uuid) as user_id,
       p.origin_os as origin,
       p.status,
       p.total,
       p.observacoes as notes,
       p.criado_em as created_at,
       p.atualizado_em as updated_at
from public.pdv_pedidos p;

-- ============================================================
-- 5. PRODUCT CATEGORY — CATEGORIA SEM DUPLICAR PRODUTO
-- ============================================================

create table if not exists public.hotel_os_product_categories (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(hotel_id,name)
);

alter table public.pdv_produtos add column if not exists category_id uuid references public.hotel_os_product_categories(id) on delete set null;

insert into public.hotel_os_product_categories(hotel_id,name)
select distinct hotel_id, categoria
from public.pdv_produtos
where hotel_id is not null and nullif(trim(categoria),'') is not null
on conflict (hotel_id,name) do nothing;

update public.pdv_produtos p
set category_id=c.id
from public.hotel_os_product_categories c
where p.category_id is null and c.hotel_id=p.hotel_id and c.name=p.categoria;

create index if not exists idx_hotel_os_product_categories_hotel on public.hotel_os_product_categories(hotel_id,active);

-- ============================================================
-- 6. INVENTORY — LEDGER CENTRAL
-- ============================================================

create table if not exists public.hotel_os_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  product_id uuid not null references public.pdv_produtos(id) on delete restrict,
  movement_type text not null check (movement_type in ('PURCHASE','SALE','CONSUMPTION','ADJUSTMENT','TRANSFER','LOSS','RETURN')),
  quantity numeric(12,3) not null check (quantity > 0),
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_inventory_product_time
  on public.hotel_os_inventory_movements(hotel_id,product_id,created_at desc);
create index if not exists idx_hotel_os_inventory_reference
  on public.hotel_os_inventory_movements(reference_type,reference_id);

insert into public.hotel_os_inventory_movements(hotel_id,product_id,movement_type,quantity,reference_id,notes,created_by,created_at)
select m.hotel_id,m.produto_id,
       case m.tipo when 'entrada' then 'PURCHASE' when 'saida' then 'SALE' when 'estorno' then 'RETURN' else 'ADJUSTMENT' end,
       m.quantidade,m.referencia_id,m.observacao,m.criado_por,m.criado_em
from public.pdv_estoque_movimentos m
where m.hotel_id is not null
  and not exists (
    select 1 from public.hotel_os_inventory_movements x
    where x.hotel_id=m.hotel_id and x.product_id=m.produto_id and x.reference_id=m.referencia_id and x.quantity=m.quantidade and x.created_at=m.criado_em
  );

-- ============================================================
-- 7. CASH REGISTER / SESSION
-- ============================================================

create table if not exists public.hotel_os_cash_registers (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  name text not null,
  location text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(hotel_id,name)
);

create table if not exists public.hotel_os_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  cash_register_id uuid not null references public.hotel_os_cash_registers(id) on delete restrict,
  opened_by uuid references auth.users(id),
  closed_by uuid references auth.users(id),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  closing_amount numeric(12,2),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique(cash_register_id,status) deferrable initially immediate
);

create index if not exists idx_hotel_os_cash_sessions_hotel_status on public.hotel_os_cash_sessions(hotel_id,status,opened_at desc);

-- ============================================================
-- 8. CENTRAL TRANSACTIONS
-- ============================================================

create table if not exists public.hotel_os_transactions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hoteis(id) on delete cascade,
  folio_id uuid references public.hotel_os_folios(id) on delete set null,
  order_id uuid references public.pdv_pedidos(id) on delete set null,
  cash_session_id uuid references public.hotel_os_cash_sessions(id) on delete set null,
  payment_id text references public.pagamentos(id) on delete set null,
  transaction_type text not null check (transaction_type in ('payment','refund','charge','adjustment')),
  amount numeric(12,2) not null check (amount > 0),
  method text,
  status text not null default 'approved' check (status in ('pending','approved','failed','refunded','cancelled')),
  external_reference text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_os_transactions_hotel_time on public.hotel_os_transactions(hotel_id,created_at desc);
create index if not exists idx_hotel_os_transactions_folio on public.hotel_os_transactions(folio_id,created_at desc);
create index if not exists idx_hotel_os_transactions_order on public.hotel_os_transactions(order_id,created_at desc);
create index if not exists idx_hotel_os_transactions_cash on public.hotel_os_transactions(cash_session_id,created_at desc);

insert into public.hotel_os_transactions(hotel_id,folio_id,payment_id,transaction_type,amount,method,status,external_reference,created_at)
select p.hotel_id,f.id,p.id,
       case when p.status='estornado' then 'refund' else 'payment' end,
       p.valor,p.metodo,
       case when p.status='aprovado' then 'approved' when p.status='estornado' then 'refunded' when p.status='pendente' then 'pending' else 'failed' end,
       p.codigo_transacao,p.data_pagamento
from public.pagamentos p
left join public.hotel_os_stays s on s.reservation_id=p.reserva_id
left join public.hotel_os_folios f on f.stay_id=s.id
where p.hotel_id is not null
  and not exists (select 1 from public.hotel_os_transactions t where t.payment_id=p.id);

-- ============================================================
-- 9. OPERATIONAL TASK — CONSOLIDAÇÃO
-- ============================================================

alter table public.hotel_os_tasks add column if not exists task_type text;
alter table public.hotel_os_tasks add column if not exists source_type text;

alter table public.hotel_os_tasks drop constraint if exists hotel_os_tasks_task_type_check;
alter table public.hotel_os_tasks add constraint hotel_os_tasks_task_type_check
  check (task_type is null or task_type in ('HOUSEKEEPING','MAINTENANCE','ROOM_SERVICE','LAUNDRY','INSPECTION'));

create index if not exists idx_hotel_os_tasks_type on public.hotel_os_tasks(hotel_id,task_type,status,priority);

insert into public.hotel_os_tasks(hotel_id,title,description,department,status,priority,assigned_to,due_at,created_by,created_at,updated_at,task_type,source_type,metadata)
select g.hotel_id,
       'Governança: ' || coalesce(g.tipo,'tarefa de quarto'),
       g.observacoes,
       'governanca',
       case g.status when 'aguardando' then 'pendente' when 'em_limpeza' then 'em_execucao' when 'aguardando_inspecao' then 'aguardando' when 'aprovado' then 'concluida' when 'reprovado' then 'aguardando' else 'cancelada' end,
       case when g.prioridade >= 80 then 'critica' when g.prioridade >= 50 then 'alta' else 'normal' end,
       g.atribuido_a,g.criado_em,g.criado_por,g.criado_em,g.atualizado_em,
       case when g.tipo='inspecao' then 'INSPECTION' when g.tipo='manutencao' then 'MAINTENANCE' else 'HOUSEKEEPING' end,
       'legacy.governanca_tarefas_quarto',
       jsonb_build_object('legacy_task_id',g.id,'room_id',g.quarto_id,'reservation_id',g.reserva_id)
from public.governanca_tarefas_quarto g
where g.hotel_id is not null
  and not exists (
    select 1 from public.hotel_os_tasks t
    where t.metadata->>'legacy_task_id'=g.id::text
  );

-- ============================================================
-- 10. AUDITORIA E EVENTOS
-- ============================================================

alter table public.hotel_audit_log add column if not exists action text;
alter table public.hotel_audit_log add column if not exists old_data jsonb;
alter table public.hotel_audit_log add column if not exists new_data jsonb;
alter table public.hotel_audit_log add column if not exists actor_id uuid;

update public.hotel_audit_log
set actor_id = user_id
where actor_id is null;

create index if not exists idx_hotel_audit_entity on public.hotel_audit_log(hotel_id,entity_type,entity_id,created_at desc);

-- hotel_os_events já é o DomainEvent físico do sistema. Acrescentamos uma
-- versão para permitir evolução do contrato sem duplicar tabela de eventos.
alter table public.hotel_os_events add column if not exists event_version integer not null default 1;
alter table public.hotel_os_events add column if not exists occurred_at timestamptz;
update public.hotel_os_events set occurred_at=created_at where occurred_at is null;
create index if not exists idx_hotel_os_events_aggregate_created on public.hotel_os_events(hotel_id,entity_type,entity_id,created_at desc);

-- ============================================================
-- 11. RLS DAS NOVAS ENTIDADES
-- ============================================================

alter table public.hotel_os_bed_types enable row level security;
alter table public.hotel_os_stays enable row level security;
alter table public.hotel_os_stay_guests enable row level security;
alter table public.hotel_os_folios enable row level security;
alter table public.hotel_os_folio_items enable row level security;
alter table public.hotel_os_product_categories enable row level security;
alter table public.hotel_os_inventory_movements enable row level security;
alter table public.hotel_os_cash_registers enable row level security;
alter table public.hotel_os_cash_sessions enable row level security;
alter table public.hotel_os_transactions enable row level security;

drop policy if exists hotel_os_stays_hotel_access on public.hotel_os_stays;
create policy hotel_os_stays_hotel_access on public.hotel_os_stays for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_stay_guests_hotel_access on public.hotel_os_stay_guests;
create policy hotel_os_stay_guests_hotel_access on public.hotel_os_stay_guests for all to authenticated using (exists(select 1 from public.hotel_os_stays s where s.id=stay_id and public.usuario_pode_hotel(s.hotel_id))) with check (exists(select 1 from public.hotel_os_stays s where s.id=stay_id and public.usuario_pode_hotel(s.hotel_id)));

drop policy if exists hotel_os_folios_hotel_access on public.hotel_os_folios;
create policy hotel_os_folios_hotel_access on public.hotel_os_folios for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_folio_items_hotel_access on public.hotel_os_folio_items;
create policy hotel_os_folio_items_hotel_access on public.hotel_os_folio_items for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_product_categories_hotel_access on public.hotel_os_product_categories;
create policy hotel_os_product_categories_hotel_access on public.hotel_os_product_categories for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_inventory_hotel_access on public.hotel_os_inventory_movements;
create policy hotel_os_inventory_hotel_access on public.hotel_os_inventory_movements for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_cash_registers_hotel_access on public.hotel_os_cash_registers;
create policy hotel_os_cash_registers_hotel_access on public.hotel_os_cash_registers for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_cash_sessions_hotel_access on public.hotel_os_cash_sessions;
create policy hotel_os_cash_sessions_hotel_access on public.hotel_os_cash_sessions for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

drop policy if exists hotel_os_transactions_hotel_access on public.hotel_os_transactions;
create policy hotel_os_transactions_hotel_access on public.hotel_os_transactions for all to authenticated using (public.usuario_pode_hotel(hotel_id)) with check (public.usuario_pode_hotel(hotel_id));

create policy hotel_os_bed_types_authenticated on public.hotel_os_bed_types for select to authenticated using (true);

-- ============================================================
-- 12. INTEGRIDADE CROSS-HOTEL
-- ============================================================

create or replace function public.hotel_os_validate_order_tenant()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.hotel_id is null then raise exception 'Pedido exige hotel_id'; end if;
  if new.stay_id is not null and not exists(select 1 from public.hotel_os_stays s where s.id=new.stay_id and s.hotel_id=new.hotel_id) then raise exception 'Stay não pertence ao hotel do pedido'; end if;
  if new.device_id is not null and not exists(select 1 from public.hotel_devices d where d.id=new.device_id and d.hotel_id=new.hotel_id) then raise exception 'Dispositivo não pertence ao hotel do pedido'; end if;
  if new.reserva_id is not null and not exists(select 1 from public.reservas r where r.id=new.reserva_id and r.hotel_id=new.hotel_id) then raise exception 'Reserva não pertence ao hotel do pedido'; end if;
  if new.quarto_id is not null and not exists(select 1 from public.quartos q where q.id=new.quarto_id and q.hotel_id=new.hotel_id) then raise exception 'Quarto não pertence ao hotel do pedido'; end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_os_validate_order_tenant on public.pdv_pedidos;
create trigger trg_hotel_os_validate_order_tenant before insert or update on public.pdv_pedidos for each row execute function public.hotel_os_validate_order_tenant();

-- ============================================================
-- 13. RELATÓRIO DE MIGRAÇÃO / INTEGRIDADE
-- ============================================================

create or replace function public.hotel_os_phase3_integrity_report()
returns table(metric text, value bigint)
language sql stable security invoker as $$
  select 'hotels'::text, count(*)::bigint from public.hoteis
  union all select 'rooms', count(*) from public.quartos
  union all select 'room_beds', count(*) from public.quarto_camas
  union all select 'guests', count(*) from public.hospedes
  union all select 'reservations', count(*) from public.reservas
  union all select 'stays', count(*) from public.hotel_os_stays
  union all select 'folios', count(*) from public.hotel_os_folios
  union all select 'orders', count(*) from public.pdv_pedidos
  union all select 'inventory_movements', count(*) from public.hotel_os_inventory_movements
  union all select 'tasks', count(*) from public.hotel_os_tasks
  union all select 'cash_sessions', count(*) from public.hotel_os_cash_sessions
  union all select 'transactions', count(*) from public.hotel_os_transactions
  union all select 'domain_events', count(*) from public.hotel_os_events;
$$;

comment on table public.hotel_os_stays is 'Domain Stay: hospedagem efetivamente iniciada, separada da Reservation.';
comment on table public.hotel_os_folios is 'Domain Folio: conta financeira vinculada a uma Stay.';
comment on view public.hotel_os_orders is 'Compatibility/domain view over the existing PDV order table; no second order store is created.';
comment on table public.hotel_os_inventory_movements is 'Canonical inventory ledger; legacy PDV movements remain until all consumers migrate.';
comment on function public.hotel_os_phase3_integrity_report is 'Contagens para validação da migração incremental da Fase 3.';
