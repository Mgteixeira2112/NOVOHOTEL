-- Mantém o Kanban de Quartos consistente quando um quarto é excluído.
-- Camada externa ao motor Kanban: remove apenas a projeção vinculada ao cadastro do quarto.

CREATE OR REPLACE FUNCTION public.cleanup_reception_room_card_on_room_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.kanban_cards
   WHERE board_id = 'kanban-board-recepcao-quartos'
     AND (
       metadata->>'room_id' = OLD.id::text
       OR id = 'room-rec-' || OLD.id::text
     );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_reception_room_card_on_room_delete ON public.quartos;
CREATE TRIGGER trg_cleanup_reception_room_card_on_room_delete
AFTER DELETE ON public.quartos
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_reception_room_card_on_room_delete();
