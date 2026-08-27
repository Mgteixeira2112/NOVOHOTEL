import { supabase } from '../../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../../types/kanban';
import { mapDatabaseCardToKanbanCard, mapKanbanCardToDatabaseRow, mapDatabaseBoardToKanbanBoard, mapKanbanBoardToDatabaseRow, mapDatabaseColumnToKanbanColumn, mapKanbanColumnToDatabaseRow } from './kanbanMapper';
import { broadcastKanbanCardChange } from './kanbanBroadcast';
import { INITIAL_KANBAN_BOARDS, INITIAL_KANBAN_CARDS } from '../../data/mockKanbanData';

async function persistDefaultKanban(hotelId: string): Promise<void> {
  if (!hotelId) return;

  for (const board of INITIAL_KANBAN_BOARDS) {
    const { error: boardError } = await supabase
      .from('kanban_boards')
      .upsert(mapKanbanBoardToDatabaseRow(board, hotelId), { onConflict: 'id' });
    if (boardError) throw boardError;

    if (board.columns?.length) {
      const { error: columnsError } = await supabase
        .from('kanban_columns')
        .upsert(board.columns.map(mapKanbanColumnToDatabaseRow), { onConflict: 'id' });
      if (columnsError) throw columnsError;
    }
  }

  if (INITIAL_KANBAN_CARDS.length) {
    const { error: cardsError } = await supabase
      .from('kanban_cards')
      .upsert(INITIAL_KANBAN_CARDS.map(card => mapKanbanCardToDatabaseRow(card, hotelId)), { onConflict: 'id' });
    if (cardsError) throw cardsError;
  }
}

export const kanbanRepository = {
  async loadKanbanData(hotelId: string): Promise<{ boards: KanbanBoard[]; cards: KanbanCard[] }> {
    if (!hotelId) throw new Error('[KANBAN REPOSITORY] hotelId é obrigatório para carregar dados');

    const load = async () => {
      const [boardsResult, columnsResult, cardsResult] = await Promise.all([
        supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true).order('criado_em', { ascending: true }),
        supabase.from('kanban_columns').select('*').order('ordem', { ascending: true }),
        supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId).eq('is_archived', false).order('ordem', { ascending: true }).order('created_at', { ascending: false })
      ]);

      if (boardsResult.error) throw boardsResult.error;
      if (columnsResult.error) throw columnsResult.error;
      if (cardsResult.error) throw cardsResult.error;

      const boardIds = new Set((boardsResult.data || []).map((board: any) => String(board.id)));
      const columns = (columnsResult.data || [])
        .filter((row: any) => boardIds.has(String(row.board_id)))
        .map(mapDatabaseColumnToKanbanColumn);
      const boards = (boardsResult.data || []).map(row => mapDatabaseBoardToKanbanBoard(row, columns));
      const cards = (cardsResult.data || []).map(mapDatabaseCardToKanbanCard);
      return { boards, cards };
    };

    let result = await load();

    // First installation: persist the same defaults used by the UI and then
    // reload them from PostgreSQL so local mock state stops being authoritative.
    if (result.boards.length === 0 || result.cards.length === 0) {
      console.info(`[KANBAN SEED] Persistindo dados iniciais do Kanban para o hotel ${hotelId}`);
      await persistDefaultKanban(hotelId);
      result = await load();
    }

    console.info(`[SUPABASE LOAD SUCCESS] Hotel: ${hotelId} | Boards: ${result.boards.length} | Cards: ${result.cards.length}`);
    return result;
  },

  async updateCard(hotelId: string, card: KanbanCard): Promise<KanbanCard> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para updateCard');

    const mutationUpdatedAt = new Date().toISOString();
    const payload = mapKanbanCardToDatabaseRow({ ...card, updated_at: mutationUpdatedAt }, hotelId);
    const { id: _id, hotel_id: _hotelId, ...updatePayload } = payload;
    updatePayload.updated_at = mutationUpdatedAt;

    let query = supabase
      .from('kanban_cards')
      .update(updatePayload)
      .eq('id', card.id)
      .eq('hotel_id', hotelId);

    if (card.updated_at) {
      query = query.eq('updated_at', card.updated_at);
    }

    const { data, error } = await query.select('*').maybeSingle();
    if (error) {
      console.error('[SUPABASE UPDATE ERROR] Card:', card.id, error);
      throw error;
    }
    if (!data) {
      throw new Error(`[SUPABASE CONCURRENCY ERROR] Card ${card.id}: o registro foi alterado por outro cliente ou a versão local está desatualizada.`);
    }

    if (String(data.hotel_id) !== String(hotelId) || String(data.column_id) !== String(card.column_id) || String(data.board_id) !== String(card.board_id)) {
      throw new Error(`[SUPABASE UPDATE ERROR] Card ${card.id}: resposta persistida não corresponde ao estado solicitado.`);
    }

    const persistedCard = mapDatabaseCardToKanbanCard(data);
    card.updated_at = persistedCard.updated_at;
    console.info(`[SUPABASE UPDATE SUCCESS] Card: ${card.id} | coluna=${data.column_id} | updated_at=${data.updated_at}`);
    await broadcastKanbanCardChange(hotelId, 'UPDATE', persistedCard);
    return persistedCard;
  },

  async upsertCard(hotelId: string, card: KanbanCard): Promise<KanbanCard> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para upsertCard');

    const { data: existing, error: lookupError } = await supabase
      .from('kanban_cards')
      .select('id, updated_at')
      .eq('id', card.id)
      .eq('hotel_id', hotelId)
      .maybeSingle();

    if (lookupError) {
      console.error('[SUPABASE LOOKUP ERROR] Card:', card.id, lookupError);
      throw lookupError;
    }

    if (existing) {
      return kanbanRepository.updateCard(hotelId, card);
    }

    const mutationUpdatedAt = new Date().toISOString();
    const payload = mapKanbanCardToDatabaseRow({ ...card, updated_at: mutationUpdatedAt }, hotelId);
    const { data, error } = await supabase.from('kanban_cards').insert(payload).select('*').single();
    if (error) {
      console.error('[SUPABASE INSERT ERROR] Card:', card.id, error);
      throw error;
    }
    if (!data) throw new Error(`[SUPABASE INSERT ERROR] Card ${card.id}: Supabase não retornou o registro criado.`);

    const persistedCard = mapDatabaseCardToKanbanCard(data);
    card.updated_at = persistedCard.updated_at;
    console.info(`[SUPABASE INSERT SUCCESS] Card: ${card.id} | coluna=${data.column_id}`);
    await broadcastKanbanCardChange(hotelId, 'INSERT', persistedCard);
    return persistedCard;
  },

  async deleteCard(cardId: string): Promise<void> {
    if (!cardId) throw new Error('[KANBAN REPOSITORY] cardId é obrigatório para deleteCard');
    const { error } = await supabase.from('kanban_cards').delete().eq('id', cardId);
    if (error) throw error;
  },

  async upsertBoard(hotelId: string, board: KanbanBoard): Promise<void> {
    if (!hotelId || !board?.id) throw new Error('[KANBAN REPOSITORY] hotelId e board.id são obrigatórios para upsertBoard');
    const { error: boardError } = await supabase.from('kanban_boards').upsert(mapKanbanBoardToDatabaseRow(board, hotelId), { onConflict: 'id' });
    if (boardError) throw boardError;
    if (board.columns?.length) {
      const { error } = await supabase.from('kanban_columns').upsert(board.columns.map(mapKanbanColumnToDatabaseRow), { onConflict: 'id' });
      if (error) throw error;
    }
  },

  async deleteBoard(boardId: string): Promise<void> {
    if (!boardId) throw new Error('[KANBAN REPOSITORY] boardId é obrigatório para deleteBoard');
    const { error } = await supabase.from('kanban_boards').delete().eq('id', boardId);
    if (error) throw error;
  },

  async upsertColumn(column: KanbanColumn): Promise<void> {
    if (!column?.id || !column?.board_id) throw new Error('[KANBAN REPOSITORY] column.id e column.board_id são obrigatórios para upsertColumn');
    const { error } = await supabase.from('kanban_columns').upsert(mapKanbanColumnToDatabaseRow(column), { onConflict: 'id' });
    if (error) throw error;
  },

  async deleteColumn(columnId: string): Promise<void> {
    if (!columnId) throw new Error('[KANBAN REPOSITORY] columnId é obrigatório para deleteColumn');
    const { error } = await supabase.from('kanban_columns').delete().eq('id', columnId);
    if (error) throw error;
  },
};