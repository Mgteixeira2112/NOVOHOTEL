import { KanbanBoard, KanbanCard, KanbanColumn } from '../types/kanban';
import { 
  kanbanRepository, 
  subscribeToKanbanRealtime as subscribeRealtime,
  mapDatabaseCardToKanbanCard,
  mapKanbanCardToDatabaseRow,
  mapDatabaseBoardToKanbanBoard,
  mapKanbanBoardToDatabaseRow,
  mapDatabaseColumnToKanbanColumn,
  mapKanbanColumnToDatabaseRow,
  KanbanRealtimeHandlers
} from './kanban';

export type KanbanRealtimeTable = 'kanban_boards' | 'kanban_columns' | 'kanban_cards';

export const rowToCard = mapDatabaseCardToKanbanCard;
export const cardToRow = mapKanbanCardToDatabaseRow;
export const rowToColumn = mapDatabaseColumnToKanbanColumn;
export const columnToRow = mapKanbanColumnToDatabaseRow;
export const rowToBoard = mapDatabaseBoardToKanbanBoard;
export const boardToRow = mapKanbanBoardToDatabaseRow;

export async function loadPersistentKanban(hotelId: string) {
  return kanbanRepository.loadKanbanData(hotelId);
}

export async function upsertKanbanBoard(hotelId: string, board: KanbanBoard) {
  return kanbanRepository.upsertBoard(hotelId, board);
}

export async function upsertKanbanCard(hotelId: string, card: KanbanCard) {
  return kanbanRepository.upsertCard(hotelId, card);
}

export async function deletePersistentKanbanCard(cardId: string) {
  return kanbanRepository.deleteCard(cardId);
}

export function subscribeToKanbanRealtime(
  hotelId: string, 
  handlers: KanbanRealtimeHandlers
) {
  return subscribeRealtime(hotelId, handlers);
}
