-- HOTEL OS — RESERVAS: busca por período, capacidade e composição de camas.
-- A função é somente de leitura e não substitui a confirmação transacional da reserva.

CREATE OR REPLACE FUNCTION public.buscar_quartos_disponiveis(
  p_hotel_id UUID,
  p_checkin TIMESTAMPTZ,
  p_checkout TIMESTAMPTZ,
  p_hospedes INTEGER DEFAULT 1,
  p_tipo_cama TEXT DEFAULT NULL
)
RETURNS TABLE (
  quarto_id TEXT,
  numero TEXT,
  capacidade INTEGER,
  camas JSONB
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    q.id,
    q.numero,
    q.capacidade,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object('tipo', qc.tipo, 'quantidade', qc.quantidade))
      FROM public.quarto_camas qc
      WHERE qc.quarto_id = q.id
    ), '[]'::jsonb) AS camas
  FROM public.quartos q
  WHERE q.hotel_id = p_hotel_id
    AND COALESCE(q.capacidade, 0) >= GREATEST(p_hospedes, 1)
    AND (
      p_tipo_cama IS NULL OR EXISTS (
        SELECT 1 FROM public.quarto_camas qc
        WHERE qc.quarto_id = q.id AND qc.tipo = p_tipo_cama
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.reservas r
      WHERE r.hotel_id = p_hotel_id
        AND r.quarto_id = q.id
        AND COALESCE(r.status, '') NOT IN ('cancelada','cancelado')
        AND r.checkin < p_checkout
        AND r.checkout > p_checkin
    );
$$;
