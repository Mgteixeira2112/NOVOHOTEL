-- Etapa 2 do plano Kanban: setores operacionais por usuário.
-- Migração aditiva: não altera kanban_cards, kanban_columns nem kanban_boards.

CREATE TABLE IF NOT EXISTS public.operational_sectors (
  id text PRIMARY KEY,
  hotel_id text NOT NULL DEFAULT 'default_hotel',
  codigo text NOT NULL,
  nome text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, codigo)
);

CREATE TABLE IF NOT EXISTS public.usuario_operational_sectors (
  hotel_id text NOT NULL DEFAULT 'default_hotel',
  usuario_id text NOT NULL,
  sector_id text NOT NULL REFERENCES public.operational_sectors(id) ON DELETE CASCADE,
  principal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hotel_id, usuario_id, sector_id)
);

CREATE INDEX IF NOT EXISTS operational_sectors_hotel_idx
  ON public.operational_sectors(hotel_id, ativo, ordem);

CREATE INDEX IF NOT EXISTS usuario_operational_sectors_user_idx
  ON public.usuario_operational_sectors(hotel_id, usuario_id);

CREATE UNIQUE INDEX IF NOT EXISTS usuario_operational_sectors_one_principal_idx
  ON public.usuario_operational_sectors(hotel_id, usuario_id)
  WHERE principal = true;

INSERT INTO public.operational_sectors (id, hotel_id, codigo, nome, descricao, ordem, ativo)
VALUES
  ('default_hotel:operacao', 'default_hotel', 'operacao', 'Operação Geral', 'Visão transversal da operação do hotel.', 0, true),
  ('default_hotel:governanca', 'default_hotel', 'governanca', 'Governança', 'Limpeza, inspeção, enxoval e liberação de acomodações.', 1, true),
  ('default_hotel:recepcao', 'default_hotel', 'recepcao', 'Recepção', 'Atendimento, check-in, check-out e solicitações de hóspedes.', 2, true),
  ('default_hotel:manutencao', 'default_hotel', 'manutencao', 'Manutenção', 'Chamados, reparos e ordens de serviço técnicas.', 3, true),
  ('default_hotel:cozinha', 'default_hotel', 'cozinha', 'Cozinha & Room Service', 'Pedidos, preparo e entrega de alimentos e bebidas.', 4, true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  ordem = EXCLUDED.ordem,
  ativo = EXCLUDED.ativo,
  updated_at = now();

ALTER TABLE public.operational_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_operational_sectors ENABLE ROW LEVEL SECURITY;

-- Políticas temporárias de compatibilidade com o cliente atual.
-- A etapa final do plano substituirá estas regras por RLS baseado em hotel/perfil/setor.
DROP POLICY IF EXISTS operational_sectors_client_access ON public.operational_sectors;
CREATE POLICY operational_sectors_client_access
ON public.operational_sectors
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS usuario_operational_sectors_client_access ON public.usuario_operational_sectors;
CREATE POLICY usuario_operational_sectors_client_access
ON public.usuario_operational_sectors
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);
