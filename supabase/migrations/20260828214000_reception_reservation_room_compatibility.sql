-- A reserva deve nascer com um quarto compatível.
-- Compatibilidade = período sem conflito + capacidade + esquema de camas solicitado.

alter table public.reservas
  add column if not exists cama_solicitada text;

comment on column public.reservas.cama_solicitada is
  'Esquema de camas solicitado e validado no momento da criação da reserva.';

-- Remove o fluxo transitório em que a reserva podia nascer sem quarto.
drop function if exists public.reception_create_unassigned_reservation(text, date, date, integer, text);
drop function if exists public.reception_bind_reservation_room(text, text, text);
drop function if exists public.reception_unbind_reservation_room(text, text);

create or replace function public.reception_create_reservation_with_room(
  p_guest_id text,
  p_room_id text,
  p_checkin date,
  p_checkout date,
  p_guests integer,
  p_bed_scheme text,
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
  v_bed_scheme text;
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

  v_bed_scheme := btrim(coalesce(p_bed_scheme, ''));
  if v_bed_scheme = '' then
    raise exception 'Informe o esquema de camas necessário para a reserva.';
  end if;

  select * into v_guest
    from public.hospedes
   where id::text = p_guest_id::text;
  if not found then
    raise exception 'Hóspede não encontrado.';
  end if;

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
  if coalesce(v_room.capacidade, 0) < p_guests then
    raise exception 'A capacidade do quarto é insuficiente para esta reserva.';
  end if;
  if btrim(coalesce(v_room.cama, '')) <> v_bed_scheme then
    raise exception 'O esquema de camas do quarto não atende a esta reserva.';
  end if;

  if exists (
    select 1
      from public.reservas r
     where r.quarto_id::text = v_room.id::text
       and r.status in ('pendente', 'confirmada', 'checkin_realizado')
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
    v_bed_scheme,
    v_rate * v_nights,
    v_total,
    'confirmada',
    case
      when p_actor_user_id is null then 'Reserva criada com quarto compatível validado.'
      else 'Reserva criada com quarto compatível validado · usuário ' || p_actor_user_id
    end
  );

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'reservation_code', v_code,
    'guest_id', v_guest.id,
    'room_id', v_room.id,
    'bed_scheme', v_bed_scheme,
    'checkin', p_checkin,
    'checkout', p_checkout,
    'guests', p_guests,
    'total', v_total
  );
end;
$$;

grant execute on function public.reception_create_reservation_with_room(text, text, date, date, integer, text, text) to anon, authenticated;
