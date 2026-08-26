-- HOTEL OS: checkout -> governança operational event.
-- The application calls registrar_checkout_governanca after a successful checkout.
-- The event is idempotent per hotel/reservation and never creates duplicate cards.

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS reservation_id TEXT REFERENCES public.reservas(id) ON DELETE SET NULL;

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS room_id TEXT REFERENCES public.quartos(id) ON DELETE SET NULL;

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS source_event_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_kanban_cards_hotel_source_event
  ON public.kanban_cards(hotel_id, source_event_key)
  WHERE source_event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kanban_cards_reservation
  ON public.kanban_cards(reservation_id);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_room
  ON public.kanban_cards(room_id);

CREATE OR REPLACE FUNCTION public.registrar_checkout_governanca(
  p_hotel_id UUID,
  p_reserva_id TEXT,
  p_prioridade TEXT DEFAULT 'normal',
  p_sla_minutes INTEGER DEFAULT 45
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_id UUID;
  v_room_id TEXT;
  v_room_number TEXT;
  v_board_id UUID;
  v_column_id UUID;
  v_event_key TEXT;
  v_priority TEXT;
BEGIN
  IF NOT public.usuario_pode_hotel(p_hotel_id) THEN
    RAISE EXCEPTION 'Usuário sem acesso ao hotel';
  END IF;

  IF p_reserva_id IS NULL THEN
    RAISE EXCEPTION 'Reserva obrigatória para checkout operacional';
  END IF;

  SELECT r.quarto_id INTO v_room_id
  FROM public.reservas r
  WHERE r.id = p_reserva_id
    AND r.hotel_id = p_hotel_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reserva não encontrada para o hotel';
  END IF;

  SELECT q.numero INTO v_room_number
  FROM public.quartos q
  WHERE q.id = v_room_id
    AND q.hotel_id = p_hotel_id;

  v_event_key := 'checkout:governanca:' || p_reserva_id;
  v_priority := CASE
    WHEN lower(coalesce(p_prioridade, 'normal')) IN ('critica','crítica','alta','normal','baixa')
      THEN lower(coalesce(p_prioridade, 'normal'))
    ELSE 'normal'
  END;

  SELECT id INTO v_card_id
  FROM public.kanban_cards
  WHERE hotel_id = p_hotel_id
    AND source_event_key = v_event_key;

  IF FOUND THEN
    RETURN v_card_id;
  END IF;

  SELECT b.id INTO v_board_id
  FROM public.kanban_boards b
  WHERE b.hotel_id = p_hotel_id
    AND b.ativo = TRUE
    AND lower(b.departamento) IN ('governança','governanca')
  ORDER BY b.criado_em
  LIMIT 1;

  IF v_board_id IS NULL THEN
    RAISE EXCEPTION 'Quadro de Governança não configurado para este hotel';
  END IF;

  SELECT c.id INTO v_column_id
  FROM public.kanban_columns c
  WHERE c.board_id = v_board_id
  ORDER BY c.ordem ASC
  LIMIT 1;

  IF v_column_id IS NULL THEN
    RAISE EXCEPTION 'Quadro de Governança não possui colunas';
  END IF;

  INSERT INTO public.kanban_cards (
    hotel_id,
    board_id,
    column_id,
    titulo,
    descricao,
    prioridade,
    ordem,
    departamento,
    room_number,
    location,
    assigned_to,
    checklist,
    comments,
    metadata,
    reservation_id,
    room_id,
    sla_due_at,
    source_event_key
  ) VALUES (
    p_hotel_id,
    v_board_id,
    v_column_id,
    'Limpeza pós-checkout — quarto ' || coalesce(v_room_number, v_room_id),
    'Tarefa criada automaticamente após o checkout da reserva ' || p_reserva_id || '.',
    v_priority,
    extract(epoch from clock_timestamp()),
    'governança',
    v_room_number,
    'quarto ' || coalesce(v_room_number, v_room_id),
    NULL,
    jsonb_build_array(
      jsonb_build_object('id','retirar-lixo','label','Retirar lixo','done',false),
      jsonb_build_object('id','retirar-enxoval','label','Retirar enxoval','done',false),
      jsonb_build_object('id','arrumar-cama','label','Arrumar cama','done',false),
      jsonb_build_object('id','limpar-banheiro','label','Limpar banheiro','done',false),
      jsonb_build_object('id','repor-amenities','label','Repor amenities','done',false),
      jsonb_build_object('id','conferir-frigobar','label','Conferir frigobar','done',false),
      jsonb_build_object('id','inspecao-final','label','Inspeção final','done',false)
    ),
    '[]'::jsonb,
    jsonb_build_object(
      'source','checkout',
      'event_key',v_event_key,
      'reservation_id',p_reserva_id,
      'room_id',v_room_id
    ),
    p_reserva_id,
    v_room_id,
    NOW() + make_interval(mins => greatest(coalesce(p_sla_minutes,45), 1)),
    v_event_key
  )
  ON CONFLICT (hotel_id, source_event_key) WHERE source_event_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_card_id;

  IF v_card_id IS NULL THEN
    SELECT id INTO v_card_id
    FROM public.kanban_cards
    WHERE hotel_id = p_hotel_id
      AND source_event_key = v_event_key;
  END IF;

  RETURN v_card_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_checkout_governanca(UUID,TEXT,TEXT,INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_checkout_governanca(UUID,TEXT,TEXT,INTEGER) TO authenticated;
