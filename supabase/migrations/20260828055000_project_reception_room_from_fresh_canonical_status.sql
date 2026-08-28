-- A projeção do card de quartos deve usar o estado canônico recalculado no momento,
-- e não NEW.status_operacional, que pode estar obsoleto dentro da mesma cadeia de triggers.
-- Camada externa ao motor Kanban.

CREATE OR REPLACE FUNCTION public.sync_room_to_reception_room_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_column_id text;
  v_operational_status text;
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD.status IS NOT DISTINCT FROM NEW.status
    AND OLD.numero IS NOT DISTINCT FROM NEW.numero
    AND OLD.nome IS NOT DISTINCT FROM NEW.nome
    AND OLD.andar IS NOT DISTINCT FROM NEW.andar
    AND OLD.ativo IS NOT DISTINCT FROM NEW.ativo
  THEN
    RETURN NEW;
  END IF;

  -- Consulta a verdade operacional já persistida/recalculável neste momento.
  -- Evita usar NEW.status_operacional, que pode representar o valor anterior da linha
  -- quando outro AFTER trigger já atualizou status_operacional via UPDATE aninhado.
  v_operational_status := public.resolve_room_operational_status(NEW.numero::text);
  v_column_id := public.reception_room_status_to_column(v_operational_status);

  INSERT INTO public.kanban_cards (
    id, hotel_id, board_id, column_id, titulo, descricao, prioridade, ordem,
    departamento, room_number, room_id, task_context_type, target_sector,
    metadata, is_archived
  ) VALUES (
    'room-rec-' || NEW.id::text,
    'default_hotel',
    'kanban-board-recepcao-quartos',
    v_column_id,
    'Quarto ' || NEW.numero,
    COALESCE(NULLIF(NEW.nome, ''), 'Acomodação do hotel') || ' · ' || COALESCE(NEW.andar::text || 'º andar', 'andar não informado'),
    'normal',
    0,
    'recepcao',
    NEW.numero::text,
    NEW.id::text,
    'room',
    'recepcao',
    jsonb_build_object(
      'room_id', NEW.id,
      'relation_type', 'room_status_projection',
      'task_context_type', 'room',
      'target_sector', 'recepcao',
      'room_operational_status', v_operational_status
    ),
    NOT COALESCE(NEW.ativo, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    board_id = EXCLUDED.board_id,
    column_id = EXCLUDED.column_id,
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    departamento = EXCLUDED.departamento,
    room_number = EXCLUDED.room_number,
    room_id = EXCLUDED.room_id,
    task_context_type = EXCLUDED.task_context_type,
    target_sector = EXCLUDED.target_sector,
    metadata = COALESCE(public.kanban_cards.metadata, '{}'::jsonb) || EXCLUDED.metadata,
    is_archived = EXCLUDED.is_archived,
    updated_at = now();

  RETURN NEW;
END;
$$;
