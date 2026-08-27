import { supabase } from '../../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../../types/kanban';
import { mapDatabaseCardToKanbanCard, mapKanbanCardToDatabaseRow, mapDatabaseBoardToKanbanBoard, mapKanbanBoardToDatabaseRow, mapDatabaseColumnToKanbanColumn, mapKanbanColumnToDatabaseRow } from './kanbanMapper';
import { INITIAL_KANBAN_BOARDS, INITIAL_KANBAN_CARDS } from '../../data/mockKanbanData';

function describeSupabaseError(prefix: string, error: any): Error {
  const details = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(' | ');
  return new Error(`${prefix}${details ? `: ${details}` : ''}`);
}

async function ensureBoardAndColumnForCard(hotelId: string, card: KanbanCard): Promise<void> {
  const { data: board, error: boardLookupError } = await supabase
    .from('kanban_boards')
    .select('id')
    .eq('id', card.board_id)
    .eq('hotel_id', hotelId)
    .maybeSingle();

  if (boardLookupError) throw describeSupabaseError('[KANBAN] Falha ao verificar quadro', boardLookupError);

  if (!board) {
    const sourceBoard = INITIAL_KANBAN_BOARDS.find((b) => b.id === card.board_id);
    if (!sourceBoard) {
      throw new Error(`[KANBAN] Quadro ${card.board_id} não existe para o hotel ${hotelId}.`);
    }
    const { error } = await supabase
      .from('kanban_boards')
      .insert(mapKanbanBoardToDatabaseRow(sourceBoard, hotelId));
    if (error && error.code !== '23505') throw describeSupabaseError('[KANBAN] Falha ao criar quadro', error);
  }

  const { data: column, error: columnLookupError } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('id', card.column_id)
    .eq('board_id', card.board_id)
    .maybeSingle();

  if (columnLookupError) throw describeSupabaseError('[KANBAN] Falha ao verificar coluna', columnLookupError);

  if (!column) {
    const sourceBoard = INITIAL_KANBAN_BOARDS.find((b) => b.id === card.board_id);
    const sourceColumn = sourceBoard?.columns.find((c) => c.id === card.column_id);
    if (!sourceColumn) {
      throw new Error(`[KANBAN] Coluna ${card.column_id} não existe no quadro ${card.board_id}.`);
    }
    const { error } = await supabase
      .from('kanban_columns')
      .insert(mapKanbanColumnToDatabaseRow(sourceColumn));
    if (error && error.code !== '23505') throw describeSupabaseError('[KANBAN] Falha ao criar coluna', error);
  }
}

async function persistDefaultKanban(hotelId: string): Promise<void> {
  if (!hotelId) return;
  for (const board of INITIAL_KANBAN_BOARDS) {
    const { error: boardError } = await supabase.from('kanban_boards').upsert(mapKanbanBoardToDatabaseRow(board, hotelId), { onConflict: 'id' });
    if (boardError) throw describeSupabaseError(`[KANBAN SEED] Falha ao persistir quadro ${board.id}`, boardError);
    if (board.columns?.length) {
      const { error: columnsError } = await supabase.from('kanban_columns').upsert(board.columns.map(mapKanbanColumnToDatabaseRow), { onConflict: 'id' });
      if (columnsError) throw describeSupabaseError(`[KANBAN SEED] Falha ao persistir colunas do quadro ${board.id}`, columnsError);
    }
  }
  if (INITIAL_KANBAN_CARDS.length) {
    const { error: cardsError } = await supabase.from('kanban_cards').upsert(INITIAL_KANBAN_CARDS.map(card => mapKanbanCardToDatabaseRow(card, hotelId)), { onConflict: 'id' });
    if (cardsError) throw describeSupabaseError('[KANBAN SEED] Falha ao persistir cartões iniciais', cardsError);
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
      if (boardsResult.error) throw describeSupabaseError('[KANBAN LOAD] Falha ao carregar quadros', boardsResult.error);
      if (columnsResult.error) throw describeSupabaseError('[KANBAN LOAD] Falha ao carregar colunas', columnsResult.error);
      if (cardsResult.error) throw describeSupabaseError('[KANBAN LOAD] Falha ao carregar cartões', cardsResult.error);
      const boardIds = new Set((boardsResult.data || []).map((board: any) => String(board.id)));
      const columns = (columnsResult.data || []).filter((row: any) => boardIds.has(String(row.board_id))).map(mapDatabaseColumnToKanbanColumn);
      const boards = (boardsResult.data || []).map(row => mapDatabaseBoardToKanbanBoard(row, columns));
      const cards = (cardsResult.data || []).map(mapDatabaseCardToKanbanCard);
      return { boards, cards };
    };
    let result = await load();
    if (result.boards.length === 0) {
      console.info(`[KANBAN SEED] Persistindo dados iniciais do Kanban para o hotel ${hotelId}`);
      await persistDefaultKanban(hotelId);
      result = await load();
    }
    console.info(`[SUPABASE LOAD SUCCESS] Hotel: ${hotelId} | Boards: ${result.boards.length} | Cards: ${result.cards.length}`);
    return result;
  },

  async updateCard(hotelId: string, card: KanbanCard): Promise<KanbanCard> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para updateCard');
    await ensureBoardAndColumnForCard(hotelId, card);
    const mutationUpdatedAt = new Date().toISOString();
    const payload = mapKanbanCardToDatabaseRow({ ...card, updated_at: mutationUpdatedAt }, hotelId);
    const { id: _id, hotel_id: _hotelId, ...updatePayload } = payload;
    updatePayload.updated_at = mutationUpdatedAt;
    let query = supabase.from('kanban_cards').update(updatePayload).eq('id', card.id).eq('hotel_id', hotelId);
    if (card.updated_at) query = query.eq('updated_at', card.updated_at);
    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw describeSupabaseError(`[SUPABASE UPDATE ERROR] Card ${card.id}`, error);
    if (!data) throw new Error(`[SUPABASE CONCURRENCY ERROR] Card ${card.id}: registro inexistente ou versão local desatualizada.`);
    const persistedCard = mapDatabaseCardToKanbanCard(data);
    console.info(`[SUPABASE UPDATE SUCCESS] Card: ${card.id} | coluna=${data.column_id} | updated_at=${data.updated_at}`);
    return persistedCard;
  },

  async upsertCard(hotelId: string, card: KanbanCard): Promise<KanbanCard> {
    if (!hotelId || !card?.id) throw new Error('[KANBAN REPOSITORY] hotelId e card.id são obrigatórios para upsertCard');
    await ensureBoardAndColumnForCard(hotelId, card);

    const { data: existing, error: lookupError } = await supabase
      .from('kanban_cards')
      .select('id, updated_at')
      .eq('id', card.id)
      .eq('hotel_id', hotelId)
      .maybeSingle();
    if (lookupError) throw describeSupabaseError(`[SUPABASE LOOKUP ERROR] Card ${card.id}`, lookupError);

    if (existing) return kanbanRepository.updateCard(hotelId, card);

    const mutationUpdatedAt = new Date().toISOString();
    const payload = mapKanbanCardToDatabaseRow({ ...card, updated_at: mutationUpdatedAt }, hotelId);
    const { data, error } = await supabase.from('kanban_cards').insert(payload).select('*').single();
    if (error) throw describeSupabaseError(`[SUPABASE INSERT ERROR] Card ${card.id}`, error);
    if (!data) throw new Error(`[SUPABASE INSERT ERROR] Card ${card.id}: Supabase não retornou o registro criado.`);

    const persistedCard = mapDatabaseCardToKanbanCard(data);
    console.info(`[SUPABASE INSERT SUCCESS] Card: ${card.id} | coluna=${data.column_id} | updated_at=${data.updated_at}`);
    return persistedCard;
  },

  async deleteCard(cardId: string): Promise<void> {
    if (!cardId) throw new Error('[KANBAN REPOSITORY] cardId é obrigatório para deleteCard');
    const { error } = await supabase.from('kanban_cards').delete().eq('id', cardId);
    if (error) throw describeSupabaseError(`[SUPABASE DELETE ERROR] Card ${cardId}`, error);
  },

  async upsertBoard(hotelId: string, board: KanbanBoard): Promise<void> {
    if (!hotelId || !board?.id) throw new Error('[KANBAN REPOSITORY] hotelId e board.id são obrigatórios para upsertBoard');
    const { error: boardError } = await supabase.from('kanban_boards').upsert(mapKanbanBoardToDatabaseRow(board, hotelId), { onConflict: 'id' });
    if (boardError) throw describeSupabaseError(`[SUPABASE BOARD ERROR] Board ${board.id}`, boardError);
    if (board.columns?.length) {
      const { error } = await supabase.from('kanban_columns').upsert(board.columns.map(mapKanbanColumnToDatabaseRow), { onConflict: 'id' });
      if (error) throw describeSupabaseError(`[SUPABASE COLUMN ERROR] Board ${board.id}`, error);
    }
  },

  async deleteBoard(boardId: string): Promise<void> {
    if (!boardId) throw new Error('[KANBAN REPOSITORY] boardId é obrigatório para deleteBoard');
    const { error } = await supabase.from('kanban_boards').delete().eq('id', boardId);
    if (error) throw describeSupabaseError(`[SUPABASE DELETE BOARD ERROR] Board ${boardId}`, error);
  },

  async upsertColumn(column: KanbanColumn): Promise<void> {
    if (!column?.id || !column?.board_id) throw new Error('[KANBAN REPOSITORY] column.id e column.board_id são obrigatórios para upsertColumn');
    const { error } = await supabase.from('kanban_columns').upsert(mapKanbanColumnToDatabaseRow(column), { onConflict: 'id' });
    if (error) throw describeSupabaseError(`[SUPABASE COLUMN ERROR] Coluna ${column.id}`, error);
  },

  async deleteColumn(columnId: string): Promise<void> {
    if (!columnId) throw new Error('[KANBAN REPOSITORY] columnId é obrigatório para deleteColumn');
    const { error } = await supabase.from('kanban_columns').delete().eq('id', columnId);
    if (error) throw describeSupabaseError(`[SUPABASE DELETE COLUMN ERROR] Coluna ${columnId}`, error);
  },
};