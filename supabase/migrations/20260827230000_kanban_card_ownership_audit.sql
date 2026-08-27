-- Etapas 3/6 do plano Kanban: responsabilidade normalizada e auditoria.
-- Migração estritamente aditiva: não remove colunas, não altera o fluxo Realtime atual
-- e não muda as colunas/status existentes dos cards.

ALTER TABLE public.kanban_cards
  ADD COLUMN IF NOT EXISTS assigned_user_id text,
  ADD COLUMN IF NOT EXISTS created_by_user_id text,
  ADD COLUMN IF NOT EXISTS updated_by_user_id text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by_user_id text;

-- Migra o responsável já armazenado no JSON legado sem remover assigned_to.
UPDATE public.kanban_cards
SET assigned_user_id = NULLIF(assigned_to ->> 'id', '')
WHERE assigned_user_id IS NULL
  AND assigned_to IS NOT NULL
  AND jsonb_typeof(assigned_to) = 'object';

CREATE INDEX IF NOT EXISTS kanban_cards_assigned_user_idx
  ON public.kanban_cards(hotel_id, assigned_user_id)
  WHERE is_archived = false AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS kanban_cards_department_active_idx
  ON public.kanban_cards(hotel_id, departamento, board_id)
  WHERE is_archived = false AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.kanban_card_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hotel_id text NOT NULL,
  card_id text NOT NULL,
  user_id text,
  event_type text NOT NULL CHECK (event_type IN (
    'created',
    'updated',
    'moved',
    'assigned',
    'completed',
    'reopened',
    'deleted',
    'restored'
  )),
  from_value jsonb,
  to_value jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kanban_card_events_card_idx
  ON public.kanban_card_events(hotel_id, card_id, created_at DESC);

CREATE INDEX IF NOT EXISTS kanban_card_events_user_idx
  ON public.kanban_card_events(hotel_id, user_id, created_at DESC);

ALTER TABLE public.kanban_card_events ENABLE ROW LEVEL SECURITY;

-- Compatibilidade temporária com o cliente atual. A etapa final substituirá
-- esta policy por regras de hotel/perfil/setor antes de usar a auditoria como
-- mecanismo de autorização.
DROP POLICY IF EXISTS kanban_card_events_client_access ON public.kanban_card_events;
CREATE POLICY kanban_card_events_client_access
ON public.kanban_card_events
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

COMMENT ON COLUMN public.kanban_cards.assigned_user_id IS
  'Responsável normalizado. assigned_to permanece temporariamente para compatibilidade.';
COMMENT ON COLUMN public.kanban_cards.deleted_at IS
  'Marca exclusão lógica. A ativação do soft delete ocorrerá em etapa posterior.';
COMMENT ON TABLE public.kanban_card_events IS
  'Trilha de auditoria das ações operacionais executadas sobre cards Kanban.';
