-- Hotel OS: additive persistence for operational Kanban boards/cards.
-- Existing localStorage Kanban remains the client fallback until migration is wired.

create table if not exists public.kanban_boards (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  nome text not null,
  departamento text not null,
  descricao text,
  ativo boolean not null default true,
  configuracao jsonb not null default '{}'::jsonb,
  criado_por uuid,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.kanban_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.kanban_boards(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  configuracao jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.kanban_cards (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  board_id uuid not null references public.kanban_boards(id) on delete cascade,
  column_id uuid not null references public.kanban_columns(id) on delete restrict,
  titulo text not null,
  descricao text,
  prioridade text not null default 'normal',
  ordem numeric not null default 0,
  departamento text,
  room_number text,
  location text,
  assigned_to jsonb,
  checklist jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kanban_boards_hotel on public.kanban_boards(hotel_id);
create index if not exists idx_kanban_boards_department on public.kanban_boards(departamento);
create index if not exists idx_kanban_columns_board_order on public.kanban_columns(board_id, ordem);
create index if not exists idx_kanban_cards_hotel_board on public.kanban_cards(hotel_id, board_id);
create index if not exists idx_kanban_cards_column_order on public.kanban_cards(column_id, ordem);
create index if not exists idx_kanban_cards_department on public.kanban_cards(departamento);

alter table public.kanban_boards enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;

-- No broad anonymous policy is created. Tenant membership/RBAC policies are
-- installed after the canonical user/hotel membership contract is finalized.

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
