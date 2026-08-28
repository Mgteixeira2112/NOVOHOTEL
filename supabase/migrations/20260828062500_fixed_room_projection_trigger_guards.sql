-- Fixed projection synchronization is one-way for identity/status mirroring.
-- A system upsert must not be interpreted as a user moving the card.

create or replace function public.sync_governanca_card_to_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_responsavel text;
  v_completed_transition boolean;
begin
  if new.board_id <> 'kanban-board-governanca' or new.room_number is null or btrim(new.room_number) = '' then
    return new;
  end if;

  if coalesce((new.metadata->>'fixed_room_projection')::boolean, false) then
    if tg_op = 'INSERT' then return new; end if;
    if old.column_id is not distinct from new.column_id then return new; end if;
  end if;

  v_status := case new.column_id
    when 'gov-col-a-limpar' then 'sujo'
    when 'gov-col-em-limpeza' then 'em_limpeza'
    when 'gov-col-inspecao' then 'aguardando_vistoria'
    when 'gov-col-liberado' then 'aprovado'
    else null
  end;
  if v_status is null then return new; end if;

  v_responsavel := nullif(coalesce(new.assigned_to->>'nome', new.assigned_to->>'name'), '');
  if v_responsavel is null and new.assigned_user_id is not null then
    select u.nome into v_responsavel
      from public.usuarios u
     where u.id::text = new.assigned_user_id::text
     limit 1;
  end if;

  v_completed_transition := new.column_id = 'gov-col-liberado'
    and (tg_op = 'INSERT' or old.column_id is distinct from new.column_id);

  update public.quartos q
     set status_housekeeping = v_status,
         status_governanca = v_status,
         responsavel_limpeza = coalesce(v_responsavel, q.responsavel_limpeza),
         ultima_limpeza = case when v_completed_transition then coalesce(new.completed_at, now()) else q.ultima_limpeza end,
         updated_at = now()
   where q.numero::text = new.room_number::text;

  return new;
end;
$$;

create or replace function public.trg_refresh_room_operational_status_from_kanban()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fixed_new boolean := false;
  v_fixed_old boolean := false;
begin
  if tg_op <> 'DELETE' then
    v_fixed_new := coalesce((new.metadata->>'fixed_room_projection')::boolean, false);
  end if;
  if tg_op <> 'INSERT' then
    v_fixed_old := coalesce((old.metadata->>'fixed_room_projection')::boolean, false);
  end if;

  if tg_op = 'INSERT' and v_fixed_new then return new; end if;
  if tg_op = 'DELETE' and v_fixed_old then return old; end if;
  if tg_op = 'UPDATE' and v_fixed_new and v_fixed_old
     and old.board_id is not distinct from new.board_id
     and old.column_id is not distinct from new.column_id
     and old.room_number is not distinct from new.room_number then
    return new;
  end if;

  if tg_op <> 'INSERT' and old.room_number is not null
     and (old.board_id = 'kanban-board-manutencao' or old.board_id = 'kanban-board-governanca') then
    perform public.refresh_room_operational_status(old.room_number::text);
  end if;
  if tg_op <> 'DELETE' and new.room_number is not null
     and (new.board_id = 'kanban-board-manutencao' or new.board_id = 'kanban-board-governanca') then
    perform public.refresh_room_operational_status(new.room_number::text);
  end if;

  return coalesce(new, old);
end;
$$;

-- Backfill only after the feedback guards above are active.
do $$
declare
  v_room record;
begin
  for v_room in select id from public.quartos loop
    perform public.sync_fixed_room_projection_cards(v_room.id::text);
  end loop;
end;
$$;
