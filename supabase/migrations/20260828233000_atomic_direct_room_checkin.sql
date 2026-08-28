-- Check-in direto do Mapa de Quartos deve ser atômico.
-- Se qualquer validação falhar, nenhuma reserva intermediária permanece criada.

create or replace function public.reception_room_direct_checkin(
  p_guest_id text,
  p_room_id text,
  p_checkin date,
  p_checkout date,
  p_guests integer,
  p_actor_user_id text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_guest public.hospedes%rowtype;
  v_room public.quartos%rowtype;
  v_reservation_id text;
  v_code text;
  v_nights integer;
  v_rate numeric;
  v_total numeric;
begin
  if p_guest_id is null or btrim(p_guest_id) = '' then
    raise exception 'Selecione um hóspede.';
  end if;
  if p_room_id is null or btrim(p_room_id) = '' then
    raise exception 'Selecione um quarto.';
  end if;
  if p_checkin is null or p_checkout is null or p_checkout <= p_checkin then
    raise exception 'O check-out deve ser posterior ao check-in.';
  end if;
  if coalesce(p_guests, 0) < 1 then
    raise exception 'Informe ao menos um hóspede.';
  end if;

  select * into v_guest
    from public.hospedes
   where id::text = p_guest_id::text;
  if not found then
    raise exception 'Hóspede não encontrado.';
  end if;

  -- Serializa toda a operação pela linha do quarto.
  select * into v_room
    from public.quartos
   where id::text = p_room_id::text
   for update;
  if not found then
    raise exception 'Quarto não encontrado.';
  end if;

  if coalesce(v_room.ativo, true) = false then
    raise exception 'O quarto está inativo.';
  end if;

  if public.normalize_room_operational_status(coalesce(v_room.status_operacional, v_room.status)) <> 'disponivel'
     or coalesce(v_room.control_owner, 'recepcao') <> 'recepcao' then
    raise exception 'O quarto precisa estar disponível e sob controle da recepção antes do check-in.';
  end if;

  if coalesce(v_room.capacidade, 0) < p_guests then
    raise exception 'A capacidade do quarto é insuficiente para esta hospedagem.';
  end if;

  if exists (
    select 1
      from public.reservas r
     where r.quarto_id::text = v_room.id::text
       and r.status in ('pendente', 'confirmada', 'checkin_realizado')
       and daterange(r.checkin, r.checkout, '[)') && daterange(p_checkin, p_checkout, '[)')
  ) then
    raise exception 'O quarto possui reserva ou hospedagem conflitante no período selecionado.';
  end if;

  if exists (
    select 1
      from public.bloqueios b
     where b.quarto_id::text = v_room.id::text
       and daterange(b.data_inicio, b.data_fim, '[)') && daterange(p_checkin, p_checkout, '[)')
  ) then
    raise exception 'O quarto possui bloqueio operacional no período selecionado.';
  end if;

  v_reservation_id := 'res-' || substr(md5(clock_timestamp()::text || random()::text || p_guest_id || p_room_id), 1, 24);
  v_code := 'RES-' || upper(substr(md5(v_reservation_id || clock_timestamp()::text), 1, 8));
  v_nights := greatest(1, p_checkout - p_checkin);
  v_rate := coalesce(v_room.valor_diaria, 0);
  v_total := v_rate * v_nights;

  -- Reserva já nasce hospedada. Qualquer falha posterior desfaz também este insert.
  insert into public.reservas (
    id,
    codigo,
    hospede_id,
    quarto_id,
    checkin,
    checkout,
    quantidade_hospedes,
    adultos,
    criancas,
    cama_solicitada,
    valor_diarias,
    valor_total,
    status,
    checkin_horario,
    observacoes
  ) values (
    v_reservation_id,
    v_code,
    v_guest.id,
    v_room.id,
    p_checkin,
    p_checkout,
    p_guests,
    p_guests,
    0,
    null,
    v_rate * v_nights,
    v_total,
    'checkin_realizado',
    now()::text,
    case
      when p_actor_user_id is null then 'Check-in direto atômico pelo Mapa de Quartos.'
      else 'Check-in direto atômico pelo Mapa de Quartos · usuário ' || p_actor_user_id
    end
  );

  -- A proteção de ocupação existente continua valendo aqui. Se rejeitar, a reserva acima é revertida.
  update public.quartos
     set status = 'ocupado',
         status_operacional = 'ocupado',
         control_owner = 'recepcao',
         active_activity = null,
         updated_at = now()
   where id::text = v_room.id::text;

  update public.reservation_room_history
     set actor_user_id = p_actor_user_id
   where id = (
     select max(id)
       from public.reservation_room_history
      where reservation_id = v_reservation_id
        and event_type in ('reservation_assigned', 'checkin')
   );

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'reservation_code', v_code,
    'guest_id', v_guest.id,
    'room_id', v_room.id,
    'status', 'checkin_realizado',
    'checkin', p_checkin,
    'checkout', p_checkout,
    'guests', p_guests,
    'total', v_total
  );
end;
$$;

grant execute on function public.reception_room_direct_checkin(text, text, date, date, integer, text) to anon, authenticated;
