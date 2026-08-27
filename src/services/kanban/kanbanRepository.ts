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
  /**
   * Carrega todos os quadros, colunas e cartões ativos para um hotel específico.
   */
  async loadKanbanData(hotelId: string): Promise<{ boards: KanbanBoard[]; cards: KanbanCard[] }> {
    if (!hotelId) {
      throw new Error('[KANBAN REPOSITORY] hotelId é obrigatório para carregar dados');
    }

    try {
      const [
        { data: boardRows, error: boardError },
        { data: columnRows, error: columnError },
        { data: cardRows, error: cardError }
      ] = await Promise.all([
        supabase
          .from('kanban_boards')
          .select('*')
          .eq('hotel_id', hotelId)
          .eq('ativo', true)
          .order('criado_em', { ascending: true }),
        supabase
          .from('kanban_columns')
          .select('*')
          .order('ordem', { ascending: true }),
        supabase
          .from('kanban_cards')
          .select('*')
          .eq('hotel_id', hotelId)
          .eq('is_archived', false)
          .order('ordem', { ascending: true })
          .order('created_at', { ascending: false })
      ]);

      if (boardError) {
        console.error('[SUPABASE LOAD ERROR] Falha ao carregar boards:', boardError);
        throw boardError;
      }
      if (columnError) {
        console.error('[SUPABASE LOAD ERROR] Falha ao carregar colunas:', columnError);
        throw columnError;
      }
      if (cardError) {
        console.error('[SUPABASE LOAD ERROR] Falha ao carregar cartões:', cardError);
        throw cardError;
      }

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

  /**
   * Salva ou atualiza um cartão Kanban no Supabase de forma atômica.
   */
  async upsertCard(hotelId: string, card: KanbanCard): Promise<void> {
    if (!hotelId || !card?.id) {
      throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para upsertCard');
    }

    const payload = mapKanbanCardToDatabaseRow(card, hotelId);
    const { error } = await supabase
      .from('kanban_cards')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[SUPABASE SAVE ERROR] Card:', card.id, error);
      throw error;
    }

    console.info(`[SUPABASE SAVE SUCCESS] Card: ${card.id} ("${card.title}") no hotel ${hotelId}`);
  },

  /**
   * Remove permanentemente um cartão Kanban do Supabase.
   */
  async deleteCard(cardId: string): Promise<void> {
    if (!cardId) {
      throw new Error('[KANBAN REPOSITORY] cardId é obrigatório para deleteCard');
    }

    const { error } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', cardId);

    if (error) {
      console.error('[SUPABASE DELETE ERROR] Card:', cardId, error);
      throw error;
    }

    console.info(`[SUPABASE DELETE SUCCESS] Card: ${cardId}`);
  },

  /**
   * Salva ou atualiza um Quadro Kanban e suas colunas no Supabase.
   */
  async upsertBoard(hotelId: string, board: KanbanBoard): Promise<void> {
    if (!hotelId || !board?.id) {
      throw new Error('[KANBAN REPOSITORY] hotelId e board.id são obrigatórios para upsertBoard');
    }

    const boardPayload = mapKanbanBoardToDatabaseRow(board, hotelId);
    const { error: boardError } = await supabase
      .from('kanban_boards')
      .upsert(boardPayload, { onConflict: 'id' });

    if (boardError) {
      console.error('[SUPABASE SAVE ERROR] Board:', board.id, boardError);
      throw boardError;
    }

    if (board.columns && board.columns.length > 0) {
      const columnsPayload = board.columns.map(mapKanbanColumnToDatabaseRow);
      const { error: columnsError } = await supabase
        .from('kanban_columns')
        .upsert(columnsPayload, { onConflict: 'id' });

      if (columnsError) {
        console.error('[SUPABASE SAVE ERROR] Colunas do Board:', board.id, columnsError);
        throw columnsError;
      }
    }

    console.info(`[SUPABASE SAVE SUCCESS] Board: ${board.id} ("${board.title}")`);
  },

  /**
   * Remove um quadro Kanban e suas dependências no Supabase.
   */
  async deleteBoard(boardId: string): Promise<void> {
    if (!boardId) {
      throw new Error('[KANBAN REPOSITORY] boardId é obrigatório para deleteBoard');
    }

    const { error } = await supabase
      .from('kanban_boards')
      .delete()
      .eq('id', boardId);

    if (error) {
      console.error('[SUPABASE DELETE ERROR] Board:', boardId, error);
      throw error;
    }

    console.info(`[SUPABASE DELETE SUCCESS] Board: ${boardId}`);
  },

  /**
   * Salva ou atualiza uma coluna Kanban individualmente.
   */
  async upsertColumn(column: KanbanColumn): Promise<void> {
    if (!column?.id || !column?.board_id) {
      throw new Error('[KANBAN REPOSITORY] column.id e column.board_id são obrigatórios para upsertColumn');
    }

    const payload = mapKanbanColumnToDatabaseRow(column);
    const { error } = await supabase
      .from('kanban_columns')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[SUPABASE SAVE ERROR] Coluna:', column.id, error);
      throw error;
    }

    console.info(`[SUPABASE SAVE SUCCESS] Coluna: ${column.id} ("${column.title}")`);
  },

  /**
   * Remove uma coluna Kanban no Supabase.
   */
  async deleteColumn(columnId: string): Promise<void> {
    if (!columnId) {
      throw new Error('[KANBAN REPOSITORY] columnId é obrigatório para deleteColumn');
    }

    const { error } = await supabase
      .from('kanban_columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      console.error('[SUPABASE DELETE ERROR] Coluna:', columnId, error);
      throw error;
    }

    console.info(`[SUPABASE DELETE SUCCESS] Coluna: ${columnId}`);
  },
};
