import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanModule.tsx', 'utf8');

test('kanban header avoids a redundant global create action', () => {
  expect(source).not.toContain('title={canCreateInActiveBoard ? \'Criar nova tarefa\'');
});
