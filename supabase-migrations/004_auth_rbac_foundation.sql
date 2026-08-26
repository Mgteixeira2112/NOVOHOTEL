-- HOTEL OS — FASES 2/7: Auth/RBAC foundation.
-- Não remove policies legadas nesta etapa.

CREATE OR REPLACE FUNCTION public.current_user_hotel_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.hotel_id
  FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
    AND u.ativo = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.tipo_usuario::TEXT
  FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
    AND u.ativo = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_member(target_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT target_hotel_id IS NOT NULL
     AND target_hotel_id = public.current_user_hotel_id();
$$;

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id
  ON public.usuarios(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_hotel_active
  ON public.usuarios(auth_user_id, hotel_id)
  WHERE ativo = TRUE;

-- Permite leitura apenas do próprio vínculo de autenticação.
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS usuarios_select_self ON public.usuarios;
CREATE POLICY usuarios_select_self
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Escritas administrativas serão adicionadas após a migração completa do RBAC.
COMMENT ON FUNCTION public.current_user_hotel_id() IS 'Resolve o hotel do usuário autenticado para políticas RLS.';
COMMENT ON FUNCTION public.current_user_role() IS 'Resolve o papel do usuário autenticado para autorização server-side.';
