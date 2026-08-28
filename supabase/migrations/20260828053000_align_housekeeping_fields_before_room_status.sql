-- Garante que os campos auxiliares de Governança acompanhem mudanças explícitas
-- do status do quarto antes dos triggers de projeção/realtime.

CREATE OR REPLACE FUNCTION public.align_housekeeping_fields_from_room_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  v_status := public.normalize_room_operational_status(NEW.status);

  CASE v_status
    WHEN 'sujo' THEN
      NEW.status_governanca := 'sujo';
      NEW.status_housekeeping := 'sujo';
    WHEN 'limpeza' THEN
      NEW.status_governanca := 'em_limpeza';
      NEW.status_housekeeping := 'em_limpeza';
    WHEN 'vistoria' THEN
      NEW.status_governanca := 'aguardando_vistoria';
      NEW.status_housekeeping := 'aguardando_vistoria';
    WHEN 'disponivel' THEN
      NEW.status_governanca := 'aprovado';
      NEW.status_housekeeping := 'aprovado';
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_align_housekeeping_fields_from_room_status ON public.quartos;
CREATE TRIGGER trg_align_housekeeping_fields_from_room_status
BEFORE INSERT OR UPDATE OF status
ON public.quartos
FOR EACH ROW
EXECUTE FUNCTION public.align_housekeeping_fields_from_room_status();
