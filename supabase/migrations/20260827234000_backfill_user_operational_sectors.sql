-- Backfill conservador dos setores operacionais com base no perfil existente.
-- Só atua em usuários sem qualquer setor configurado e nunca sobrescreve
-- associações manuais feitas em Equipe & Acessos.

INSERT INTO public.usuario_operational_sectors (
  hotel_id,
  usuario_id,
  sector_id,
  principal
)
SELECT
  'default_hotel',
  u.id::text,
  CASE u.tipo_usuario
    WHEN 'recepcionista' THEN 'default_hotel:recepcao'
    WHEN 'governanca' THEN 'default_hotel:governanca'
    WHEN 'cozinha_only' THEN 'default_hotel:cozinha'
    ELSE NULL
  END,
  true
FROM public.usuarios u
WHERE coalesce(u.ativo, true) = true
  AND u.tipo_usuario IN ('recepcionista','governanca','cozinha_only')
  AND NOT EXISTS (
    SELECT 1
    FROM public.usuario_operational_sectors existing
    WHERE existing.hotel_id = 'default_hotel'
      AND existing.usuario_id = u.id::text
  )
ON CONFLICT DO NOTHING;
