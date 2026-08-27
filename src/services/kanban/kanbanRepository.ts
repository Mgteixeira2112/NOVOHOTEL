import { supabase } from '../../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../../types/kanban';
import { mapDatabaseCardToKanbanCard, mapKanbanCardToDatabaseRow, mapDatabaseBoardToKanbanBoard, mapKanbanBoardToDatabaseRow, mapDatabaseColumnToKanbanColumn, mapKanbanColumnToDatabaseRow } from './kanbanMapper';

export const kanbanRepository = {
  async loadKanbanData(hotelId: string): Promise<{ boards: KanbanBoard[]; cards: KanbanCard[] }> {
    if (!hotelId) throw new Error('[KANBAN REPOSITORY] hotelId é obrigatório para carregar dados');
    const [boardsResult, columnsResult, cardsResult] = await Promise.all([
      supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true).order('criado_em', { ascending: true }),
      supabase.from('kanban_columns').select('*').order('ordem', { ascending: true }),
      supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId).eq('is_archived', false).order('ordem', { ascending: true }).order('created_at', { ascending: false })
    ]);
    if (boardsResult.error) throw boardsResult.error;
    if (columnsResult.error) throw columnsResult.error;
    if (cardsResult.error) throw cardsResult.error;
    const columns = (columnsResult.data || []).map(mapDatabaseColumnToKanbanColumn);
    const boards = (boardsResult.data || []).map(row => mapDatabaseBoardToKanbanBoard(row, columns));
    const cards = (cardsResult.data || []).map(mapDatabaseCardToKanbanCard);
    console.info(`[SUPABASE LOAD SUCCESS] Hotel: ${hotelId} | Boards: ${boards.length} | Colunas: ${columns.length} | Cards: ${cards.length}`);
    return { boards, cards };
  },

  /** Atualiza um card existente. O filtro hotel_id impede alterar outro hotel. */
  async updateCard(hotelId: string, card: KanbanCard): Promise<void> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para updateCard');
    const payload = mapKanbanCardToDatabaseRow(card, hotelId);
    const { id: _id, hotel_id: _hotelId, ...updatePayload } = payload;
    const { data, error } = await supabase.from('kanban_cards').update(updatePayload).eq('id', card.id).eq('hotel_id', hotelId).select('id, hotel_id, board_id, column_id, updated_at').single();
    if (error) { console.error('[SUPABASE UPDATE ERROR] Card:', card.id, error); throw error; }
    if (!data) throw new Error(`[SUPABASE UPDATE ERROR] Card ${card.id}: nenhum registro foi atualizado.`);
    if (String(data.hotel_id) !== String(hotelId) || String(data.column_id) !== String(card.column_id) || String(data.board_id) !== String(card.board_id)) {
      throw new Error(`[SUPABASE UPDATE ERROR] Card ${card.id}: resposta persistida não corresponde ao estado solicitado.`);
    }
    console.info(`[SUPABASE UPDATE SUCCESS] Card: ${card.id} | coluna=${data.column_id} | updated_at=${data.updated_at}`);
  },

  /** Upsert para criação/sincronização. Cards que já existem usam UPDATE para o Drag & Drop não depender de upsert. */
  async upsertCard(hotelId: string, card: KanbanCard): Promise<void> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para upsertCard');

    const { data: existing, error: lookupError } = await supabase.from('kanban_cards').select('id').eq('id', card.id).eq('hotel_id', hotelId).maybeSingle();
    if (lookupError) { console.error('[SUPABASE LOOKUP ERROR] Card:', card.id, lookupError); throw lookupError; }

    if (existing) {
      await this.updateCard(hotelId, card);
      return;
    }

    const payload = mapKanbanCardToDatabaseRow(card, hotelId);
    const { data, error } = await supabase.from('kanban_cards').insert(payload).select('id, hotel_id, board_id, column_id, updated_at').single();
    if (error) { console.error('[SUPABASE INSERT ERROR] Card:', card.id, error); throw error; }
    if (!data) throw new Error(`[SUPABASE INSERT ERROR] Card ${card.id}: Supabase não retornou o registro criado.`);
    if (String(data.hotel_id) !== String(hotelId) || String(data.column_id) !== String(card.column_id) || String(data.board_id) !== String(card.board_id)) {
      throw new Error(`[SUPABASE INSERT ERROR] Card ${card.id}: resposta persistida não corresponde ao estado solicitado.`);
    }
    console.info(`[SUPABASE INSERT SUCCESS] Card: ${card.id} | coluna=${data.column_id}`);
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
