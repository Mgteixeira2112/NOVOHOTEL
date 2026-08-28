import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanHeaderFilters.tsx', 'utf8');

test('header filter design stays compact and without a create button', () => {
  expect(source).not.toContain('Novo Card');
  expect(source).toContain('Limpar');
  expect(source).toContain('Atualizar');
});
