-- Fixed room projection cards
-- Each room owns exactly one deterministic projection card in Governança and one in Manutenção.
-- The cards mirror room identity from public.quartos and remain active for the room lifetime.
-- This lives outside the sealed Kanban engine: synchronization happens entirely in database triggers/functions.

create or replace function public.fixed_room_governance_column(p_room public.quartos)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_housekeeping text;
begin
  v_housekeeping := lower(coalesce(nullif(p_room.status_governanca, ''), nullif(p_room.status_housekeeping, ''), ''));

  if v_housekeeping in ('sujo', 'dirty', 'a_limpar') then
    return 'gov-col-a-limpar';
  end if;
  if v_housekeeping in ('limpeza', 'em_limpeza', 'cleaning') then
    return 'gov-col-em-limpeza';
  end if;
  if v_housekeeping in ('vistoria', 'aguardando_vistoria', 'inspecao', 'inspeção') then
    return 'gov-col-inspecao';
  end if;
  if v_housekeeping in ('aprovado', 'limpo', 'disponivel', 'disponível', 'liberado') then
    return 'gov-col-liberado';
  end if;

  case public.normalize_room_operational_status(coalesce(p_room.status_operacional, p_room.status))
    when 'sujo' then return 'gov-col-a-limpar';
    when 'limpeza' then return 'gov-col-em-limpeza';
    when 'vistoria' then return 'gov-col-inspecao';
    else return 'gov-col-liberado';
  end case;
end;
$$;

create or replace function public.fixed_room_maintenance_column(p_room public.quartos)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_existing text;
begin
  -- Outside maintenance the fixed projection always rests in Resolvido.
  if public.normalize_room_operational_status(coalesce(p_room.status_operacional, p_room.status)) <> 'manutencao' then
    return 'man-col-resolvido';
  end if;

  -- Preserve the fixed card's own in-progress workflow when the room remains in maintenance.
  select c.column_id
    into v_existing
    from public.kanban_cards c
   where c.id = 'room-man-' || p_room.id::text
     and c.board_id = 'kanban-board-manutencao'
     and c.column_id in ('man-col-chamados', 'man-col-reparo', 'man-col-pecas')
   limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- During migration/backfill, inherit the most advanced active maintenance demand if one exists.
  select c.column_id
    into v_existing
    from public.kanban_cards c
   where c.board_id = 'kanban-board-manutencao'
     and coalesce(c.is_archived, false) = false
     and c.id <> 'room-man-' || p_room.id::text
     and (c.room_id::text = p_room.id::text or c.room_number::text = p_room.numero::text)
     and c.column_id in ('man-col-chamados', 'man-col-reparo', 'man-col-pecas')
   order by case c.column_id
     when 'man-col-pecas' then 3
     when 'man-col-reparo' then 2
     else 1
   end desc, c.updated_at desc
   limit 1;

  return coalesce(v_existing, 'man-col-chamados');
end;
$$;

create or replace function public.sync_fixed_room_projection_cards(p_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.quartos%rowtype;
  v_gov_column text;
  v_man_column text;
  v_room_title text;
  v_base_metadata jsonb;
begin
  select * into v_room
    from public.quartos q
   where q.id::text = p_room_id::text
   limit 1;

  if not found then
    return;
  end if;

  v_gov_column := public.fixed_room_governance_column(v_room);
  v_man_column := public.fixed_room_maintenance_column(v_room);
  v_room_title := 'Quarto ' || v_room.numero::text;
  v_base_metadata := jsonb_build_object(
    'fixed_room_projection', true,
    'room_id', v_room.id::text,
    'room_name', v_room.nome,
    'room_number', v_room.numero::text,
    'room_floor', v_room.andar,
    'room_active', coalesce(v_room.ativo, true),
    'room_operational_status', public.normalize_room_operational_status(coalesce(v_room.status_operacional, v_room.status)),
    'task_context_type', 'room'
  );

  insert into public.kanban_cards (
    id, hotel_id, board_id, column_id, titulo, descricao, prioridade, ordem,
    departamento, room_number, location, metadata, room_id, target_sector,
    task_context_type, completed_at, is_archived, deleted_at, deleted_by_user_id,
    created_at, updated_at
  ) values (
    'room-gov-' || v_room.id::text,
    'default_hotel',
    'kanban-board-governanca',
    v_gov_column,
    v_room_title || ' · Governança',
    v_room.nome,
    'normal',
    0,
    'governanca',
    v_room.numero::text,
    case when v_room.andar is null then null else v_room.andar::text || 'º andar' end,
    v_base_metadata || jsonb_build_object(
      'relation_type', 'room_operational_source',
      'projection_sector', 'governanca',
      'target_sector', 'governanca'
    ),
    v_room.id::text,
    'governanca',
    'room',
    null,
    false,
    null,
    null,
    now(),
    now()
  )
  on conflict (id) do update set
    board_id = excluded.board_id,
    column_id = excluded.column_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    departamento = excluded.departamento,
    room_number = excluded.room_number,
    location = excluded.location,
    metadata = coalesce(public.kanban_cards.metadata, '{}'::jsonb) || excluded.metadata,
    room_id = excluded.room_id,
    target_sector = excluded.target_sector,
    task_context_type = 'room',
    completed_at = null,
    is_archived = false,
    deleted_at = null,
    deleted_by_user_id = null,
    updated_at = now();

  insert into public.kanban_cards (
    id, hotel_id, board_id, column_id, titulo, descricao, prioridade, ordem,
    departamento, room_number, location, metadata, room_id, target_sector,
    task_context_type, completed_at, is_archived, deleted_at, deleted_by_user_id,
    created_at, updated_at
  ) values (
    'room-man-' || v_room.id::text,
    'default_hotel',
    'kanban-board-manutencao',
    v_man_column,
    v_room_title || ' · Manutenção',
    v_room.nome,
    'normal',
    0,
    'manutencao',
    v_room.numero::text,
    case when v_room.andar is null then null else v_room.andar::text || 'º andar' end,
    v_base_metadata || jsonb_build_object(
      'relation_type', 'fixed_room_projection',
      'projection_sector', 'manutencao',
      'target_sector', 'manutencao'
    ),
    v_room.id::text,
    'manutencao',
    'room',
    null,
    false,
    null,
    null,
    now(),
    now()
  )
  on conflict (id) do update set
    board_id = excluded.board_id,
    column_id = excluded.column_id,
    titulo = excluded.titulo,
    descricao = excluded.descricao,
    departamento = excluded.departamento,
    room_number = excluded.room_number,
    location = excluded.location,
    metadata = coalesce(public.kanban_cards.metadata, '{}'::jsonb) || excluded.metadata,
    room_id = excluded.room_id,
    target_sector = excluded.target_sector,
    task_context_type = 'room',
    completed_at = null,
    is_archived = false,
    deleted_at = null,
    deleted_by_user_id = null,
    updated_at = now();
end;
$$;

create or replace function public.trg_sync_fixed_room_projection_cards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.kanban_cards
     where id in ('room-gov-' || old.id::text, 'room-man-' || old.id::text)
       and coalesce((metadata->>'fixed_room_projection')::boolean, false) = true;
    return old;
  end if;

  perform public.sync_fixed_room_projection_cards(new.id::text);
  return new;
end;
$$;

drop trigger if exists trg_sync_fixed_room_projection_cards on public.quartos;
create trigger trg_sync_fixed_room_projection_cards
after insert or update of numero, nome, andar, ativo, status, status_operacional, status_housekeeping, status_governanca
on public.quartos
for each row execute function public.trg_sync_fixed_room_projection_cards();

drop trigger if exists trg_delete_fixed_room_projection_cards on public.quartos;
create trigger trg_delete_fixed_room_projection_cards
after delete on public.quartos
for each row execute function public.trg_sync_fixed_room_projection_cards();

-- Fixed projection cards are infrastructure records. Moving them through a final column
-- must not make them eligible for the generic five-minute auto archive.
create or replace function public.keep_fixed_room_projection_card_active()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce((new.metadata->>'fixed_room_projection')::boolean, false) then
    new.is_archived := false;
    new.deleted_at := null;
    new.deleted_by_user_id := null;
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_keep_fixed_room_projection_card_active on public.kanban_cards;
create trigger trg_keep_fixed_room_projection_card_active
before insert or update on public.kanban_cards
for each row execute function public.keep_fixed_room_projection_card_active();

-- Backfill every current room. Existing deterministic Governança cards are upgraded in place.
do $$
declare
  v_room record;
begin
  for v_room in select id from public.quartos loop
    perform public.sync_fixed_room_projection_cards(v_room.id::text);
  end loop;
end;
$$;

create index if not exists idx_kanban_cards_fixed_room_projection
  on public.kanban_cards (room_id, board_id)
  where coalesce((metadata->>'fixed_room_projection')::boolean, false) = true;
