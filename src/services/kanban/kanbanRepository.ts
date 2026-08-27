import { supabase } from '../../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../../types/kanban';
import { 
  mapDatabaseCardToKanbanCard, 
  mapKanbanCardToDatabaseRow, 
  mapDatabaseBoardToKanbanBoard, 
  mapKanbanBoardToDatabaseRow,
  mapDatabaseColumnToKanbanColumn,
  mapKanbanColumnToDatabaseRow 
} from './kanbanMapper';

export const kanbanRepository = {
  async loadKanbanData(hotelId: string): Promise<{ boards: KanbanBoard[]; cards: KanbanCard[] }> {
    if (!hotelId) throw new Error('[KANBAN REPOSITORY] hotelId é obrigatório para carregar dados');

    try {
      const [
        { data: boardRows, error: boardError },
        { data: columnRows, error: columnError },
        { data: cardRows, error: cardError }
      ] = await Promise.all([
        supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true).order('criado_em', { ascending: true }),
        supabase.from('kanban_columns').select('*').order('ordem', { ascending: true }),
        supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId).eq('is_archived', false).order('ordem', { ascending: true }).order('created_at', { ascending: false })
      ]);

      if (boardError) throw boardError;
      if (columnError) throw columnError;
      if (cardError) throw cardError;

      const columns: KanbanColumn[] = (columnRows || []).map(mapDatabaseColumnToKanbanColumn);
      const boards: KanbanBoard[] = (boardRows || []).map((row) => mapDatabaseBoardToKanbanBoard(row, columns));
      const cards: KanbanCard[] = (cardRows || []).map(mapDatabaseCardToKanbanCard);

      console.info(`[SUPABASE LOAD SUCCESS] Hotel: ${hotelId} | Boards: ${boards.length} | Colunas: ${columns.length} | Cards: ${cards.length}`);
      return { boards, cards };
    } catch (error) {
      console.error('[SUPABASE LOAD ERROR]', error);
      throw error;
    }
  },

  /** Atualização de um card existente. Usa UPDATE + hotel_id para impedir inserções acidentais durante o Drag & Drop. */
  async updateCard(hotelId: string, card: KanbanCard): Promise<void> {
    if (!hotelId || !card?.id) {
      throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para updateCard');
    }

    const payload = mapKanbanCardToDatabaseRow(card, hotelId);
    const { id: _id, hotel_id: _hotelId, ...updatePayload } = payload;

    const { data, error } = await supabase
      .from('kanban_cards')
      .update(updatePayload)
      .eq('id', card.id)
      .eq('hotel_id', hotelId)
      .select('id, hotel_id, board_id, column_id, updated_at')
      .single();

    if (error) {
      console.error('[SUPABASE UPDATE ERROR] Card:', card.id, error);
      throw error;
    }

    if (!data) {
      throw new Error(`[SUPABASE UPDATE ERROR] Card ${card.id}: nenhum registro foi atualizado.`);
    }

    if (String(data.column_id) !== String(card.column_id)) {
      throw new Error(`[SUPABASE UPDATE ERROR] Card ${card.id}: coluna persistida (${data.column_id}) diferente da solicitada (${card.column_id}).`);
    }

    if (String(data.board_id) !== String(card.board_id)) {
      throw new Error(`[SUPABASE UPDATE ERROR] Card ${card.id}: board persistido (${data.board_id}) diferente do solicitado (${card.board_id}).`);
    }

    console.info(`[SUPABASE UPDATE SUCCESS] Card: ${card.id} | coluna=${data.column_id} | updated_at=${data.updated_at}`);
  },

  /**
   * Mantido para criação e sincronizações que podem precisar de INSERT/UPDATE.
   */
  async upsertCard(hotelId: string, card: KanbanCard): Promise<void> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para upsertCard');

    const payload = mapKanbanCardToDatabaseRow(card, hotelId);
    const { data, error } = await supabase
      .from('kanban_cards')
      .upsert(payload, { onConflict: 'id' })
      .select('id, hotel_id, board_id, column_id, updated_at')
      .single();

    if (error) {
      console.error('[SUPABASE SAVE ERROR] Card:', card.id, error);
      throw error;
    }
    if (!data) throw new Error(`[SUPABASE SAVE ERROR] Card ${card.id}: Supabase não retornou o registro persistido.`);
    if (String(data.hotel_id) !== String(hotelId)) throw new Error(`[SUPABASE SAVE ERROR] Card ${card.id}: hotel_id retornado não corresponde ao hotel ativo.`);
    if (String(data.column_id) !== String(card.column_id)) throw new Error(`[SUPABASE SAVE ERROR] Card ${card.id}: coluna persistida (${data.column_id}) diferente da solicitada (${card.column_id}).`);
    if (String(data.board_id) !== String(card.board_id)) throw new Error(`[SUPABASE SAVE ERROR] Card ${card.id}: board persistido (${data.board_id}) diferente do solicitado (${card.board_id}).`);

    console.info(`[SUPABASE SAVE SUCCESS] Card: ${card.id} ("${card.title}") no hotel ${hotelId} | coluna=${data.column_id}`);
  },

  async deleteCard(cardId: string): Promise<void> {
    if (!cardId) throw new Error('[KANBAN REPOSITORY] cardId é obrigatório para deleteCard');
    const { error } = await supabase.from('kanban_cards').delete().eq('id', cardId);
    if (error) { console.error('[SUPABASE DELETE ERROR] Card:', cardId, error); throw error; }
    console.info(`[SUPABASE DELETE SUCCESS] Card: ${cardId}`);
  },

  async upsertBoard(hotelId: string, board: KanbanBoard): Promise<void> {
    if (!hotelId || !board?.id) throw new Error('[KANBAN REPOSITORY] hotelId e board.id são obrigatórios para upsertBoard');
    const boardPayload = mapKanbanBoardToDatabaseRow(board, hotelId);
    const { error: boardError } = await supabase.from('kanban_boards').upsert(boardPayload, { onConflict: 'id' });
    if (boardError) { console.error('[SUPABASE SAVE ERROR] Board:', board.id, boardError); throw boardError; }

    if (board.columns && board.columns.length > 0) {
      const columnsPayload = board.columns.map(mapKanbanColumnToDatabaseRow);
      const { error: columnsError } = await supabase.from('kanban_columns').upsert(columnsPayload, { onConflict: 'id' });
      if (columnsError) { console.error('[SUPABASE SAVE ERROR] Colunas do Board:', board.id, columnsError); throw columnsError; }
    }
    console.info(`[SUPABASE SAVE SUCCESS] Board: ${board.id} ("${board.title}")`);
  },

  async deleteBoard(boardId: string): Promise<void> {
    if (!boardId) throw new Error('[KANBAN REPOSITORY] boardId é obrigatório para deleteBoard');
    const { error } = await supabase.from('kanban_boards').delete().eq('id', boardId);
    if (error) { console.error('[SUPABASE DELETE ERROR] Board:', boardId, error); throw error; }
    console.info(`[SUPABASE DELETE SUCCESS] Board: ${boardId}`);
  },

  async upsertColumn(column: KanbanColumn): Promise<void> {
    if (!column?.id || !column?.board_id) throw new Error('[KANBAN REPOSITORY] column.id e column.board_id são obrigatórios para upsertColumn');
    const payload = mapKanbanColumnToDatabaseRow(column);
    const { error } = await supabase.from('kanban_columns').upsert(payload, { onConflict: 'id' });
    if (error) { console.error('[SUPABASE SAVE ERROR] Coluna:', column.id, error); throw error; }
    console.info(`[SUPABASE SAVE SUCCESS] Coluna: ${column.id} ("${column.title}")`);
  },

  async deleteColumn(columnId: string): Promise<void> {
    if (!columnId) throw new Error('[KANBAN REPOSITORY] columnId é obrigatório para deleteColumn');
    const { error } = await supabase.from('kanban_columns').delete().eq('id', columnId);
    if (error) { console.error('[SUPABASE DELETE ERROR] Coluna:', columnId, error); throw error; }
    console.info(`[SUPABASE DELETE SUCCESS] Coluna: ${columnId}`);
  },
};
