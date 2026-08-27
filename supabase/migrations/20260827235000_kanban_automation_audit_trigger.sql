-- Registra na trilha de auditoria somente cards promovidos automaticamente
-- pela ponte de compatibilidade ou pelo bootstrap do banco principal.
-- Cards manuais continuam auditados pela camada de governança da aplicação,
-- evitando duplicação de eventos.

CREATE OR REPLACE FUNCTION public.log_kanban_automation_card_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_type text;
BEGIN
  IF NOT (
    COALESCE(NEW.metadata ->> 'automation_bridge', 'false') = 'true'
    OR COALESCE(NEW.metadata ->> 'primary_database_bootstrap', 'false') = 'true'
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_event_type := 'created';
  ELSIF OLD.column_id IS DISTINCT FROM NEW.column_id THEN
    IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
      v_event_type := 'completed';
    ELSIF OLD.completed_at IS NOT NULL AND NEW.completed_at IS NULL THEN
      v_event_type := 'reopened';
    ELSE
      v_event_type := 'moved';
    END IF;
  ELSE
    v_event_type := 'updated';
  END IF;

  INSERT INTO public.kanban_card_events (
    hotel_id,
    card_id,
    user_id,
    event_type,
    from_value,
    to_value,
    metadata
  ) VALUES (
    NEW.hotel_id,
    NEW.id,
    NULL,
    v_event_type,
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
      'column_id', OLD.column_id,
      'completed_at', OLD.completed_at,
      'updated_at', OLD.updated_at
    ) ELSE NULL END,
    jsonb_build_object(
      'titulo', NEW.titulo,
      'board_id', NEW.board_id,
      'column_id', NEW.column_id,
      'departamento', NEW.departamento,
      'room_number', NEW.room_number,
      'reservation_id', NEW.reservation_id,
      'completed_at', NEW.completed_at,
      'updated_at', NEW.updated_at
    ),
    jsonb_build_object(
      'source', CASE
        WHEN COALESCE(NEW.metadata ->> 'primary_database_bootstrap', 'false') = 'true'
          THEN 'primary_database_bootstrap'
        ELSE 'automation_bridge'
      END
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kanban_automation_audit_trigger ON public.kanban_cards;
CREATE TRIGGER kanban_automation_audit_trigger
AFTER INSERT OR UPDATE ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.log_kanban_automation_card_event();
