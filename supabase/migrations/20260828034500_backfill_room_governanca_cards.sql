-- Garante um card operacional de Governança para quartos que já possuem estado de housekeeping.
-- Não duplica quartos que já tenham card ativo e não altera o motor Kanban.

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
  completed_at,
  is_archived
)
SELECT
  'room-gov-' || q.id::text,
  'default_hotel',
  'kanban-board-governanca',
  CASE lower(COALESCE(q.status_governanca, q.status_housekeeping, q.status))
    WHEN 'sujo' THEN 'gov-col-a-limpar'
    WHEN 'limpeza' THEN 'gov-col-em-limpeza'
    WHEN 'em_limpeza' THEN 'gov-col-em-limpeza'
    WHEN 'vistoria' THEN 'gov-col-inspecao'
    WHEN 'aguardando_vistoria' THEN 'gov-col-inspecao'
    WHEN 'inspecionado' THEN 'gov-col-liberado'
    WHEN 'aprovado' THEN 'gov-col-liberado'
    WHEN 'limpo' THEN 'gov-col-liberado'
  END,
  'Quarto ' || q.numero || ' · Governança',
  'Card operacional vinculado ao cadastro do quarto para sincronização em tempo real.',
  'normal',
  0,
  'governanca',
  q.numero::text,
  jsonb_build_object('room_id', q.id, 'relation_type', 'room_operational_source'),
  CASE
    WHEN lower(COALESCE(q.status_governanca, q.status_housekeeping, q.status)) IN ('inspecionado', 'aprovado', 'limpo')
    THEN COALESCE(q.ultima_limpeza, now())
    ELSE NULL
  END,
  false
FROM public.quartos q
WHERE lower(COALESCE(q.status_governanca, q.status_housekeeping, q.status)) IN (
  'sujo', 'limpeza', 'em_limpeza', 'vistoria', 'aguardando_vistoria', 'inspecionado', 'aprovado', 'limpo'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.kanban_cards c
  WHERE c.board_id = 'kanban-board-governanca'
    AND c.room_number::text = q.numero::text
    AND COALESCE(c.is_archived, false) = false
)
ON CONFLICT (id) DO NOTHING;
