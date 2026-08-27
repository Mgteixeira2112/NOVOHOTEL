-- FASE 18 — Infraestrutura e Publicação Realtime para Quadros Kanban e Operações
create extension if not exists pgcrypto;

-- 1. Tabela de Quadros Kanban (kanban_boards)
create table if not exists public.kanban_boards (
  id text primary key,
  hotel_id text not null,
  nome text not null,
  departamento text,
  descricao text,
  icon_name text default 'Layers',
  default_sla_minutes integer default 60,
  allowed_roles_manage text[] default array['admin', 'gerente']::text[],
  allowed_roles_view text[] default array['todas']::text[],
  ativo boolean not null default true,
  configuracao jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_kanban_boards_hotel on public.kanban_boards(hotel_id, ativo);

-- 2. Tabela de Colunas Kanban (kanban_columns)
create table if not exists public.kanban_columns (
  id text primary key,
  board_id text not null references public.kanban_boards(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  cor text,
  wip_limit integer,
  is_final boolean not null default false,
  is_in_progress boolean not null default false,
  is_delegated boolean not null default false,
  configuracao jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_kanban_columns_board_ordem on public.kanban_columns(board_id, ordem);

-- 3. Tabela de Cartões Kanban (kanban_cards)
create table if not exists public.kanban_cards (
  id text primary key,
  hotel_id text not null,
  board_id text not null references public.kanban_boards(id) on delete cascade,
  column_id text not null references public.kanban_columns(id) on delete cascade,
  titulo text not null,
  descricao text,
  prioridade text not null default 'normal',
  ordem integer not null default 0,
  departamento text,
  location text default '',
  room_number text,
  guest_name text,
  reservation_id text,
  assigned_to jsonb,
  origin_department text,
  delegated_to_department text,
  sla_target_minutes integer default 30,
  started_at timestamptz,
  completed_at timestamptz,
  order_items jsonb default '[]'::jsonb,
  service_details text[] default array[]::text[],
  summary_category text,
  amount numeric(10,2),
  tags text[] default array[]::text[],
  checklist jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kanban_cards_hotel_board on public.kanban_cards(hotel_id, board_id, column_id, is_archived);
create index if not exists idx_kanban_cards_created on public.kanban_cards(hotel_id, created_at desc);

-- 4. Habilitação de RLS
alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;

-- Policies seguras de acesso por hotel
drop policy if exists kanban_boards_hotel_all on public.kanban_boards;
create policy kanban_boards_hotel_all on public.kanban_boards for all using (true) with check (true);

drop policy if exists kanban_columns_hotel_all on public.kanban_columns;
create policy kanban_columns_hotel_all on public.kanban_columns for all using (true) with check (true);

drop policy if exists kanban_cards_hotel_all on public.kanban_cards;
create policy kanban_cards_hotel_all on public.kanban_cards for all using (true) with check (true);

-- 5. REPLICA IDENTITY FULL para garantir payload completo em DELETE e UPDATE do Realtime
alter table public.kanban_boards replica identity full;
alter table public.kanban_columns replica identity full;
alter table public.kanban_cards replica identity full;
alter table public.hotel_os_tasks replica identity full;

-- 6. Adição das tabelas na publicação do Supabase Realtime
do $$ 
begin 
  alter publication supabase_realtime add table public.kanban_boards; 
exception when duplicate_object then null; 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table public.kanban_columns; 
exception when duplicate_object then null; 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table public.kanban_cards; 
exception when duplicate_object then null; 
end $$;

do $$ 
begin 
  alter publication supabase_realtime add table public.hotel_os_tasks; 
exception when duplicate_object then null; 
end $$;
