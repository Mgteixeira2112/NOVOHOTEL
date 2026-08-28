-- Mantém o card fixo da Governança e o estado operacional do quarto na mesma etapa.
-- Evita o ciclo em que o card é movido para inspeção, mas o quarto continua como limpeza
-- e o trigger inverso projeta o card de volta para gov-col-em-limpeza.

create or replace function public.sync_governanca_card_to_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status_housekeeping text;
  v_room_status text;
  v_responsavel text;
  v_completed_transition boolean;
  v_can_release boolean;
begin
  if new.board_id <> 'kanban-board-governanca' or new.room_number is null or btrim(new.room_number) = '' then
    return new;
  end if;

  if coalesce((new.metadata->>'fixed_room_projection')::boolean, false) then
    if tg_op = 'INSERT' then return new; end if;
    if old.column_id is not distinct from new.column_id then return new; end if;
  end if;

  v_status_housekeeping := case new.column_id
    when 'gov-col-a-limpar' then 'sujo'
    when 'gov-col-em-limpeza' then 'em_limpeza'
    when 'gov-col-inspecao' then 'aguardando_vistoria'
    when 'gov-col-liberado' then 'aprovado'
    else null
  end;

  v_room_status := case new.column_id
    when 'gov-col-a-limpar' then 'sujo'
    when 'gov-col-em-limpeza' then 'limpeza'
    when 'gov-col-inspecao' then 'vistoria'
    when 'gov-col-liberado' then 'disponivel'
    else null
  end;

  if v_status_housekeeping is null or v_room_status is null then return new; end if;

  v_responsavel := nullif(coalesce(new.assigned_to->>'nome', new.assigned_to->>'name'), '');
  if v_responsavel is null and new.assigned_user_id is not null then
    select u.nome into v_responsavel
      from public.usuarios u
     where u.id::text = new.assigned_user_id::text
     limit 1;
  end if;

  v_completed_transition := new.column_id = 'gov-col-liberado'
    and (tg_op = 'INSERT' or old.column_id is distinct from new.column_id);

  select not exists (
           select 1 from public.reservas r
            where r.quarto_id::text = q.id::text
              and r.status = 'checkin_realizado'
         )
         and not exists (
           select 1 from public.kanban_cards m
            where m.board_id = 'kanban-board-manutencao'
              and m.room_id::text = q.id::text
              and coalesce(m.is_archived, false) = false
              and m.column_id <> 'man-col-resolvido'
         )
    into v_can_release
    from public.quartos q
   where q.numero::text = new.room_number::text
   limit 1;

  update public.quartos q
     set status_housekeeping = v_status_housekeeping,
         status_governanca = v_status_housekeeping,
         responsavel_limpeza = coalesce(v_responsavel, q.responsavel_limpeza),
         ultima_limpeza = case when v_completed_transition then coalesce(new.completed_at, now()) else q.ultima_limpeza end,
         status = case
           when new.column_id = 'gov-col-liberado' and not coalesce(v_can_release, false) then q.status
           else v_room_status
         end,
         status_operacional = case
           when new.column_id = 'gov-col-liberado' and not coalesce(v_can_release, false) then q.status_operacional
           else v_room_status
         end,
         control_owner = case
           when new.column_id = 'gov-col-liberado' and coalesce(v_can_release, false) then 'recepcao'
           when new.column_id <> 'gov-col-liberado' then 'governanca'
           else q.control_owner
         end,
         active_activity = case
           when new.column_id = 'gov-col-liberado' and coalesce(v_can_release, false) then null
           when new.column_id = 'gov-col-inspecao' then 'inspection'
           when new.column_id = 'gov-col-em-limpeza' then coalesce(q.active_activity, 'cleaning')
           when new.column_id = 'gov-col-a-limpar' then coalesce(q.active_activity, 'checkout_cleaning')
           else q.active_activity
         end,
         updated_at = now()
   where q.numero::text = new.room_number::text;

  return new;
end;
$$;
