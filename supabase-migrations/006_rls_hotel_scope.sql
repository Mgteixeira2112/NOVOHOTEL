-- HOTEL OS — FASE DE SEGURANÇA: RLS por hotel.
-- Aplicar em staging e validar com usuários de hotéis diferentes antes de produção.
-- Não cria policies públicas e não remove policies legadas de tabelas que ainda possuem acesso permissivo.

CREATE OR REPLACE FUNCTION public.usuario_pode_hotel(p_hotel_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid()
      AND u.ativo = TRUE
      AND (u.hotel_id = p_hotel_id OR COALESCE(u.papel_rbac, '') = 'SUPER_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_papel(p_papeis TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid()
      AND u.ativo = TRUE
      AND (
        COALESCE(u.papel_rbac, '') = ANY(p_papeis)
        OR COALESCE(u.papel_rbac, '') = 'SUPER_ADMIN'
      )
  );
$$;

-- Helper para a camada de aplicação consultar o contexto sem expor senha.
CREATE OR REPLACE FUNCTION public.contexto_usuario_atual()
RETURNS JSONB
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'usuario_id', u.id,
        'auth_user_id', u.auth_user_id,
        'hotel_id', u.hotel_id,
        'organizacao_id', u.organizacao_id,
        'papel', COALESCE(u.papel_rbac, UPPER(u.tipo_usuario::text)),
        'permissoes', COALESCE(u.permissoes_json, '{}'::jsonb)
      )
      FROM public.usuarios u
      WHERE u.auth_user_id = auth.uid() AND u.ativo = TRUE
      LIMIT 1
    ),
    '{}'::jsonb
  );
$$;

-- PDV: somente usuários pertencentes ao hotel podem ler/escrever pedidos e produtos.
DROP POLICY IF EXISTS pdv_produtos_hotel_select ON public.pdv_produtos;
CREATE POLICY pdv_produtos_hotel_select ON public.pdv_produtos
FOR SELECT TO authenticated USING (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS pdv_produtos_hotel_write ON public.pdv_produtos;
CREATE POLICY pdv_produtos_hotel_write ON public.pdv_produtos
FOR ALL TO authenticated USING (public.usuario_tem_papel(ARRAY['SUPER_ADMIN','ADMIN_HOTEL','GERENTE','PDV']))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS pdv_pedidos_hotel_access ON public.pdv_pedidos;
CREATE POLICY pdv_pedidos_hotel_access ON public.pdv_pedidos
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS pdv_pagamentos_hotel_access ON public.pdv_pagamentos;
CREATE POLICY pdv_pagamentos_hotel_access ON public.pdv_pagamentos
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

-- Dispositivos e sessões de tablet são sempre limitados ao hotel do dispositivo/sessão.
DROP POLICY IF EXISTS tablet_dispositivos_hotel_access ON public.tablet_dispositivos;
CREATE POLICY tablet_dispositivos_hotel_access ON public.tablet_dispositivos
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS tablet_sessoes_hotel_access ON public.tablet_sessoes;
CREATE POLICY tablet_sessoes_hotel_access ON public.tablet_sessoes
FOR ALL TO authenticated
USING (public.usuario_pode_hotel(hotel_id))
WITH CHECK (public.usuario_pode_hotel(hotel_id));

-- Catálogo RBAC: leitura autenticada; alterações administrativas serão feitas por funções protegidas.
