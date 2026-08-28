-- Sincronização inversa Quarto -> Governança.
-- Mantém o motor Kanban intacto e usa apenas projeção de domínio no banco.

CREATE OR REPLACE FUNCTION public.project_room_status_to_governanca()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_column_id text;
  v_housekeeping text;
BEGIN
  v_status := public.normalize_room_operational_status(NEW.status);

  v_column_id := CASE v_status
    WHEN 'sujo' THEN 'gov-col-a-limpar'
    WHEN 'limpeza' THEN 'gov-col-em-limpeza'
    WHEN 'vistoria' THEN 'gov-col-inspecao'
    WHEN 'disponivel' THEN 'gov-col-liberado'
    ELSE NULL
  END;

  v_housekeeping := CASE v_status
    WHEN 'sujo' THEN 'sujo'
    WHEN 'limpeza' THEN 'em_limpeza'
    WHEN 'vistoria' THEN 'aguardando_vistoria'
    WHEN 'disponivel' THEN 'aprovado'
    ELSE NULL
  END;

  -- Ocupado, manutenção e bloqueado são estados operacionais globais e não
  -- reposicionam o fluxo da Governança. A etapa atual da Governança é preservada.
  IF v_column_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.kanban_cards (
    id, hotel_id, board_id, column_id, titulo, descricao, prioridade, ordem,
    departamento, room_number, room_id, task_context_type, target_sector,
    metadata, is_archived
  ) VALUES (
    'room-gov-' || NEW.id::text,
    'default_hotel',
    'kanban-board-governanca',
    v_column_id,
    'Quarto ' || NEW.numero || ' · Governança',
    'Fluxo operacional de Governança do Quarto ' || NEW.numero,
    'normal',
    0,
    'governanca',
    NEW.numero::text,
    NEW.id::text,
    'room',
    'governanca',
    jsonb_build_object(
      'room_id', NEW.id::text,
      'relation_type', 'room_operational_source',
      'task_context_type', 'room',
      'target_sector', 'governanca'
    ),
    NOT COALESCE(NEW.ativo, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    board_id = EXCLUDED.board_id,
    column_id = EXCLUDED.column_id,
    titulo = EXCLUDED.titulo,
    descricao = COALESCE(public.kanban_cards.descricao, EXCLUDED.descricao),
    departamento = 'governanca',
    room_number = EXCLUDED.room_number,
    room_id = EXCLUDED.room_id,
    target_sector = 'governanca',
    task_context_type = CASE
      WHEN public.kanban_cards.assigned_user_id IS NOT NULL THEN 'user_room'
      ELSE 'room'
    END,
    metadata = COALESCE(public.kanban_cards.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'room_id', NEW.id::text,
        'relation_type', 'room_operational_source',
        'target_sector', 'governanca',
        'task_context_type', CASE WHEN public.kanban_cards.assigned_user_id IS NOT NULL THEN 'user_room' ELSE 'room' END
      ),
    is_archived = NOT COALESCE(NEW.ativo, true),
    completed_at = CASE WHEN v_column_id = 'gov-col-liberado' THEN public.kanban_cards.completed_at ELSE NULL END,
    updated_at = now();

  -- Mantém os campos específicos de Governança coerentes com a alteração explícita
  -- do status do quarto. O trigger Governança -> Quarto reforça a mesma informação.
  UPDATE public.quartos q
     SET status_governanca = v_housekeeping,
         status_housekeeping = v_housekeeping
   WHERE q.id::text = NEW.id::text
     AND (q.status_governanca IS DISTINCT FROM v_housekeeping
       OR q.status_housekeeping IS DISTINCT FROM v_housekeeping);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_room_status_to_governanca ON public.quartos;
CREATE TRIGGER trg_project_room_status_to_governanca
AFTER INSERT OR UPDATE OF status, numero, ativo
ON public.quartos
FOR EACH ROW
EXECUTE FUNCTION public.project_room_status_to_governanca();

-- O status explicitamente escolhido para Sujo/Limpeza/Vistoria deve ser respeitado
-- antes de um estado antigo de Governança marcado como aprovado.
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
  SELECT * INTO v_room FROM public.quartos q WHERE q.numero::text = p_room_number::text LIMIT 1;
  IF NOT FOUND THEN RETURN 'outros'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.kanban_cards c
    WHERE c.board_id = 'kanban-board-manutencao'
      AND c.room_number::text = p_room_number::text
      AND COALESCE(c.is_archived, false) = false
      AND c.column_id <> 'man-col-resolvido'
  ) INTO v_has_maintenance;
  IF v_has_maintenance THEN RETURN 'manutencao'; END IF;

  v_base := public.normalize_room_operational_status(v_room.status);
  IF v_base = 'bloqueado' THEN RETURN 'bloqueado'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.reservas r
    WHERE r.quarto_id::text = v_room.id::text AND r.status = 'checkin_realizado'
  ) INTO v_has_checkin;
  IF v_has_checkin THEN RETURN 'ocupado'; END IF;

  -- Uma mudança explícita do quarto para um estado operacional de Governança
  -- inicia/atualiza o fluxo correspondente e não pode ser anulada por "aprovado" antigo.
  IF v_base IN ('sujo', 'limpeza', 'vistoria') THEN RETURN v_base; END IF;

  v_housekeeping := public.normalize_room_operational_status(COALESCE(v_room.status_governanca, v_room.status_housekeeping));
  IF v_housekeeping IN ('sujo', 'limpeza', 'vistoria') THEN RETURN v_housekeeping; END IF;
  IF v_housekeeping = 'disponivel' THEN RETURN 'disponivel'; END IF;
  IF v_base IN ('ocupado', 'disponivel', 'manutencao', 'bloqueado') THEN RETURN v_base; END IF;
  RETURN 'outros';
END;
$$;
