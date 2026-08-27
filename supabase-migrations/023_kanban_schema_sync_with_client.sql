-- Align the persistent Kanban schema with the client contract used by the app.
-- The current application uses stable string identifiers (recepcao,
-- rec_atendimento, card_...), while the original persistence migration used UUIDs.
-- The current Kanban tables are empty, so identifiers can be converted safely.

alter table public.kanban_cards drop constraint if exists kanban_cards_board_id_fkey;
alter table public.kanban_cards drop constraint if exists kanban_cards_column_id_fkey;
alter table public.kanban_columns drop constraint if exists kanban_columns_board_id_fkey;

alter table public.kanban_boards alter column id drop default;
alter table public.kanban_boards alter column id type text using id::text;
alter table public.kanban_boards alter column id set default gen_random_uuid()::text;
alter table public.kanban_boards alter column hotel_id type text using hotel_id::text;
alter table public.kanban_boards alter column criado_por type text using criado_por::text;

alter table public.kanban_columns alter column id drop default;
alter table public.kanban_columns alter column id type text using id::text;
alter table public.kanban_columns alter column id set default gen_random_uuid()::text;
alter table public.kanban_columns alter column board_id type text using board_id::text;

alter table public.kanban_cards alter column id drop default;
alter table public.kanban_cards alter column id type text using id::text;
alter table public.kanban_cards alter column id set default gen_random_uuid()::text;
alter table public.kanban_cards alter column hotel_id type text using hotel_id::text;
alter table public.kanban_cards alter column board_id type text using board_id::text;
alter table public.kanban_cards alter column column_id type text using column_id::text;

alter table public.kanban_boards add column if not exists icon_name text;
alter table public.kanban_boards add column if not exists default_sla_minutes integer;
alter table public.kanban_boards add column if not exists allowed_roles_manage text[];
alter table public.kanban_boards add column if not exists allowed_roles_view text[];
alter table public.kanban_boards add column if not exists is_custom boolean;

alter table public.kanban_columns add column if not exists cor text;
alter table public.kanban_columns add column if not exists wip_limit integer;
alter table public.kanban_columns add column if not exists is_final boolean;
alter table public.kanban_columns add column if not exists is_in_progress boolean;
alter table public.kanban_columns add column if not exists is_delegated boolean;

alter table public.kanban_cards add column if not exists guest_name text;
alter table public.kanban_cards add column if not exists reservation_id text;
alter table public.kanban_cards add column if not exists origin_department text;
alter table public.kanban_cards add column if not exists delegated_to_department text;
alter table public.kanban_cards add column if not exists sla_target_minutes integer;
alter table public.kanban_cards add column if not exists started_at timestamptz;
alter table public.kanban_cards add column if not exists order_items jsonb;
alter table public.kanban_cards add column if not exists service_details jsonb;
alter table public.kanban_cards add column if not exists summary_category text;
alter table public.kanban_cards add column if not exists amount numeric;
alter table public.kanban_cards add column if not exists tags text[];
alter table public.kanban_cards add column if not exists is_archived boolean;

update public.kanban_boards
set ativo = coalesce(ativo, true),
    icon_name = coalesce(icon_name, 'Layers'),
    default_sla_minutes = coalesce(default_sla_minutes, 60),
    allowed_roles_manage = coalesce(allowed_roles_manage, array['admin','gerente']::text[]),
    allowed_roles_view = coalesce(allowed_roles_view, array['todas']::text[]),
    is_custom = coalesce(is_custom, false);

update public.kanban_columns
set is_final = coalesce(is_final, false),
    is_in_progress = coalesce(is_in_progress, false),
    is_delegated = coalesce(is_delegated, false);

update public.kanban_cards
set checklist = coalesce(checklist, '[]'::jsonb),
    comments = coalesce(comments, '[]'::jsonb),
    metadata = coalesce(metadata, '{}'::jsonb),
    is_archived = coalesce(is_archived, false),
    sla_target_minutes = coalesce(sla_target_minutes, 30),
    order_items = coalesce(order_items, '[]'::jsonb),
    service_details = coalesce(service_details, '[]'::jsonb),
    tags = coalesce(tags, array[]::text[]);

alter table public.kanban_boards alter column ativo set default true;
alter table public.kanban_boards alter column configuracao set default '{}'::jsonb;
alter table public.kanban_cards alter column checklist set default '[]'::jsonb;
alter table public.kanban_cards alter column comments set default '[]'::jsonb;
alter table public.kanban_cards alter column metadata set default '{}'::jsonb;
alter table public.kanban_cards alter column is_archived set default false;
alter table public.kanban_cards alter column sla_target_minutes set default 30;
alter table public.kanban_cards alter column order_items set default '[]'::jsonb;
alter table public.kanban_cards alter column service_details set default '[]'::jsonb;
alter table public.kanban_cards alter column tags set default array[]::text[];

alter table public.kanban_columns
  add constraint kanban_columns_board_id_fkey
  foreign key (board_id) references public.kanban_boards(id) on delete cascade;

alter table public.kanban_cards
  add constraint kanban_cards_board_id_fkey
  foreign key (board_id) references public.kanban_boards(id) on delete cascade;

alter table public.kanban_cards
  add constraint kanban_cards_column_id_fkey
  foreign key (column_id) references public.kanban_columns(id) on delete restrict;

create index if not exists idx_kanban_cards_hotel_updated
  on public.kanban_cards(hotel_id, updated_at desc);
