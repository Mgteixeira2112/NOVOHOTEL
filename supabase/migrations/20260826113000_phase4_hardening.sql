-- FASE 4 — hardening incremental
-- Não remove dados. Corrige apenas invariantes que precisam sobreviver a reexecuções.

-- 1) Sincroniza a sequência com códigos já existentes antes de gerar novos códigos.
do $$
declare
  v_next bigint;
begin
  if exists (select 1 from pg_class where relkind = 'S' and oid = 'public.hotel_os_reservation_code_seq'::regclass) then
    select greatest(coalesce(max(nullif(regexp_replace(codigo_reserva, '^HTL-[0-9]{4}-', ''), '')::bigint), 999), 999) + 1
      into v_next
      from public.reservas
     where codigo_reserva ~ '^HTL-[0-9]{4}-[0-9]+$';
    perform setval('public.hotel_os_reservation_code_seq', v_next, false);
  end if;
exception when others then
  -- Não bloquear bancos legados por códigos fora do formato esperado.
  null;
end $$;

-- 2) Evita combinações impossíveis de tarifa/plano de tarifa entre hotéis.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'hotel_os_rates_plan_same_hotel'
  ) then
    alter table public.hotel_os_rate_plans
      add constraint hotel_os_rate_plans_hotel_id_id_unique unique (hotel_id, id);
    alter table public.hotel_os_rates
      add constraint hotel_os_rates_plan_same_hotel
      foreign key (hotel_id, rate_plan_id)
      references public.hotel_os_rate_plans(hotel_id, id);
  end if;
exception when duplicate_object then
  null;
end $$;

-- 3) Índices adicionais para o caminho crítico de disponibilidade.
create index if not exists idx_reservas_room_interval_status
  on public.reservas(hotel_id, quarto_id, checkin, checkout, status);
create index if not exists idx_stays_room_interval_status
  on public.hotel_os_stays(hotel_id, room_id, checked_in_at, checked_out_at, status);
create index if not exists idx_bloqueios_room_interval
  on public.bloqueios(hotel_id, quarto_id, data_inicio, data_fim);

-- 4) Função única para geração de código de reserva.
-- O sequence é global e transacionalmente seguro contra colisões concorrentes.
create or replace function public.hotel_os_next_reservation_code(p_year integer default extract(year from current_date)::integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number bigint;
begin
  v_number := nextval('public.hotel_os_reservation_code_seq');
  return 'HTL-' || p_year::text || '-' || lpad(v_number::text, 6, '0');
end;
$$;
revoke all on function public.hotel_os_next_reservation_code(integer) from public;
grant execute on function public.hotel_os_next_reservation_code(integer) to authenticated;

-- 5) Diagnóstico não destrutivo de sobreposição de tarifas.
create or replace function public.hotel_os_rate_conflicts(p_hotel_id uuid default null)
returns table(rate_a uuid, rate_b uuid, hotel_id uuid, room_type_id text, rate_plan_id uuid)
language sql
security definer
set search_path = public
as $$
  select a.id, b.id, a.hotel_id, a.room_type_id, a.rate_plan_id
    from public.hotel_os_rates a
    join public.hotel_os_rates b
      on b.hotel_id = a.hotel_id
     and b.room_type_id = a.room_type_id
     and b.rate_plan_id = a.rate_plan_id
     and b.id > a.id
     and b.active
     and a.active
     and a.valid_from <= b.valid_to
     and b.valid_from <= a.valid_to
   where (p_hotel_id is null or a.hotel_id = p_hotel_id);
$$;
revoke all on function public.hotel_os_rate_conflicts(uuid) from public;
grant execute on function public.hotel_os_rate_conflicts(uuid) to authenticated;
