-- HOTEL OS: Consolidação de Schema e Integridade Referencial
-- Migration 024: Alinhamento de colunas, tipos, índices de tenant (hotel_id) e padronização de TIMESTAMPTZ

-- 1. Garantia de extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Alinhamento de hotel_id em media_uploads e tabelas auxiliares
ALTER TABLE IF EXISTS public.media_uploads ADD COLUMN IF NOT EXISTS hotel_id UUID;
ALTER TABLE IF EXISTS public.media_uploads ADD COLUMN IF NOT EXISTS organizacao_id UUID;

-- 3. Índices de tenant para busca rápida e isolamento RLS
CREATE INDEX IF NOT EXISTS idx_media_uploads_hotel ON public.media_uploads(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bloqueios_hotel ON public.bloqueios(hotel_id);
CREATE INDEX IF NOT EXISTS idx_automacoes_hotel ON public.automacoes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_logs_seguranca_hotel ON public.logs_seguranca(hotel_id);

-- 4. Garantia de integridade referencial segura (Foreign Keys não-bloqueantes)
DO $$
BEGIN
  -- Foreign key tipo_quarto_id em quartos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_quartos_tipo_quarto' AND table_name = 'quartos'
  ) THEN
    ALTER TABLE public.quartos 
      ADD CONSTRAINT fk_quartos_tipo_quarto 
      FOREIGN KEY (tipo_quarto_id) REFERENCES public.tipos_quarto(id) ON DELETE SET NULL;
  END IF;

  -- Foreign key quarto_id em bloqueios
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_bloqueios_quarto' AND table_name = 'bloqueios'
  ) THEN
    ALTER TABLE public.bloqueios 
      ADD CONSTRAINT fk_bloqueios_quarto 
      FOREIGN KEY (quarto_id) REFERENCES public.quartos(id) ON DELETE CASCADE;
  END IF;

  -- Foreign key room_id em media_uploads
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_media_uploads_room' AND table_name = 'media_uploads'
  ) THEN
    ALTER TABLE public.media_uploads 
      ADD CONSTRAINT fk_media_uploads_room 
      FOREIGN KEY (room_id) REFERENCES public.quartos(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 5. Padronização de TIMESTAMPTZ para colunas temporais
ALTER TABLE IF EXISTS public.hotel_config ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::timestamptz;
ALTER TABLE IF EXISTS public.tipos_quarto ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.quartos ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::timestamptz;
ALTER TABLE IF EXISTS public.hospedes ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.reservas ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.pagamentos ALTER COLUMN data_pagamento TYPE TIMESTAMPTZ USING data_pagamento::timestamptz;
ALTER TABLE IF EXISTS public.bloqueios ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.automacoes ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN ultimo_acesso TYPE TIMESTAMPTZ USING ultimo_acesso::timestamptz;
ALTER TABLE IF EXISTS public.logs_seguranca ALTER COLUMN timestamp TYPE TIMESTAMPTZ USING timestamp::timestamptz;
ALTER TABLE IF EXISTS public.media_uploads ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at::timestamptz;
ALTER TABLE IF EXISTS public.media_uploads ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at::timestamptz;

-- 6. Política RLS com isolamento por hotel para media_uploads
DROP POLICY IF EXISTS "media_uploads_tenant_select" ON public.media_uploads;
CREATE POLICY "media_uploads_tenant_select" ON public.media_uploads
  FOR SELECT TO authenticated
  USING (hotel_id IS NULL OR public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS "media_uploads_tenant_write" ON public.media_uploads;
CREATE POLICY "media_uploads_tenant_write" ON public.media_uploads
  FOR ALL TO authenticated
  USING (hotel_id IS NULL OR public.usuario_pode_hotel(hotel_id))
  WITH CHECK (hotel_id IS NULL OR public.usuario_pode_hotel(hotel_id));
