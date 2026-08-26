-- Hotel OS: tenant/RBAC policies for persistent Kanban.
-- Access is delegated to the existing canonical usuario_pode_hotel(hotel_id)
-- contract; no broad USING (true) policies are introduced.

DROP POLICY IF EXISTS kanban_boards_select ON public.kanban_boards;
DROP POLICY IF EXISTS kanban_boards_insert ON public.kanban_boards;
DROP POLICY IF EXISTS kanban_boards_update ON public.kanban_boards;
DROP POLICY IF EXISTS kanban_boards_delete ON public.kanban_boards;

CREATE POLICY kanban_boards_select
  ON public.kanban_boards FOR SELECT TO authenticated
  USING (public.usuario_pode_hotel(hotel_id));

CREATE POLICY kanban_boards_insert
  ON public.kanban_boards FOR INSERT TO authenticated
  WITH CHECK (public.usuario_pode_hotel(hotel_id));

CREATE POLICY kanban_boards_update
  ON public.kanban_boards FOR UPDATE TO authenticated
  USING (public.usuario_pode_hotel(hotel_id))
  WITH CHECK (public.usuario_pode_hotel(hotel_id));

CREATE POLICY kanban_boards_delete
  ON public.kanban_boards FOR DELETE TO authenticated
  USING (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS kanban_cards_select ON public.kanban_cards;
DROP POLICY IF EXISTS kanban_cards_insert ON public.kanban_cards;
DROP POLICY IF EXISTS kanban_cards_update ON public.kanban_cards;
DROP POLICY IF EXISTS kanban_cards_delete ON public.kanban_cards;

CREATE POLICY kanban_cards_select
  ON public.kanban_cards FOR SELECT TO authenticated
  USING (public.usuario_pode_hotel(hotel_id));

CREATE POLICY kanban_cards_insert
  ON public.kanban_cards FOR INSERT TO authenticated
  WITH CHECK (
    public.usuario_pode_hotel(hotel_id)
    AND EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id AND b.hotel_id = hotel_id
    )
  );

CREATE POLICY kanban_cards_update
  ON public.kanban_cards FOR UPDATE TO authenticated
  USING (public.usuario_pode_hotel(hotel_id))
  WITH CHECK (
    public.usuario_pode_hotel(hotel_id)
    AND EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id AND b.hotel_id = hotel_id
    )
  );

CREATE POLICY kanban_cards_delete
  ON public.kanban_cards FOR DELETE TO authenticated
  USING (public.usuario_pode_hotel(hotel_id));

DROP POLICY IF EXISTS kanban_columns_select ON public.kanban_columns;
DROP POLICY IF EXISTS kanban_columns_insert ON public.kanban_columns;
DROP POLICY IF EXISTS kanban_columns_update ON public.kanban_columns;
DROP POLICY IF EXISTS kanban_columns_delete ON public.kanban_columns;

CREATE POLICY kanban_columns_select
  ON public.kanban_columns FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id
        AND public.usuario_pode_hotel(b.hotel_id)
    )
  );

CREATE POLICY kanban_columns_insert
  ON public.kanban_columns FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id
        AND public.usuario_pode_hotel(b.hotel_id)
    )
  );

CREATE POLICY kanban_columns_update
  ON public.kanban_columns FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id
        AND public.usuario_pode_hotel(b.hotel_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id
        AND public.usuario_pode_hotel(b.hotel_id)
    )
  );

CREATE POLICY kanban_columns_delete
  ON public.kanban_columns FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kanban_boards b
      WHERE b.id = board_id
        AND public.usuario_pode_hotel(b.hotel_id)
    )
  );
