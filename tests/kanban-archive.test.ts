import { describe, expect, it } from 'bun:test';
import { getKanbanAutoArchiveRemainingMs, isFinalKanbanColumn, KANBAN_AUTO_ARCHIVE_DELAY_MS } from '../src/domain/kanbanArchive';

const columns: any[] = [
  { id: 'todo', board_id: 'board', ordem: 0 },
  { id: 'done', board_id: 'board', ordem: 1 },
];

const completedCard: any = {
  id: 'card',
  board_id: 'board',
  column_id: 'done',
  completed_at: '2026-08-28T00:00:00.000Z',
  is_archived: false,
};

describe('kanban auto archive timing', () => {
  it('recognizes the last column', () => {
    expect(isFinalKanbanColumn(completedCard, columns)).toBe(true);
  });

  it('returns the remaining time inside the five minute grace period', () => {
    const now = new Date('2026-08-28T00:03:00.000Z').getTime();
    expect(getKanbanAutoArchiveRemainingMs(completedCard, columns, now)).toBe(2 * 60 * 1000);
  });

  it('returns zero when the archive delay has elapsed', () => {
    const now = new Date('2026-08-28T00:06:00.000Z').getTime();
    expect(getKanbanAutoArchiveRemainingMs(completedCard, columns, now)).toBe(0);
    expect(KANBAN_AUTO_ARCHIVE_DELAY_MS).toBe(5 * 60 * 1000);
  });
});
