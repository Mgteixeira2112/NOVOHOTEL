-- Motor canônico de disponibilidade do inventário hoteleiro.
-- Regras:
--   1. intervalo de reserva = [check-in, check-out)
--   2. um quarto não pode ter reservas ativas sobrepostas
--   3. reservas ativas não podem cruzar bloqueios do quarto
--   4. reservas e bloqueios serializam pela linha do quarto para evitar corrida
--   5. a busca de disponibilidade vive no Supabase e é reutilizável pela UI

create extension if not exists btree_gist;

-- Datas válidas em qualquer caminho de escrita.
alter table public.reservas
  drop constraint if exists reservas_periodo_valido;
alter table public.reservas
  add constraint reservas_periodo_valido
  check (checkout > checkin);

alter table public.bloqueios
  drop constraint if exists bloqueios_periodo_valido;
alter table public.bloqueios
  add constraint bloqueios_periodo_valido
  check (data_fim > data_inicio);

-- Proteção física contra dupla reserva do mesmo quarto.
alter table public.reservas
  drop constraint if exists reservas_quarto_periodo_ativo_excl;
alter table public.reservas
  add constraint reservas_quarto_periodo_ativo_excl
  exclude using gist (
    quarto_id with =,
    daterange(checkin, checkout, '[)') with &&
  )
  where (
    quarto_id is not null
    and status in ('pendente', 'confirmada', 'checkin_realizado')
  );

create or replace function public.validate_reservation_inventory()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_room public.quartos%rowtype;
begin
  if new.quarto_id is null or new.status not in ('pendente', 'confirmada', 'checkin_realizado') then
    return new;
  end if;

  if new.checkout <= new.checkin then
    raise exception 'O check-out deve ser posterior ao check-in.';
  end if;

  -- O mesmo lock é usado pelo trigger de bloqueios e pelos RPCs de reserva.
  select * into v_room
    from public.quartos
   where id::text = new.quarto_id::text
   for update;

  if not found then
    raise exception 'Quarto não encontrado.';
  end if;

  if coalesce(v_room.ativo, true) = false then
    raise exception 'O quarto está inativo.';
  end if;

  if coalesce(new.quantidade_hospedes, 1) > coalesce(v_room.capacidade, 0) then
    raise exception 'A capacidade do quarto é insuficiente para esta reserva.';
  end if;

  if nullif(btrim(coalesce(new.cama_solicitada, '')), '') is not null
     and btrim(coalesce(v_room.cama, '')) <> btrim(new.cama_solicitada) then
    raise exception 'O esquema de camas do quarto não atende a esta reserva.';
  end if;

  if exists (
    select 1
      from public.bloqueios b
     where b.quarto_id::text = new.quarto_id::text
       and daterange(b.data_inicio, b.data_fim, '[)') && daterange(new.checkin, new.checkout, '[)')
  ) then
    raise exception 'O quarto possui bloqueio operacional no período selecionado.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_reservation_inventory on public.reservas;
create trigger trg_validate_reservation_inventory
before insert or update of quarto_id, checkin, checkout, status, quantidade_hospedes, cama_solicitada
on public.reservas
for each row
execute function public.validate_reservation_inventory();

create or replace function public.validate_room_block_inventory()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_room public.quartos%rowtype;
begin
  if new.quarto_id is null then
    return new;
  end if;

  if new.data_fim <= new.data_inicio then
    raise exception 'O fim do bloqueio deve ser posterior ao início.';
  end if;

  select * into v_room
    from public.quartos
   where id::text = new.quarto_id::text
   for update;

  if not found then
    raise exception 'Quarto não encontrado.';
  end if;

  if exists (
    select 1
      from public.reservas r
     where r.quarto_id::text = new.quarto_id::text
       and r.status in ('pendente', 'confirmada', 'checkin_realizado')
       and daterange(r.checkin, r.checkout, '[)') && daterange(new.data_inicio, new.data_fim, '[)')
  ) then
    raise exception 'O quarto possui reserva ativa no período e não pode ser bloqueado.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_room_block_inventory on public.bloqueios;
create trigger trg_validate_room_block_inventory
before insert or update of quarto_id, data_inicio, data_fim
on public.bloqueios
for each row
execute function public.validate_room_block_inventory();

-- Consulta canônica do inventário disponível.
create or replace function public.reception_find_available_rooms(
  p_checkin date,
  p_checkout date,
  p_guests integer,
  p_bed_scheme text default null
)
returns table (
  room_id text,
  numero text,
  nome text,
  capacidade integer,
  cama text,
  valor_diaria numeric,
  tipo_quarto_id text
)
language plpgsql
stable
set search_path = public
as $$
begin
  if p_checkin is null or p_checkout is null or p_checkout <= p_checkin then
    raise exception 'O check-out deve ser posterior ao check-in.';
  end if;

  if coalesce(p_guests, 0) < 1 then
    raise exception 'Informe ao menos um hóspede.';
  end if;

  return query
  select
    q.id,
    q.numero,
    q.nome,
    q.capacidade,
    q.cama,
    q.valor_diaria,
    q.tipo_quarto_id
  from public.quartos q
  where coalesce(q.ativo, true) = true
    and coalesce(q.capacidade, 0) >= p_guests
    and (
      nullif(btrim(coalesce(p_bed_scheme, '')), '') is null
      or btrim(coalesce(q.cama, '')) = btrim(p_bed_scheme)
    )
    and not exists (
      select 1
      from public.reservas r
      where r.quarto_id::text = q.id::text
        and r.status in ('pendente', 'confirmada', 'checkin_realizado')
        and daterange(r.checkin, r.checkout, '[)') && daterange(p_checkin, p_checkout, '[)')
    )
    and not exists (
      select 1
      from public.bloqueios b
      where b.quarto_id::text = q.id::text
        and daterange(b.data_inicio, b.data_fim, '[)') && daterange(p_checkin, p_checkout, '[)')
    )
  order by q.numero;
end;
$$;

grant execute on function public.reception_find_available_rooms(date, date, integer, text) to anon, authenticated;

-- Criação atômica: o quarto é novamente travado e revalidado no instante do insert.
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
  if p_guest_id is null or btrim(p_guest_id) = '' then raise exception 'Selecione um hóspede.'; end if;
  if p_room_id is null or btrim(p_room_id) = '' then raise exception 'Selecione um quarto.'; end if;
  if p_checkin is null or p_checkout is null or p_checkout <= p_checkin then raise exception 'O check-out deve ser posterior ao check-in.'; end if;
  if coalesce(p_guests, 0) < 1 then raise exception 'Informe ao menos um hóspede.'; end if;

  v_bed_scheme := btrim(coalesce(p_bed_scheme, ''));
  if v_bed_scheme = '' then raise exception 'Informe o esquema de camas necessário para a reserva.'; end if;

  select * into v_guest from public.hospedes where id::text = p_guest_id::text;
  if not found then raise exception 'Hóspede não encontrado.'; end if;

  select * into v_room from public.quartos where id::text = p_room_id::text for update;
  if not found then raise exception 'Quarto não encontrado.'; end if;
  if coalesce(v_room.ativo, true) = false then raise exception 'O quarto está inativo.'; end if;
  if coalesce(v_room.capacidade, 0) < p_guests then raise exception 'A capacidade do quarto é insuficiente para esta reserva.'; end if;
  if btrim(coalesce(v_room.cama, '')) <> v_bed_scheme then raise exception 'O esquema de camas do quarto não atende a esta reserva.'; end if;

  if exists (
    select 1 from public.reservas r
    where r.quarto_id::text = v_room.id::text
      and r.status in ('pendente', 'confirmada', 'checkin_realizado')
      and daterange(r.checkin, r.checkout, '[)') && daterange(p_checkin, p_checkout, '[)')
  ) then
    raise exception 'O quarto não está mais disponível para o período selecionado. Atualize a disponibilidade e escolha outro quarto.';
  end if;

  if exists (
    select 1 from public.bloqueios b
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

  begin
    insert into public.reservas (
      id, codigo, hospede_id, quarto_id, checkin, checkout,
      quantidade_hospedes, adultos, criancas, cama_solicitada,
      valor_diarias, valor_total, status, observacoes
    ) values (
      v_reservation_id, v_code, v_guest.id, v_room.id, p_checkin, p_checkout,
      p_guests, p_guests, 0, v_bed_scheme,
      v_rate * v_nights, v_total, 'confirmada',
      case when p_actor_user_id is null
        then 'Reserva criada com inventário validado.'
        else 'Reserva criada com inventário validado · usuário ' || p_actor_user_id end
    );
  exception
    when exclusion_violation then
      raise exception 'O quarto não está mais disponível para o período selecionado. Atualize a disponibilidade e escolha outro quarto.';
  end;

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
