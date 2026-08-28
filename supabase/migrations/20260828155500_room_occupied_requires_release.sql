-- Quarto só pode entrar em OCUPADO quando Governança e Manutenção estiverem liberadas.
-- Regra fail-closed: se qualquer projeção estiver ausente ou fora da coluna liberada,
-- a transição é recusada no banco, cobrindo check-in, transferência e atualizações diretas.

create or replace function public.assert_room_occupied_release(p_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_governance_released boolean;
  v_maintenance_released boolean;
begin
  select exists (
    select 1
      from public.kanban_cards c
     where c.id = 'room-gov-' || p_room_id::text
       and c.board_id = 'kanban-board-governanca'
       and c.column_id = 'gov-col-liberado'
       and coalesce(c.is_archived, false) = false
  ) into v_governance_released;

  select exists (
    select 1
      from public.kanban_cards c
     where c.id = 'room-man-' || p_room_id::text
       and c.board_id = 'kanban-board-manutencao'
       and c.column_id = 'man-col-resolvido'
       and coalesce(c.is_archived, false) = false
  ) into v_maintenance_released;

  if not v_governance_released and not v_maintenance_released then
    raise exception 'Quarto não pode ser ocupado: Governança e Manutenção ainda não liberaram o quarto.';
  elsif not v_governance_released then
    raise exception 'Quarto não pode ser ocupado: Governança ainda não liberou o quarto.';
  elsif not v_maintenance_released then
    raise exception 'Quarto não pode ser ocupado: Manutenção ainda não liberou o quarto.';
  end if;
end;
$$;

create or replace function public.trg_require_room_release_before_occupied()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_new_status text;
  v_old_status text;
begin
  v_new_status := public.normalize_room_operational_status(coalesce(new.status_operacional, new.status));
  v_old_status := public.normalize_room_operational_status(coalesce(old.status_operacional, old.status));

  if v_new_status = 'ocupado' and v_old_status is distinct from 'ocupado' then
    perform public.assert_room_occupied_release(new.id::text);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_require_room_release_before_occupied on public.quartos;
create trigger trg_require_room_release_before_occupied
before update of status, status_operacional
on public.quartos
for each row
execute function public.trg_require_room_release_before_occupied();

grant execute on function public.assert_room_occupied_release(text) to anon, authenticated;
