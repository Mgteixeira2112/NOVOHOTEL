-- Evita que a projeção do Kanban de Quartos apague o status operacional canônico
-- gravado no metadata dos cards vinculados ao quarto.

CREATE OR REPLACE FUNCTION public.sync_room_to_reception_room_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_column_id text;
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

  v_column_id := public.reception_room_status_to_column(
    COALESCE(NEW.status_operacional, NEW.status)
  );

  INSERT INTO public.kanban_cards (
    id,
    hotel_id,
    board_id,
    column_id,
    titulo,
    descricao,
    prioridade,
    ordem,
    departamento,
    room_number,
    metadata,
    is_archived
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
    jsonb_build_object(
      'room_id', NEW.id,
      'relation_type', 'room_status_projection',
      'room_operational_status', COALESCE(NEW.status_operacional, public.normalize_room_operational_status(NEW.status))
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
    metadata = COALESCE(public.kanban_cards.metadata, '{}'::jsonb) || EXCLUDED.metadata,
    is_archived = EXCLUDED.is_archived,
    updated_at = now();

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT numero::text AS numero FROM public.quartos LOOP
    PERFORM public.refresh_room_operational_status(r.numero);
  END LOOP;
END $$;
