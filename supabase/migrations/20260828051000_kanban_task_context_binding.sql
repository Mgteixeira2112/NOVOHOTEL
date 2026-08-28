-- Contexto formal da tarefa. Aditivo e externo ao motor Kanban.
-- Distingue tarefa de hotel, quarto, setor, cargo, usuário e usuário+quarto.

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS task_context_type text,
  ADD COLUMN IF NOT EXISTS room_id text,
  ADD COLUMN IF NOT EXISTS target_user_id text,
  ADD COLUMN IF NOT EXISTS target_sector text,
  ADD COLUMN IF NOT EXISTS target_role text;

ALTER TABLE public.kanban_cards DROP CONSTRAINT IF EXISTS kanban_cards_task_context_type_check;
ALTER TABLE public.kanban_cards ADD CONSTRAINT kanban_cards_task_context_type_check
  CHECK (task_context_type IS NULL OR task_context_type IN ('hotel','room','sector','role','user','user_room'));

CREATE INDEX IF NOT EXISTS idx_kanban_cards_task_context ON public.kanban_cards(hotel_id, task_context_type) WHERE COALESCE(is_archived,false)=false;
CREATE INDEX IF NOT EXISTS idx_kanban_cards_room_id ON public.kanban_cards(hotel_id, room_id) WHERE room_id IS NOT NULL AND COALESCE(is_archived,false)=false;
CREATE INDEX IF NOT EXISTS idx_kanban_cards_target_user ON public.kanban_cards(hotel_id, target_user_id) WHERE target_user_id IS NOT NULL AND COALESCE(is_archived,false)=false;
CREATE INDEX IF NOT EXISTS idx_kanban_cards_target_sector ON public.kanban_cards(hotel_id, target_sector) WHERE target_sector IS NOT NULL AND COALESCE(is_archived,false)=false;
CREATE INDEX IF NOT EXISTS idx_kanban_cards_target_role ON public.kanban_cards(hotel_id, target_role) WHERE target_role IS NOT NULL AND COALESCE(is_archived,false)=false;

CREATE OR REPLACE FUNCTION public.normalize_kanban_task_context()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_room_id text;
  v_target_user text;
  v_sector text;
  v_role text;
BEGIN
  -- room_id é a chave estável; room_number permanece como dado de exibição/compatibilidade.
  v_room_id := NULLIF(NEW.room_id, '');
  IF v_room_id IS NULL AND NEW.metadata ? 'room_id' THEN
    v_room_id := NULLIF(NEW.metadata->>'room_id','');
  END IF;
  IF v_room_id IS NULL AND NEW.room_number IS NOT NULL AND btrim(NEW.room_number) <> '' THEN
    SELECT q.id::text INTO v_room_id
      FROM public.quartos q
     WHERE q.numero::text = NEW.room_number::text
     LIMIT 1;
  END IF;

  v_target_user := COALESCE(NULLIF(NEW.target_user_id,''), NULLIF(NEW.metadata->>'target_user_id',''));
  v_sector := COALESCE(NULLIF(NEW.target_sector,''), NULLIF(NEW.metadata->>'target_sector',''), NULLIF(NEW.departamento,''));
  v_role := COALESCE(NULLIF(NEW.target_role,''), NULLIF(NEW.metadata->>'target_role',''));

  NEW.room_id := v_room_id;
  NEW.target_user_id := v_target_user;
  NEW.target_sector := v_sector;
  NEW.target_role := v_role;

  IF NEW.task_context_type IS NULL OR NEW.task_context_type = '' THEN
    IF v_room_id IS NOT NULL AND COALESCE(v_target_user, NEW.assigned_user_id::text, NULLIF(NEW.assigned_to->>'id','')) IS NOT NULL THEN
      NEW.task_context_type := 'user_room';
    ELSIF v_room_id IS NOT NULL OR (NEW.room_number IS NOT NULL AND btrim(NEW.room_number) <> '') THEN
      NEW.task_context_type := 'room';
    ELSIF v_target_user IS NOT NULL THEN
      NEW.task_context_type := 'user';
    ELSIF v_role IS NOT NULL THEN
      NEW.task_context_type := 'role';
    ELSIF v_sector IS NOT NULL THEN
      NEW.task_context_type := 'sector';
    ELSE
      NEW.task_context_type := 'hotel';
    END IF;
  END IF;

  NEW.metadata := COALESCE(NEW.metadata,'{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
    'task_context_type', NEW.task_context_type,
    'room_id', NEW.room_id,
    'target_user_id', NEW.target_user_id,
    'target_sector', NEW.target_sector,
    'target_role', NEW.target_role
  ));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_kanban_task_context ON public.kanban_cards;
CREATE TRIGGER trg_normalize_kanban_task_context
BEFORE INSERT OR UPDATE OF room_number, room_id, target_user_id, target_sector, target_role, departamento, assigned_user_id, assigned_to, metadata, task_context_type
ON public.kanban_cards
FOR EACH ROW EXECUTE FUNCTION public.normalize_kanban_task_context();

-- Backfill seguro dos cards existentes. Primeiro resolve a chave estável do quarto.
UPDATE public.kanban_cards c
SET room_id = q.id::text
FROM public.quartos q
WHERE c.room_id IS NULL
  AND c.room_number IS NOT NULL
  AND btrim(c.room_number) <> ''
  AND q.numero::text = c.room_number::text;

-- Depois classifica o contexto, preservando valores explícitos futuros.
UPDATE public.kanban_cards c
SET target_sector = COALESCE(NULLIF(c.target_sector,''), NULLIF(c.metadata->>'target_sector',''), NULLIF(c.departamento,'')),
    target_user_id = COALESCE(NULLIF(c.target_user_id,''), NULLIF(c.metadata->>'target_user_id','')),
    target_role = COALESCE(NULLIF(c.target_role,''), NULLIF(c.metadata->>'target_role','')),
    task_context_type = CASE
      WHEN c.task_context_type IS NOT NULL AND c.task_context_type <> '' THEN c.task_context_type
      WHEN c.room_id IS NOT NULL AND COALESCE(c.target_user_id, c.assigned_user_id::text, NULLIF(c.assigned_to->>'id','')) IS NOT NULL THEN 'user_room'
      WHEN c.room_id IS NOT NULL OR (c.room_number IS NOT NULL AND btrim(c.room_number) <> '') THEN 'room'
      WHEN COALESCE(c.target_user_id, NULLIF(c.metadata->>'target_user_id','')) IS NOT NULL THEN 'user'
      WHEN COALESCE(c.target_role, NULLIF(c.metadata->>'target_role','')) IS NOT NULL THEN 'role'
      WHEN COALESCE(c.target_sector, NULLIF(c.metadata->>'target_sector',''), NULLIF(c.departamento,'')) IS NOT NULL THEN 'sector'
      ELSE 'hotel'
    END;

-- Força a normalização do metadata depois do backfill sem alterar o fluxo Kanban.
UPDATE public.kanban_cards SET metadata = COALESCE(metadata,'{}'::jsonb);
