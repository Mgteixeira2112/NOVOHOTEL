-- Blindagem conservadora do ciclo operacional:
-- Recepção -> hospedagem -> checkout -> Governança -> liberação -> Recepção.

create or replace function public.reception_room_checkout(
  p_reservation_id text,
  p_actor_user_id text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_reservation public.reservas%rowtype;
  v_room public.quartos%rowtype;
begin
  select * into v_reservation
    from public.reservas
   where id::text = p_reservation_id::text
   for update;

  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  if v_reservation.status <> 'checkin_realizado' then
    raise exception 'Somente uma hospedagem ativa pode fazer check-out.';
  end if;

  if v_reservation.quarto_id is null then
    raise exception 'A hospedagem não possui quarto vinculado.';
  end if;

  select * into v_room
    from public.quartos
   where id::text = v_reservation.quarto_id::text
   for update;

  if not found then
    raise exception 'Quarto da hospedagem não encontrado.';
  end if;

  -- O checkout só pode ocorrer a partir de um quarto realmente entregue à Recepção
  -- e ocupado pela hospedagem ativa. Isso evita encerrar uma estadia em um quarto
  -- que esteja, por inconsistência, em limpeza/manutenção/liberação.
  if public.normalize_room_operational_status(coalesce(v_room.status_operacional, v_room.status)) <> 'ocupado'
     or coalesce(v_room.control_owner, 'recepcao') <> 'recepcao' then
    raise exception 'O quarto precisa estar ocupado e sob controle da recepção para realizar o check-out.';
  end if;

  if exists (
    select 1
      from public.reservas r
     where r.quarto_id::text = v_room.id::text
       and r.status = 'checkin_realizado'
       and r.id::text <> v_reservation.id::text
  ) then
    raise exception 'Existe outra hospedagem ativa vinculada ao mesmo quarto.';
  end if;

  update public.reservas
     set status = 'checkout_concluido',
         checkout_horario = now()::text
   where id::text = v_reservation.id::text;

  -- A Governança passa a ser a única dona operacional do quarto após checkout.
  -- Os triggers de projeção mantêm o card fixo em A Limpar e sincronizam o ciclo.
  update public.quartos
     set status = 'sujo',
         status_operacional = 'sujo',
         status_housekeeping = 'sujo',
         status_governanca = 'sujo',
         control_owner = 'governanca',
         active_activity = 'checkout_cleaning',
         updated_at = now()
   where id::text = v_room.id::text;

  update public.reservation_room_history
     set actor_user_id = p_actor_user_id
   where id = (
     select max(id)
       from public.reservation_room_history
      where reservation_id = v_reservation.id
        and event_type = 'checkout'
   );

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation.id,
    'room_id', v_room.id,
    'status', 'checkout_concluido',
    'next_owner', 'governanca',
    'next_room_status', 'sujo'
  );
end;
$$;

grant execute on function public.reception_room_checkout(text, text) to anon, authenticated;

-- Invariante adicional: uma reserva em check-in deve permanecer vinculada a um quarto.
-- Não altera registros históricos encerrados/cancelados.
do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'reservas_checkin_realizado_exige_quarto'
  ) then
    alter table public.reservas
      add constraint reservas_checkin_realizado_exige_quarto
      check (status <> 'checkin_realizado' or quarto_id is not null) not valid;

    alter table public.reservas
      validate constraint reservas_checkin_realizado_exige_quarto;
  end if;
end $$;
