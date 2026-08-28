-- Separa movimento manual no Kanban de Quartos de atualizações automáticas da projeção.
-- Não altera o motor Kanban; apenas impede que a projeção canônica escreva de volta
-- um estado antigo no quarto e desfaça a intenção do usuário.

CREATE OR REPLACE FUNCTION public.sync_reception_room_card_to_room()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_projected_status text;
BEGIN
  IF NEW.board_id <> 'kanban-board-recepcao-quartos'
     OR NEW.room_number IS NULL
     OR btrim(NEW.room_number) = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.column_id IS NOT DISTINCT FROM NEW.column_id THEN
    RETURN NEW;
  END IF;

  v_status := public.reception_room_column_to_status(NEW.column_id);
  IF v_status IS NULL THEN
    RETURN NEW;
  END IF;

  -- Quando refresh_room_operational_status reposiciona o card automaticamente,
  -- o metadata já contém exatamente o mesmo status canônico da nova coluna.
  -- Nesse caso o card é apenas uma projeção e NÃO deve escrever de volta no quarto.
  v_projected_status := public.normalize_room_operational_status(
    NULLIF(NEW.metadata->>'room_operational_status', '')
  );

  IF v_projected_status = public.normalize_room_operational_status(v_status) THEN
    RETURN NEW;
  END IF;

  -- Em uma movimentação manual, a coluna muda primeiro enquanto o metadata ainda
  -- contém o status canônico anterior. A divergência caracteriza intenção do usuário.
  UPDATE public.quartos q
     SET status = v_status,
         updated_at = now()
   WHERE (
        (NEW.room_id IS NOT NULL AND q.id::text = NEW.room_id::text)
        OR (NEW.metadata->>'room_id' IS NOT NULL AND q.id::text = NEW.metadata->>'room_id')
        OR q.numero::text = NEW.room_number::text
     )
     AND q.status IS DISTINCT FROM v_status;

  RETURN NEW;
END;
$$;

-- Recalcula a projeção após instalar a proteção, sem escrever de volta no quarto.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT numero::text AS numero FROM public.quartos LOOP
    PERFORM public.refresh_room_operational_status(r.numero);
  END LOOP;
END;
$$;
