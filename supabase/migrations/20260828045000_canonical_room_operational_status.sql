-- Status operacional canônico dos quartos.
-- Mantém os fluxos setoriais (Governança/Manutenção/Recepção) independentes,
-- mas fornece uma única verdade para exibição do estado do quarto.

ALTER TABLE public.quartos
  ADD COLUMN IF NOT EXISTS status_operacional text;

CREATE OR REPLACE FUNCTION public.normalize_room_operational_status(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(btrim(COALESCE(p_status, '')))
    WHEN 'manutencao' THEN 'manutencao'
    WHEN 'manutenção' THEN 'manutencao'
    WHEN 'bloqueado' THEN 'bloqueado'
    WHEN 'interditado' THEN 'bloqueado'
    WHEN 'ocupado' THEN 'ocupado'
    WHEN 'checkin_realizado' THEN 'ocupado'
    WHEN 'sujo' THEN 'sujo'
    WHEN 'limpeza' THEN 'limpeza'
    WHEN 'em_limpeza' THEN 'limpeza'
    WHEN 'vistoria' THEN 'vistoria'
    WHEN 'aguardando_vistoria' THEN 'vistoria'
    WHEN 'inspecionado' THEN 'vistoria'
    WHEN 'disponivel' THEN 'disponivel'
    WHEN 'disponível' THEN 'disponivel'
    WHEN 'limpo' THEN 'disponivel'
    WHEN 'aprovado' THEN 'disponivel'
    ELSE 'outros'
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_room_operational_status(p_room_number text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_room public.quartos%ROWTYPE;
  v_has_maintenance boolean := false;
  v_has_checkin boolean := false;
  v_housekeeping text;
  v_base text;
BEGIN
  SELECT * INTO v_room
  FROM public.quartos q
  WHERE q.numero::text = p_room_number::text
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'outros';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.kanban_cards c
    WHERE c.board_id = 'kanban-board-manutencao'
      AND c.room_number::text = p_room_number::text
      AND COALESCE(c.is_archived, false) = false
      AND c.column_id <> 'man-col-resolvido'
  ) INTO v_has_maintenance;

  IF v_has_maintenance THEN
    RETURN 'manutencao';
  END IF;

  v_base := public.normalize_room_operational_status(v_room.status);
  IF v_base = 'bloqueado' THEN
    RETURN 'bloqueado';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.reservas r
    WHERE r.quarto_id::text = v_room.id::text
      AND r.status = 'checkin_realizado'
  ) INTO v_has_checkin;

  IF v_has_checkin THEN
    RETURN 'ocupado';
  END IF;

  v_housekeeping := public.normalize_room_operational_status(
    COALESCE(v_room.status_governanca, v_room.status_housekeeping)
  );

  IF v_housekeeping IN ('sujo', 'limpeza', 'vistoria') THEN
    RETURN v_housekeeping;
  END IF;

  IF v_housekeeping = 'disponivel' THEN
    RETURN 'disponivel';
  END IF;

  IF v_base IN ('ocupado', 'sujo', 'limpeza', 'vistoria', 'disponivel', 'manutencao', 'bloqueado') THEN
    RETURN v_base;
  END IF;

  RETURN 'outros';
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_room_operational_status(p_room_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  v_status := public.resolve_room_operational_status(p_room_number);

  UPDATE public.quartos q
     SET status_operacional = v_status,
         updated_at = CASE WHEN q.status_operacional IS DISTINCT FROM v_status THEN now() ELSE q.updated_at END
   WHERE q.numero::text = p_room_number::text
     AND q.status_operacional IS DISTINCT FROM v_status;

  UPDATE public.kanban_cards c
     SET metadata = COALESCE(c.metadata, '{}'::jsonb)
       || jsonb_build_object('room_operational_status', v_status),
         updated_at = CASE
           WHEN COALESCE(c.metadata->>'room_operational_status', '') IS DISTINCT FROM v_status THEN now()
           ELSE c.updated_at
         END
   WHERE c.room_number::text = p_room_number::text
     AND COALESCE(c.metadata->>'room_operational_status', '') IS DISTINCT FROM v_status;

  UPDATE public.kanban_cards c
     SET column_id = public.reception_room_status_to_column(v_status),
         updated_at = now()
   WHERE c.board_id = 'kanban-board-recepcao-quartos'
     AND c.room_number::text = p_room_number::text
     AND c.column_id IS DISTINCT FROM public.reception_room_status_to_column(v_status);

  RETURN v_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_room_operational_status_from_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_room_operational_status(NEW.numero::text);
  IF TG_OP = 'UPDATE' AND OLD.numero::text IS DISTINCT FROM NEW.numero::text THEN
    PERFORM public.refresh_room_operational_status(OLD.numero::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_room_operational_status_from_room ON public.quartos;
CREATE TRIGGER trg_refresh_room_operational_status_from_room
AFTER INSERT OR UPDATE OF status, status_governanca, status_housekeeping, numero
ON public.quartos
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_room_operational_status_from_room();

CREATE OR REPLACE FUNCTION public.trg_refresh_room_operational_status_from_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_number text;
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.quarto_id IS NOT NULL THEN
    SELECT q.numero::text INTO v_room_number FROM public.quartos q WHERE q.id::text = OLD.quarto_id::text LIMIT 1;
    IF v_room_number IS NOT NULL THEN PERFORM public.refresh_room_operational_status(v_room_number); END IF;
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.quarto_id IS NOT NULL THEN
    SELECT q.numero::text INTO v_room_number FROM public.quartos q WHERE q.id::text = NEW.quarto_id::text LIMIT 1;
    IF v_room_number IS NOT NULL THEN PERFORM public.refresh_room_operational_status(v_room_number); END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_room_operational_status_from_reservation ON public.reservas;
CREATE TRIGGER trg_refresh_room_operational_status_from_reservation
AFTER INSERT OR UPDATE OF status, quarto_id OR DELETE
ON public.reservas
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_room_operational_status_from_reservation();

CREATE OR REPLACE FUNCTION public.trg_refresh_room_operational_status_from_kanban()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.room_number IS NOT NULL
     AND (OLD.board_id = 'kanban-board-manutencao' OR OLD.board_id = 'kanban-board-governanca') THEN
    PERFORM public.refresh_room_operational_status(OLD.room_number::text);
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.room_number IS NOT NULL
     AND (NEW.board_id = 'kanban-board-manutencao' OR NEW.board_id = 'kanban-board-governanca') THEN
    PERFORM public.refresh_room_operational_status(NEW.room_number::text);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_room_operational_status_from_kanban ON public.kanban_cards;
CREATE TRIGGER trg_refresh_room_operational_status_from_kanban
AFTER INSERT OR UPDATE OF board_id, column_id, room_number, is_archived OR DELETE
ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.trg_refresh_room_operational_status_from_kanban();

-- Backfill idempotente de todos os quartos e todos os cards vinculados.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT numero::text AS numero FROM public.quartos LOOP
    PERFORM public.refresh_room_operational_status(r.numero);
  END LOOP;
END $$;
