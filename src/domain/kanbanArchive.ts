import { KanbanV2Card, KanbanV2Column } from '../services/kanbanV2';

export const KANBAN_AUTO_ARCHIVE_DELAY_MS = 5 * 60 * 1000;

export function isFinalKanbanColumn(card: KanbanV2Card, columns: KanbanV2Column[]): boolean {
  const boardColumns = columns
    .filter(column => column.board_id === card.board_id)
    .sort((a, b) => a.ordem - b.ordem);
  return Boolean(boardColumns.length && boardColumns[boardColumns.length - 1]?.id === card.column_id);
}

export function getKanbanAutoArchiveRemainingMs(
  card: KanbanV2Card,
  columns: KanbanV2Column[],
  now = Date.now(),
): number | null {
  if (card.is_archived || !card.completed_at || !isFinalKanbanColumn(card, columns)) return null;
  const completedAt = new Date(card.completed_at).getTime();
  if (Number.isNaN(completedAt)) return null;
  return Math.max(0, KANBAN_AUTO_ARCHIVE_DELAY_MS - (now - completedAt));
}
