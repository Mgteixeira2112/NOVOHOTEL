-- Encerramento / integridade operacional
-- Converge as projeções fixas legadas de Manutenção para o ID canônico
-- já definido por sync_fixed_room_projection_cards(). Não cria novo estado.

-- 1. Garante que cada quarto possua as duas projeções canônicas atuais.
do $$
declare
  v_room record;
begin
  for v_room in select id from public.quartos loop
    perform public.sync_fixed_room_projection_cards(v_room.id::text);
  end loop;
end $$;

-- 2. Remove apenas a projeção legada de bootstrap quando a canônica equivalente existe.
delete from public.kanban_cards legacy
where legacy.id like 'auto-man-room-%'
  and legacy.board_id = 'kanban-board-manutencao'
  and coalesce((legacy.metadata->>'fixed_room_projection')::boolean, false) = true
  and exists (
    select 1
    from public.kanban_cards canonical
    where canonical.id = 'room-man-' || legacy.room_id::text
      and canonical.board_id = 'kanban-board-manutencao'
      and canonical.room_id::text = legacy.room_id::text
      and coalesce((canonical.metadata->>'fixed_room_projection')::boolean, false) = true
  );

-- 3. Impede que uma segunda projeção fixa seja criada para o mesmo quarto/setor.
create unique index if not exists uq_kanban_fixed_room_projection_room_board
  on public.kanban_cards (room_id, board_id)
  where room_id is not null
    and coalesce((metadata->>'fixed_room_projection')::boolean, false) = true;
