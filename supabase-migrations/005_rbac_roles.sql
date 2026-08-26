-- HOTEL OS — RBAC: catálogo de papéis e helpers de autorização.
-- Migração aditiva; não remove o campo senha nem policies legadas.

CREATE TABLE IF NOT EXISTS public.rbac_papeis (
  codigo TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  nivel INTEGER NOT NULL DEFAULT 0,
  exclusivo BOOLEAN NOT NULL DEFAULT FALSE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO public.rbac_papeis (codigo,nome,descricao,nivel,exclusivo) VALUES
('SUPER_ADMIN','Super Administrador','Acesso global da plataforma',100,FALSE),
('ADMIN_HOTEL','Administrador do Hotel','Administração completa do hotel',90,FALSE),
('GERENTE','Gerente','Gestão operacional e administrativa',80,FALSE),
('RECEPCAO','Recepção','Operação de recepção e hospedagem',50,FALSE),
('RESERVAS','Reservas','Gestão de reservas e disponibilidade',50,FALSE),
('FINANCEIRO','Financeiro','Financeiro e caixa',60,FALSE),
('HOUSEKEEPING','Governança','Limpeza, inspeção e liberação de quartos',40,FALSE),
('MANUTENCAO','Manutenção','Chamados e manutenção',40,FALSE),
('COZINHA','Cozinha','Produção e KDS',40,FALSE),
('PDV','PDV','Operação de ponto de venda',40,FALSE),
('PDV_ONLY','PDV exclusivo','Acesso somente ao PDV',35,TRUE),
('TABLET','Tablet','Dispositivo de quarto',10,TRUE)
ON CONFLICT (codigo) DO UPDATE SET nome=EXCLUDED.nome, descricao=EXCLUDED.descricao, nivel=EXCLUDED.nivel, exclusivo=EXCLUDED.exclusivo, ativo=TRUE;

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS papel_rbac TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS permissoes_json JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_usuarios_papel_rbac ON public.usuarios(papel_rbac);

CREATE OR REPLACE FUNCTION public.usuario_atual()
RETURNS TABLE (usuario_id TEXT, hotel_id UUID, organizacao_id UUID, papel TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.id, u.hotel_id, u.organizacao_id, COALESCE(u.papel_rbac, UPPER(u.tipo_usuario::text))
  FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
    AND u.ativo = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.usuario_pertence_hotel(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid()
      AND u.ativo = TRUE
      AND (u.hotel_id = p_hotel_id OR u.papel_rbac = 'SUPER_ADMIN')
  );
$$;

ALTER TABLE public.rbac_papeis ENABLE ROW LEVEL SECURITY;

-- Catálogo é legível apenas por usuários autenticados. Escrita ficará restrita
-- à camada administrativa quando o RBAC server-side estiver ativo.
CREATE POLICY rbac_papeis_select_authenticated
ON public.rbac_papeis FOR SELECT
TO authenticated
USING (TRUE);
