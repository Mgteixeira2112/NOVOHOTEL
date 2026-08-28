import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanModule.tsx', 'utf8');

test('kanban module integrates the clean filter bar', () => {
  expect(source).toContain('KanbanHeaderFilters');
});
