-- Fonte operacional única dos quartos para o Workspace de Governança.
-- Aditiva: não altera contratos do motor Kanban.

ALTER TABLE public.quartos
  ADD COLUMN IF NOT EXISTS status_housekeeping text,
  ADD COLUMN IF NOT EXISTS status_governanca text,
  ADD COLUMN IF NOT EXISTS status_manutencao_motivo text,
  ADD COLUMN IF NOT EXISTS ultima_limpeza timestamptz,
  ADD COLUMN IF NOT EXISTS responsavel_limpeza text,
  ADD COLUMN IF NOT EXISTS notas_internas text,
  ADD COLUMN IF NOT EXISTS fechadura_bateria integer;

ALTER TABLE public.quartos REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'quartos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quartos;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_governanca_card_to_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_responsavel text;
BEGIN
  IF NEW.board_id <> 'kanban-board-governanca' OR NEW.room_number IS NULL OR btrim(NEW.room_number) = '' THEN
    RETURN NEW;
  END IF;

  v_status := CASE NEW.column_id
    WHEN 'gov-col-a-limpar' THEN 'sujo'
    WHEN 'gov-col-em-limpeza' THEN 'em_limpeza'
    WHEN 'gov-col-inspecao' THEN 'aguardando_vistoria'
    WHEN 'gov-col-liberado' THEN 'aprovado'
    ELSE NULL
  END;

  IF v_status IS NULL THEN
    RETURN NEW;
  END IF;

  v_responsavel := NULLIF(COALESCE(NEW.assigned_to->>'nome', NEW.assigned_to->>'name'), '');

  IF v_responsavel IS NULL AND NEW.assigned_user_id IS NOT NULL THEN
    SELECT u.nome
      INTO v_responsavel
      FROM public.usuarios u
     WHERE u.id::text = NEW.assigned_user_id::text
     LIMIT 1;
  END IF;

  UPDATE public.quartos q
     SET status_housekeeping = v_status,
         status_governanca = v_status,
         responsavel_limpeza = COALESCE(v_responsavel, q.responsavel_limpeza),
         ultima_limpeza = CASE
           WHEN NEW.column_id = 'gov-col-liberado'
             AND OLD.column_id IS DISTINCT FROM NEW.column_id
           THEN COALESCE(NEW.completed_at, now())
           ELSE q.ultima_limpeza
         END,
         updated_at = now()
   WHERE q.numero::text = NEW.room_number::text;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_governanca_card_to_room ON public.kanban_cards;
CREATE TRIGGER trg_sync_governanca_card_to_room
AFTER INSERT OR UPDATE OF column_id, assigned_user_id, assigned_to, completed_at, room_number
ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.sync_governanca_card_to_room();

-- Backfill idempotente a partir do card ativo mais recentemente atualizado de cada quarto.
WITH ranked AS (
  SELECT
    c.*,
    row_number() OVER (
      PARTITION BY c.room_number
      ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC NULLS LAST, c.id DESC
    ) AS rn
  FROM public.kanban_cards c
  WHERE c.board_id = 'kanban-board-governanca'
    AND COALESCE(c.is_archived, false) = false
    AND c.room_number IS NOT NULL
), latest AS (
  SELECT * FROM ranked WHERE rn = 1
)
UPDATE public.quartos q
SET status_housekeeping = CASE l.column_id
      WHEN 'gov-col-a-limpar' THEN 'sujo'
      WHEN 'gov-col-em-limpeza' THEN 'em_limpeza'
      WHEN 'gov-col-inspecao' THEN 'aguardando_vistoria'
      WHEN 'gov-col-liberado' THEN 'aprovado'
      ELSE q.status_housekeeping
    END,
    status_governanca = CASE l.column_id
      WHEN 'gov-col-a-limpar' THEN 'sujo'
      WHEN 'gov-col-em-limpeza' THEN 'em_limpeza'
      WHEN 'gov-col-inspecao' THEN 'aguardando_vistoria'
      WHEN 'gov-col-liberado' THEN 'aprovado'
      ELSE q.status_governanca
    END,
    responsavel_limpeza = COALESCE(NULLIF(COALESCE(l.assigned_to->>'nome', l.assigned_to->>'name'), ''), q.responsavel_limpeza),
    ultima_limpeza = CASE
      WHEN l.column_id = 'gov-col-liberado' THEN COALESCE(q.ultima_limpeza, l.completed_at, l.updated_at, now())
      ELSE q.ultima_limpeza
    END,
    updated_at = now()
FROM latest l
WHERE q.numero::text = l.room_number::text;
