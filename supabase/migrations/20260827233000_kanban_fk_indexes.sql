-- Índices aditivos recomendados pelo advisor do Supabase após a ativação
-- dos Kanbans e vínculos de setores. Não altera dados nem comportamento.

CREATE INDEX IF NOT EXISTS kanban_cards_column_idx
  ON public.kanban_cards(column_id);

CREATE INDEX IF NOT EXISTS usuario_operational_sectors_sector_idx
  ON public.usuario_operational_sectors(sector_id);
