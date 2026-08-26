-- HOTEL OS — REALTIME: publicação das tabelas operacionais do PDV.
-- O cliente deve aplicar filtros por hotel e permissões; Realtime não substitui RLS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pdv_pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pdv_pedidos;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'pdv_itens_pedido'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pdv_itens_pedido;
  END IF;
END $$;
