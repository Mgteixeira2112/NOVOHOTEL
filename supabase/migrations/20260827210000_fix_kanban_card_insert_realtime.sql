-- Correção de criação de cards: garante referências, acesso e publicação Realtime.
-- Idempotente e segura para execução sobre bancos já existentes.

-- Reforça as políticas necessárias para INSERT/SELECT/UPDATE/DELETE pelo cliente.
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kanban_boards_client_access ON public.kanban_boards;
DROP POLICY IF EXISTS kanban_columns_client_access ON public.kanban_columns;
DROP POLICY IF EXISTS kanban_cards_client_access ON public.kanban_cards;

CREATE POLICY kanban_boards_client_access
ON public.kanban_boards FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY kanban_columns_client_access
ON public.kanban_columns FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY kanban_cards_client_access
ON public.kanban_cards FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);

-- Garante que os IDs usados pelo cliente existam antes de qualquer INSERT de card.
INSERT INTO public.kanban_boards (id, hotel_id, nome, departamento, descricao, ativo)
VALUES
  ('kanban-default-board', 'default_hotel', 'Operação Geral', 'operacao', 'Quadro operacional unificado do hotel', true),
  ('kanban-board-governanca', 'default_hotel', 'Governança', 'governanca', 'Higienização e liberação de quartos', true),
  ('kanban-board-recepcao', 'default_hotel', 'Recepção', 'recepcao', 'Atendimentos e solicitações de hóspedes', true),
  ('kanban-board-manutencao', 'default_hotel', 'Manutenção', 'manutencao', 'Ordens de serviço e reparos técnicos', true),
  ('kanban-board-cozinha', 'default_hotel', 'Cozinha & Room Service', 'cozinha', 'Preparo e entrega de pedidos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.kanban_columns (id, board_id, nome, ordem)
VALUES
  ('kanban-default-column-entrada', 'kanban-default-board', 'Entrada', 0),
  ('kanban-default-column-andamento', 'kanban-default-board', 'Em andamento', 1),
  ('kanban-default-column-aguardando', 'kanban-default-board', 'Aguardando', 2),
  ('kanban-default-column-concluido', 'kanban-default-board', 'Concluído', 3),
  ('gov-col-a-limpar', 'kanban-board-governanca', 'A Limpar', 0),
  ('gov-col-em-limpeza', 'kanban-board-governanca', 'Em Limpeza', 1),
  ('gov-col-inspecao', 'kanban-board-governanca', 'Em Inspeção', 2),
  ('gov-col-liberado', 'kanban-board-governanca', 'Liberado', 3),
  ('rec-col-novos', 'kanban-board-recepcao', 'Novas Solicitações', 0),
  ('rec-col-atendimento', 'kanban-board-recepcao', 'Em Atendimento', 1),
  ('rec-col-pendente', 'kanban-board-recepcao', 'Aguardando Hóspede', 2),
  ('rec-col-finalizado', 'kanban-board-recepcao', 'Finalizado', 3),
  ('man-col-chamados', 'kanban-board-manutencao', 'Fila de Chamados', 0),
  ('man-col-reparo', 'kanban-board-manutencao', 'Em Execução', 1),
  ('man-col-pecas', 'kanban-board-manutencao', 'Aguardando Peças', 2),
  ('man-col-resolvido', 'kanban-board-manutencao', 'Resolvido', 3),
  ('coz-col-pedidos', 'kanban-board-cozinha', 'Novos Pedidos', 0),
  ('coz-col-preparo', 'kanban-board-cozinha', 'Em Preparo', 1),
  ('coz-col-pronto', 'kanban-board-cozinha', 'Pronto p/ Entrega', 2),
  ('coz-col-entregue', 'kanban-board-cozinha', 'Entregue', 3)
ON CONFLICT (id) DO NOTHING;

-- Realtime deve publicar INSERT, UPDATE e DELETE.
ALTER TABLE public.kanban_cards REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'kanban_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_cards;
  END IF;
END $$;
