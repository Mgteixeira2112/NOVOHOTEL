import test from 'node:test';
import assert from 'node:assert/strict';
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

test('reconhece a última coluna do quadro', () => {
  assert.equal(isFinalKanbanColumn(completedCard, columns), true);
});

test('calcula o período de tolerância de cinco minutos', () => {
  const now = new Date('2026-08-28T00:03:00.000Z').getTime();
  assert.equal(getKanbanAutoArchiveRemainingMs(completedCard, columns, now), 2 * 60 * 1000);
  assert.equal(KANBAN_AUTO_ARCHIVE_DELAY_MS, 5 * 60 * 1000);
});

test('retorna zero quando o período para arquivar expirou', () => {
  const now = new Date('2026-08-28T00:06:00.000Z').getTime();
  assert.equal(getKanbanAutoArchiveRemainingMs(completedCard, columns, now), 0);
});
