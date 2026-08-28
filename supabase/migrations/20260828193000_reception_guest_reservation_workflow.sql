-- Operational reception workflow: existing guest -> reservation -> room.
-- Reuses public.hospedes, public.reservas and the existing reception stay RPCs.

create or replace function public.reception_create_reservation_for_guest(
  p_guest_id text,
  p_room_id text,
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
  v_room public.quartos%rowtype;
  v_reservation_id text;
  v_code text;
  v_nights integer;
  v_rate numeric;
  v_total numeric;
begin
  if p_guest_id is null or btrim(p_guest_id) = '' then raise exception 'Selecione um hóspede.'; end if;
  if p_room_id is null or btrim(p_room_id) = '' then raise exception 'Selecione um quarto.'; end if;
  if p_checkin is null or p_checkout is null or p_checkout <= p_checkin then
    raise exception 'O check-out deve ser posterior ao check-in.';
  end if;
  if coalesce(p_guests, 0) < 1 then raise exception 'Informe ao menos um hóspede.'; end if;

  select * into v_guest from public.hospedes where id::text = p_guest_id::text;
  if not found then raise exception 'Hóspede não encontrado.'; end if;

  select * into v_room from public.quartos where id::text = p_room_id::text;
  if not found then raise exception 'Quarto não encontrado.'; end if;
  if coalesce(v_room.ativo, true) = false then raise exception 'O quarto está inativo.'; end if;
  if coalesce(v_room.capacidade, 1) < p_guests then raise exception 'A capacidade do quarto é insuficiente.'; end if;

  if exists (
    select 1
      from public.reservas r
     where r.quarto_id::text = p_room_id::text
       and r.status in ('pendente','confirmada','checkin_realizado')
       and r.checkin < p_checkout
       and r.checkout > p_checkin
  ) then
    raise exception 'O quarto possui reserva conflitante no período selecionado.';
  end if;

  v_reservation_id := 'res-' || substr(md5(clock_timestamp()::text || random()::text || p_guest_id || p_room_id), 1, 24);
  v_code := 'RES-' || upper(substr(md5(v_reservation_id || clock_timestamp()::text), 1, 8));
  v_nights := greatest(1, p_checkout - p_checkin);
  v_rate := coalesce(v_room.valor_diaria, 0);
  v_total := v_rate * v_nights;

  insert into public.reservas (
    id, codigo, hospede_id, quarto_id, checkin, checkout,
    quantidade_hospedes, adultos, criancas, valor_diarias, valor_total,
    status, observacoes
  ) values (
    v_reservation_id, v_code, v_guest.id, v_room.id, p_checkin, p_checkout,
    p_guests, p_guests, 0, v_total, v_total,
    'confirmada', case when p_actor_user_id is null then null else 'Vinculada pela Recepção · usuário ' || p_actor_user_id end
  );

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'reservation_code', v_code,
    'guest_id', v_guest.id,
    'room_id', v_room.id,
    'checkin', p_checkin,
    'checkout', p_checkout,
    'guests', p_guests,
    'total', v_total
  );
end;
$$;

grant execute on function public.reception_create_reservation_for_guest(text, text, date, date, integer, text) to anon, authenticated;
