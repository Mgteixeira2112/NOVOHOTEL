-- Reserva independente do quarto.
-- O quarto passa a ser um vínculo operacional posterior, gerenciado pelo Widget Reservas.

create or replace function public.reception_create_unassigned_reservation(
  p_guest_id text,
  p_checkin date,
  p_checkout date,
  p_guests integer default 1,
  p_actor_user_id text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_guest public.hospedes%rowtype;
  v_reservation_id text;
  v_code text;
begin
  if p_guest_id is null or btrim(p_guest_id) = '' then raise exception 'Selecione um hóspede.'; end if;
  if p_checkin is null or p_checkout is null or p_checkout <= p_checkin then
    raise exception 'O check-out deve ser posterior ao check-in.';
  end if;
  if coalesce(p_guests, 0) < 1 then raise exception 'Informe ao menos um hóspede.'; end if;

  select * into v_guest from public.hospedes where id::text = p_guest_id::text;
  if not found then raise exception 'Hóspede não encontrado.'; end if;

  v_reservation_id := 'res-' || substr(md5(clock_timestamp()::text || random()::text || p_guest_id), 1, 24);
  v_code := 'RES-' || upper(substr(md5(v_reservation_id || clock_timestamp()::text), 1, 8));

  insert into public.reservas (
    id, codigo, hospede_id, quarto_id, checkin, checkout,
    quantidade_hospedes, adultos, criancas, valor_diarias, valor_total,
    status, observacoes
  ) values (
    v_reservation_id, v_code, v_guest.id, null, p_checkin, p_checkout,
    p_guests, p_guests, 0, 0, 0,
    'confirmada', case when p_actor_user_id is null then 'Reserva criada sem quarto definido.' else 'Reserva criada sem quarto definido · usuário ' || p_actor_user_id end
  );

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'reservation_code', v_code,
    'guest_id', v_guest.id,
    'room_id', null,
    'checkin', p_checkin,
    'checkout', p_checkout,
    'guests', p_guests
  );
end;
$$;

create or replace function public.reception_bind_reservation_room(
  p_reservation_id text,
  p_room_id text,
  p_actor_user_id text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_reservation public.reservas%rowtype;
  v_room public.quartos%rowtype;
  v_nights integer;
  v_rate numeric;
  v_total numeric;
begin
  if p_reservation_id is null or btrim(p_reservation_id) = '' then raise exception 'Reserva não informada.'; end if;
  if p_room_id is null or btrim(p_room_id) = '' then raise exception 'Selecione um quarto.'; end if;

  select * into v_reservation from public.reservas where id::text = p_reservation_id::text for update;
  if not found then raise exception 'Reserva não encontrada.'; end if;
  if v_reservation.status not in ('pendente','confirmada') then
    raise exception 'Somente reservas ainda não hospedadas podem ter o quarto vinculado por este menu.';
  end if;

  select * into v_room from public.quartos where id::text = p_room_id::text for update;
  if not found then raise exception 'Quarto não encontrado.'; end if;
  if coalesce(v_room.ativo, true) = false then raise exception 'O quarto está inativo.'; end if;
  if coalesce(v_room.capacidade, 1) < v_reservation.quantidade_hospedes then
    raise exception 'A capacidade do quarto é insuficiente para esta reserva.';
  end if;

  if exists (
    select 1
      from public.reservas r
     where r.id::text <> v_reservation.id::text
       and r.quarto_id::text = v_room.id::text
       and r.status in ('pendente','confirmada','checkin_realizado')
       and r.checkin < v_reservation.checkout
       and r.checkout > v_reservation.checkin
  ) then
    raise exception 'O quarto possui reserva conflitante no período selecionado.';
  end if;

  v_nights := greatest(1, v_reservation.checkout - v_reservation.checkin);
  v_rate := coalesce(v_room.valor_diaria, 0);
  v_total := (v_rate * v_nights) + coalesce(v_reservation.valor_taxas, 0) + coalesce(v_reservation.valor_consumo, 0);

  update public.reservas
     set quarto_id = v_room.id,
         valor_diarias = v_rate * v_nights,
         valor_total = v_total,
         observacoes = case
           when p_actor_user_id is null then coalesce(observacoes, '')
           else trim(both from concat_ws(' · ', nullif(observacoes, ''), 'Quarto vinculado pela Recepção · usuário ' || p_actor_user_id))
         end
   where id::text = v_reservation.id::text;

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation.id,
    'room_id', v_room.id,
    'total', v_total
  );
end;
$$;

create or replace function public.reception_unbind_reservation_room(
  p_reservation_id text,
  p_actor_user_id text default null
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_reservation public.reservas%rowtype;
begin
  if p_reservation_id is null or btrim(p_reservation_id) = '' then raise exception 'Reserva não informada.'; end if;

  select * into v_reservation from public.reservas where id::text = p_reservation_id::text for update;
  if not found then raise exception 'Reserva não encontrada.'; end if;
  if v_reservation.status not in ('pendente','confirmada') then
    raise exception 'Não é possível desvincular o quarto após o check-in.';
  end if;

  update public.reservas
     set quarto_id = null,
         valor_diarias = 0,
         valor_total = coalesce(valor_taxas, 0) + coalesce(valor_consumo, 0),
         observacoes = case
           when p_actor_user_id is null then coalesce(observacoes, '')
           else trim(both from concat_ws(' · ', nullif(observacoes, ''), 'Quarto desvinculado pela Recepção · usuário ' || p_actor_user_id))
         end
   where id::text = v_reservation.id::text;

  return jsonb_build_object('ok', true, 'reservation_id', v_reservation.id, 'room_id', null);
end;
$$;

grant execute on function public.reception_create_unassigned_reservation(text, date, date, integer, text) to anon, authenticated;
grant execute on function public.reception_bind_reservation_room(text, text, text) to anon, authenticated;
grant execute on function public.reception_unbind_reservation_room(text, text) to anon, authenticated;
