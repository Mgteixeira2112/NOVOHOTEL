-- Room Lifecycle Engine
-- Persists room authority/state transitions atomically outside the sealed Kanban engine.

alter table public.quartos
  add column if not exists control_owner text,
  add column if not exists active_activity text,
  add column if not exists lifecycle_version bigint not null default 0;

alter table public.quartos drop constraint if exists quartos_control_owner_check;
alter table public.quartos add constraint quartos_control_owner_check
  check (control_owner is null or control_owner in ('recepcao','governanca','manutencao','gestao'));

alter table public.quartos drop constraint if exists quartos_active_activity_check;
alter table public.quartos add constraint quartos_active_activity_check
  check (active_activity is null or active_activity in ('checkout_cleaning','daily_cleaning','recleaning','inspection','maintenance'));

update public.quartos
set control_owner = case
  when coalesce(status_operacional, status) = 'manutencao' then 'manutencao'
  when coalesce(status_operacional, status) = 'bloqueado' then 'gestao'
  when coalesce(status_operacional, status) in ('sujo','limpeza','vistoria') then 'governanca'
  else 'recepcao'
end
where control_owner is null;

alter table public.quartos alter column control_owner set default 'recepcao';
alter table public.quartos alter column control_owner set not null;

create table if not exists public.room_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.quartos(id) on delete cascade,
  command text not null,
  from_status text not null,
  to_status text not null,
  from_owner text not null,
  to_owner text not null,
  resulting_activity text,
  reservation_id text references public.reservas(id) on delete set null,
  actor_user_id text,
  reason text,
  lifecycle_version bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_room_lifecycle_events_room_created
  on public.room_lifecycle_events(room_id, created_at desc);
create index if not exists idx_room_lifecycle_events_reservation
  on public.room_lifecycle_events(reservation_id)
  where reservation_id is not null;

alter table public.room_lifecycle_events enable row level security;

drop policy if exists room_lifecycle_events_authenticated_read on public.room_lifecycle_events;
create policy room_lifecycle_events_authenticated_read
  on public.room_lifecycle_events for select
  to authenticated
  using (true);

create or replace function public.execute_room_lifecycle_transition(
  p_room_id text,
  p_command text,
  p_reservation_id text default null,
  p_actor_user_id text default null,
  p_reason text default null,
  p_expected_version bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.quartos%rowtype;
  v_status text;
  v_has_active_stay boolean;
  v_to_status text;
  v_to_owner text;
  v_activity text;
  v_card_id text;
  v_now timestamptz := now();
  v_new_version bigint;
begin
  select * into v_room
  from public.quartos
  where id = p_room_id
  for update;

  if not found then
    raise exception using message = 'Quarto não encontrado.', errcode = 'P0001';
  end if;

  if p_expected_version is not null and v_room.lifecycle_version <> p_expected_version then
    raise exception using message = 'O quarto foi alterado por outro usuário. Atualize a tela e tente novamente.', errcode = '40001';
  end if;

  v_status := coalesce(v_room.status_operacional, v_room.status, 'outros');

  select exists (
    select 1 from public.reservas r
    where r.quarto_id = p_room_id
      and r.status = 'checkin_realizado'
  ) into v_has_active_stay;

  if p_command in ('checkin','checkout','request_daily_cleaning') and p_reservation_id is null then
    raise exception using message = 'A operação exige uma reserva vinculada.', errcode = 'P0001';
  end if;

  if p_reservation_id is not null and not exists (
    select 1 from public.reservas r where r.id = p_reservation_id and r.quarto_id = p_room_id
  ) then
    raise exception using message = 'A reserva informada não pertence ao quarto.', errcode = 'P0001';
  end if;

  case p_command
    when 'checkin' then
      if v_status <> 'disponivel' or v_room.control_owner <> 'recepcao' then
        raise exception using message = 'Check-in só é permitido em quarto disponível sob controle da recepção.', errcode = 'P0001';
      end if;
      if not exists (select 1 from public.reservas where id = p_reservation_id and status in ('confirmada','pendente')) then
        raise exception using message = 'A reserva não está apta para check-in.', errcode = 'P0001';
      end if;
      update public.reservas
      set status = 'checkin_realizado', checkin_horario = coalesce(checkin_horario, to_char(v_now, 'HH24:MI'))
      where id = p_reservation_id;
      v_to_status := 'ocupado'; v_to_owner := 'recepcao'; v_activity := null;

    when 'checkout' then
      if v_status <> 'ocupado' or not v_has_active_stay then
        raise exception using message = 'Checkout exige quarto ocupado com hospedagem ativa.', errcode = 'P0001';
      end if;
      if not exists (select 1 from public.reservas where id = p_reservation_id and status = 'checkin_realizado') then
        raise exception using message = 'A reserva não possui check-in ativo.', errcode = 'P0001';
      end if;
      update public.reservas
      set status = 'checkout_concluido', checkout_horario = coalesce(checkout_horario, to_char(v_now, 'HH24:MI'))
      where id = p_reservation_id;
      v_to_status := 'sujo'; v_to_owner := 'governanca'; v_activity := 'checkout_cleaning';

    when 'send_to_governance_cleaning' then
      if v_status <> 'disponivel' or v_room.control_owner <> 'recepcao' then
        raise exception using message = 'A recepção só pode devolver à governança um quarto disponível sob seu controle.', errcode = 'P0001';
      end if;
      v_to_status := 'sujo'; v_to_owner := 'governanca'; v_activity := 'recleaning';

    when 'send_to_governance_inspection' then
      if v_status <> 'disponivel' or v_room.control_owner <> 'recepcao' then
        raise exception using message = 'Nova vistoria exige quarto disponível sob controle da recepção.', errcode = 'P0001';
      end if;
      v_to_status := 'vistoria'; v_to_owner := 'governanca'; v_activity := 'inspection';

    when 'start_cleaning' then
      if v_status <> 'sujo' or v_room.control_owner <> 'governanca' then
        raise exception using message = 'Somente a governança pode iniciar a limpeza de quarto sujo sob seu controle.', errcode = 'P0001';
      end if;
      v_to_status := 'limpeza'; v_to_owner := 'governanca'; v_activity := coalesce(v_room.active_activity, 'recleaning');

    when 'send_to_inspection' then
      if v_status <> 'limpeza' or v_room.control_owner <> 'governanca' then
        raise exception using message = 'Somente a governança pode enviar o quarto para vistoria após a limpeza.', errcode = 'P0001';
      end if;
      v_to_status := 'vistoria'; v_to_owner := 'governanca'; v_activity := 'inspection';

    when 'approve_inspection' then
      if v_status <> 'vistoria' or v_room.control_owner <> 'governanca' then
        raise exception using message = 'A liberação exige quarto em vistoria sob controle da governança.', errcode = 'P0001';
      end if;
      select exists (
        select 1 from public.reservas r where r.quarto_id = p_room_id and r.status = 'checkin_realizado'
      ) into v_has_active_stay;
      v_to_status := case when v_has_active_stay then 'ocupado' else 'disponivel' end;
      v_to_owner := 'recepcao'; v_activity := null;

    when 'reject_inspection' then
      if v_status <> 'vistoria' or v_room.control_owner <> 'governanca' then
        raise exception using message = 'Somente a governança pode reprovar uma vistoria sob seu controle.', errcode = 'P0001';
      end if;
      v_to_status := 'limpeza'; v_to_owner := 'governanca'; v_activity := 'recleaning';

    when 'request_daily_cleaning' then
      if v_status <> 'ocupado' or not v_has_active_stay then
        raise exception using message = 'Limpeza diária só pode ser aberta para quarto ocupado com hospedagem ativa.', errcode = 'P0001';
      end if;
      if not exists (select 1 from public.reservas where id = p_reservation_id and status = 'checkin_realizado') then
        raise exception using message = 'A reserva não é a hospedagem ativa do quarto.', errcode = 'P0001';
      end if;
      v_to_status := 'ocupado'; v_to_owner := 'governanca'; v_activity := 'daily_cleaning';

    when 'complete_daily_cleaning' then
      if v_status <> 'ocupado' or v_room.control_owner <> 'governanca' or v_room.active_activity <> 'daily_cleaning' or not v_has_active_stay then
        raise exception using message = 'Conclusão da limpeza diária exige quarto ocupado e atividade diária ativa.', errcode = 'P0001';
      end if;
      v_to_status := 'ocupado'; v_to_owner := 'recepcao'; v_activity := null;

    when 'send_to_maintenance' then
      if v_status = 'ocupado' or v_has_active_stay then
        raise exception using message = 'Quarto ocupado ou com hospedagem ativa não pode entrar em manutenção operacional.', errcode = 'P0001';
      end if;
      if v_status not in ('disponivel','sujo','vistoria') then
        raise exception using message = 'O estado atual do quarto não permite transferência para manutenção.', errcode = 'P0001';
      end if;
      v_to_status := 'manutencao'; v_to_owner := 'manutencao'; v_activity := 'maintenance';

    when 'complete_maintenance' then
      if v_status <> 'manutencao' or v_room.control_owner <> 'manutencao' then
        raise exception using message = 'Somente manutenção pode concluir um quarto sob seu controle.', errcode = 'P0001';
      end if;
      v_to_status := 'vistoria'; v_to_owner := 'governanca'; v_activity := 'inspection';

    when 'block_room' then
      if v_status = 'ocupado' or v_has_active_stay then
        raise exception using message = 'Quarto ocupado não pode ser bloqueado por esta transição operacional.', errcode = 'P0001';
      end if;
      v_to_status := 'bloqueado'; v_to_owner := 'gestao'; v_activity := null;

    when 'unblock_room' then
      if v_status <> 'bloqueado' or v_room.control_owner <> 'gestao' then
        raise exception using message = 'Desbloqueio exige quarto bloqueado sob controle da gestão.', errcode = 'P0001';
      end if;
      v_to_status := 'disponivel'; v_to_owner := 'recepcao'; v_activity := null;

    else
      raise exception using message = 'Comando de ciclo do quarto desconhecido.', errcode = 'P0001';
  end case;

  v_new_version := v_room.lifecycle_version + 1;

  update public.quartos
  set status = v_to_status,
      control_owner = v_to_owner,
      active_activity = v_activity,
      lifecycle_version = v_new_version,
      updated_at = v_now
  where id = p_room_id;

  if p_command in ('checkout','send_to_governance_cleaning','send_to_governance_inspection','request_daily_cleaning') then
    v_card_id := 'lifecycle-' || gen_random_uuid()::text;
    insert into public.kanban_cards (
      id, hotel_id, board_id, column_id, titulo, descricao, prioridade, ordem,
      departamento, room_number, metadata, reservation_id, room_id,
      target_sector, task_context_type, created_by_user_id, updated_by_user_id,
      created_at, updated_at
    ) values (
      v_card_id,
      'default_hotel',
      'kanban-board-governanca',
      case when p_command = 'send_to_governance_inspection' then 'gov-col-inspecao' else 'gov-col-a-limpar' end,
      case
        when p_command = 'checkout' then 'Limpeza pós-checkout · Quarto ' || v_room.numero
        when p_command = 'request_daily_cleaning' then 'Limpeza diária · Quarto ' || v_room.numero
        when p_command = 'send_to_governance_inspection' then 'Nova vistoria · Quarto ' || v_room.numero
        else 'Nova limpeza · Quarto ' || v_room.numero
      end,
      coalesce(p_reason, 'Demanda gerada pelo ciclo operacional do quarto.'),
      'normal',
      extract(epoch from v_now) * 1000,
      'governanca',
      v_room.numero,
      jsonb_build_object(
        'room_lifecycle', true,
        'room_lifecycle_command', p_command,
        'room_operational_status', v_to_status,
        'room_control_owner', v_to_owner,
        'room_active_activity', v_activity,
        'source', 'room_lifecycle_engine'
      ),
      p_reservation_id,
      p_room_id,
      'governanca',
      'room',
      p_actor_user_id,
      p_actor_user_id,
      v_now,
      v_now
    );
  elsif p_command = 'send_to_maintenance' then
    v_card_id := 'lifecycle-' || gen_random_uuid()::text;
    insert into public.kanban_cards (
      id, hotel_id, board_id, column_id, titulo, descricao, prioridade, ordem,
      departamento, room_number, metadata, room_id, target_sector,
      task_context_type, created_by_user_id, updated_by_user_id, created_at, updated_at
    ) values (
      v_card_id, 'default_hotel', 'kanban-board-manutencao', 'man-col-chamados',
      'Manutenção · Quarto ' || v_room.numero,
      coalesce(p_reason, 'Demanda gerada pelo ciclo operacional do quarto.'),
      'normal', extract(epoch from v_now) * 1000, 'manutencao', v_room.numero,
      jsonb_build_object(
        'room_lifecycle', true,
        'room_lifecycle_command', p_command,
        'room_operational_status', v_to_status,
        'room_control_owner', v_to_owner,
        'room_active_activity', v_activity,
        'source', 'room_lifecycle_engine'
      ),
      p_room_id, 'manutencao', 'room', p_actor_user_id, p_actor_user_id, v_now, v_now
    );
  end if;

  insert into public.room_lifecycle_events (
    room_id, command, from_status, to_status, from_owner, to_owner,
    resulting_activity, reservation_id, actor_user_id, reason, lifecycle_version
  ) values (
    p_room_id, p_command, v_status, v_to_status, v_room.control_owner, v_to_owner,
    v_activity, p_reservation_id, p_actor_user_id, p_reason, v_new_version
  );

  return jsonb_build_object(
    'ok', true,
    'room_id', p_room_id,
    'command', p_command,
    'from_status', v_status,
    'to_status', v_to_status,
    'from_owner', v_room.control_owner,
    'to_owner', v_to_owner,
    'active_activity', v_activity,
    'lifecycle_version', v_new_version,
    'created_card_id', v_card_id
  );
end;
$$;

revoke all on function public.execute_room_lifecycle_transition(text,text,text,text,text,bigint) from public;
grant execute on function public.execute_room_lifecycle_transition(text,text,text,text,text,bigint) to authenticated;
