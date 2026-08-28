-- Demandas relacionadas de Manutenção passam a controlar o status operacional do quarto.
-- Regra: enquanto existir ao menos uma demanda derivada ativa de Manutenção para o quarto,
-- o quarto permanece em 'manutencao'. Quando a última demanda for concluída/arquivada/excluída,
-- o status anterior é restaurado. O motor Kanban não é alterado.

ALTER TABLE public.quartos
  ADD COLUMN IF NOT EXISTS status_antes_manutencao text;

CREATE OR REPLACE FUNCTION public.sync_related_maintenance_room_status(p_room_number text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active boolean;
  v_active_title text;
BEGIN
  IF NULLIF(btrim(COALESCE(p_room_number, '')), '') IS NULL THEN
    RETURN;
  END IF;

  SELECT
    EXISTS (
      SELECT 1
      FROM public.kanban_cards kc
      WHERE kc.board_id = 'kanban-board-manutencao'
        AND kc.room_number::text = p_room_number::text
        AND COALESCE(kc.is_archived, false) = false
        AND kc.column_id <> 'man-col-resolvido'
        AND kc.completed_at IS NULL
        AND kc.metadata->>'relation_type' = 'derived_demand'
        AND COALESCE(kc.metadata->>'target_sector', 'manutencao') = 'manutencao'
    ),
    (
      SELECT kc.titulo
      FROM public.kanban_cards kc
      WHERE kc.board_id = 'kanban-board-manutencao'
        AND kc.room_number::text = p_room_number::text
        AND COALESCE(kc.is_archived, false) = false
        AND kc.column_id <> 'man-col-resolvido'
        AND kc.completed_at IS NULL
        AND kc.metadata->>'relation_type' = 'derived_demand'
        AND COALESCE(kc.metadata->>'target_sector', 'manutencao') = 'manutencao'
      ORDER BY kc.updated_at DESC NULLS LAST
      LIMIT 1
    )
  INTO v_has_active, v_active_title;

  IF v_has_active THEN
    UPDATE public.quartos q
       SET status_antes_manutencao = CASE
             WHEN q.status IS DISTINCT FROM 'manutencao'
               THEN COALESCE(q.status_antes_manutencao, q.status)
             ELSE q.status_antes_manutencao
           END,
           status = 'manutencao',
           status_manutencao_motivo = COALESCE(NULLIF(v_active_title, ''), q.status_manutencao_motivo, 'Demanda relacionada de manutenção ativa'),
           updated_at = now()
     WHERE q.numero::text = p_room_number::text
       AND (
         q.status IS DISTINCT FROM 'manutencao'
         OR q.status_manutencao_motivo IS DISTINCT FROM COALESCE(NULLIF(v_active_title, ''), q.status_manutencao_motivo, 'Demanda relacionada de manutenção ativa')
       );
  ELSE
    UPDATE public.quartos q
       SET status = q.status_antes_manutencao,
           status_antes_manutencao = NULL,
           status_manutencao_motivo = NULL,
           updated_at = now()
     WHERE q.numero::text = p_room_number::text
       AND q.status = 'manutencao'
       AND q.status_antes_manutencao IS NOT NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_related_maintenance_controls_room_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_room text;
  v_new_room text;
  v_old_related boolean := false;
  v_new_related boolean := false;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    v_old_room := OLD.room_number::text;
    v_old_related := OLD.board_id = 'kanban-board-manutencao'
      AND OLD.metadata->>'relation_type' = 'derived_demand'
      AND COALESCE(OLD.metadata->>'target_sector', 'manutencao') = 'manutencao';
  END IF;

  IF TG_OP <> 'DELETE' THEN
    v_new_room := NEW.room_number::text;
    v_new_related := NEW.board_id = 'kanban-board-manutencao'
      AND NEW.metadata->>'relation_type' = 'derived_demand'
      AND COALESCE(NEW.metadata->>'target_sector', 'manutencao') = 'manutencao';
  END IF;

  IF v_old_related AND NULLIF(btrim(COALESCE(v_old_room, '')), '') IS NOT NULL THEN
    PERFORM public.sync_related_maintenance_room_status(v_old_room);
  END IF;

  IF v_new_related
    AND NULLIF(btrim(COALESCE(v_new_room, '')), '') IS NOT NULL
    AND (NOT v_old_related OR v_new_room IS DISTINCT FROM v_old_room)
  THEN
    PERFORM public.sync_related_maintenance_room_status(v_new_room);
  ELSIF v_new_related AND TG_OP = 'UPDATE' THEN
    -- Mesmo quarto, mas a coluna/completed_at/archive pode ter mudado.
    PERFORM public.sync_related_maintenance_room_status(v_new_room);
  ELSIF v_new_related AND TG_OP = 'INSERT' THEN
    PERFORM public.sync_related_maintenance_room_status(v_new_room);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_related_maintenance_controls_room_status ON public.kanban_cards;
CREATE TRIGGER trg_related_maintenance_controls_room_status
AFTER INSERT OR UPDATE OR DELETE
ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.trg_related_maintenance_controls_room_status();

-- Backfill: aplica imediatamente a regra às demandas relacionadas já abertas.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT kc.room_number::text AS room_number
    FROM public.kanban_cards kc
    WHERE kc.board_id = 'kanban-board-manutencao'
      AND kc.room_number IS NOT NULL
      AND kc.metadata->>'relation_type' = 'derived_demand'
      AND COALESCE(kc.metadata->>'target_sector', 'manutencao') = 'manutencao'
  LOOP
    PERFORM public.sync_related_maintenance_room_status(r.room_number);
  END LOOP;
END;
$$;
