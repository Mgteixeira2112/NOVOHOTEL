-- Kanban operacional de quartos da Recepção.
-- Aditivo: cria um board separado do Kanban de tarefas e não altera o motor Kanban.

INSERT INTO public.kanban_boards (id, hotel_id, nome, departamento, descricao, ativo)
VALUES (
  'kanban-board-recepcao-quartos',
  'default_hotel',
  'Recepção · Quartos',
  'recepcao',
  'Mapa operacional dos quartos classificados pelo status atual',
  true
)
ON CONFLICT (id) DO UPDATE SET
  hotel_id = EXCLUDED.hotel_id,
  nome = EXCLUDED.nome,
  departamento = EXCLUDED.departamento,
  descricao = EXCLUDED.descricao,
  ativo = EXCLUDED.ativo;

INSERT INTO public.kanban_columns (id, board_id, nome, ordem)
VALUES
  ('room-col-disponivel', 'kanban-board-recepcao-quartos', 'Disponível', 0),
  ('room-col-ocupado', 'kanban-board-recepcao-quartos', 'Ocupado', 1),
  ('room-col-sujo', 'kanban-board-recepcao-quartos', 'Sujo', 2),
  ('room-col-limpeza', 'kanban-board-recepcao-quartos', 'Em Limpeza', 3),
  ('room-col-vistoria', 'kanban-board-recepcao-quartos', 'Vistoria', 4),
  ('room-col-manutencao', 'kanban-board-recepcao-quartos', 'Manutenção', 5),
  ('room-col-bloqueado', 'kanban-board-recepcao-quartos', 'Bloqueado', 6),
  ('room-col-outros', 'kanban-board-recepcao-quartos', 'Outros', 7)
ON CONFLICT (id) DO UPDATE SET
  board_id = EXCLUDED.board_id,
  nome = EXCLUDED.nome,
  ordem = EXCLUDED.ordem;

CREATE OR REPLACE FUNCTION public.reception_room_status_to_column(p_status text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(btrim(COALESCE(p_status, '')))
    WHEN 'disponivel' THEN 'room-col-disponivel'
    WHEN 'aprovado' THEN 'room-col-disponivel'
    WHEN 'limpo' THEN 'room-col-disponivel'
    WHEN 'ocupado' THEN 'room-col-ocupado'
    WHEN 'sujo' THEN 'room-col-sujo'
    WHEN 'limpeza' THEN 'room-col-limpeza'
    WHEN 'em_limpeza' THEN 'room-col-limpeza'
    WHEN 'vistoria' THEN 'room-col-vistoria'
    WHEN 'aguardando_vistoria' THEN 'room-col-vistoria'
    WHEN 'manutencao' THEN 'room-col-manutencao'
    WHEN 'bloqueado' THEN 'room-col-bloqueado'
    ELSE 'room-col-outros'
  END;
$$;

CREATE OR REPLACE FUNCTION public.reception_room_column_to_status(p_column_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_column_id
    WHEN 'room-col-disponivel' THEN 'disponivel'
    WHEN 'room-col-ocupado' THEN 'ocupado'
    WHEN 'room-col-sujo' THEN 'sujo'
    WHEN 'room-col-limpeza' THEN 'limpeza'
    WHEN 'room-col-vistoria' THEN 'vistoria'
    WHEN 'room-col-manutencao' THEN 'manutencao'
    WHEN 'room-col-bloqueado' THEN 'bloqueado'
    WHEN 'room-col-outros' THEN 'outros'
    ELSE NULL
  END;
$$;

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

  v_column_id := public.reception_room_status_to_column(NEW.status);

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
    jsonb_build_object('room_id', NEW.id, 'relation_type', 'room_status_projection'),
    NOT COALESCE(NEW.ativo, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    board_id = EXCLUDED.board_id,
    column_id = EXCLUDED.column_id,
    titulo = EXCLUDED.titulo,
    descricao = EXCLUDED.descricao,
    departamento = EXCLUDED.departamento,
    room_number = EXCLUDED.room_number,
    metadata = EXCLUDED.metadata,
    is_archived = EXCLUDED.is_archived,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_room_to_reception_room_card ON public.quartos;
CREATE TRIGGER trg_sync_room_to_reception_room_card
AFTER INSERT OR UPDATE OF status, numero, nome, andar, ativo
ON public.quartos
FOR EACH ROW
EXECUTE FUNCTION public.sync_room_to_reception_room_card();

CREATE OR REPLACE FUNCTION public.sync_reception_room_card_to_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_room_id text;
BEGIN
  IF NEW.board_id <> 'kanban-board-recepcao-quartos' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.column_id IS NOT DISTINCT FROM NEW.column_id THEN
    RETURN NEW;
  END IF;

  v_status := public.reception_room_column_to_status(NEW.column_id);
  IF v_status IS NULL THEN
    RETURN NEW;
  END IF;

  v_room_id := NULLIF(NEW.metadata->>'room_id', '');

  IF v_room_id IS NOT NULL THEN
    UPDATE public.quartos
       SET status = v_status,
           updated_at = now()
     WHERE id::text = v_room_id
       AND status IS DISTINCT FROM v_status;
  ELSIF NEW.room_number IS NOT NULL THEN
    UPDATE public.quartos
       SET status = v_status,
           updated_at = now()
     WHERE numero::text = NEW.room_number::text
       AND status IS DISTINCT FROM v_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_reception_room_card_to_room ON public.kanban_cards;
CREATE TRIGGER trg_sync_reception_room_card_to_room
AFTER INSERT OR UPDATE OF column_id
ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.sync_reception_room_card_to_room();

-- Backfill idempotente dos quartos já cadastrados.
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
)
SELECT
  'room-rec-' || q.id::text,
  'default_hotel',
  'kanban-board-recepcao-quartos',
  public.reception_room_status_to_column(q.status),
  'Quarto ' || q.numero,
  COALESCE(NULLIF(q.nome, ''), 'Acomodação do hotel') || ' · ' || COALESCE(q.andar::text || 'º andar', 'andar não informado'),
  'normal',
  0,
  'recepcao',
  q.numero::text,
  jsonb_build_object('room_id', q.id, 'relation_type', 'room_status_projection'),
  NOT COALESCE(q.ativo, true)
FROM public.quartos q
ON CONFLICT (id) DO UPDATE SET
  board_id = EXCLUDED.board_id,
  column_id = EXCLUDED.column_id,
  titulo = EXCLUDED.titulo,
  descricao = EXCLUDED.descricao,
  departamento = EXCLUDED.departamento,
  room_number = EXCLUDED.room_number,
  metadata = EXCLUDED.metadata,
  is_archived = EXCLUDED.is_archived,
  updated_at = now();
