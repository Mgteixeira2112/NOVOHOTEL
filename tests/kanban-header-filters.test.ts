import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanHeaderFilters.tsx', 'utf8');

test('clean kanban filters expose the complete administrative controls', () => {
  expect(source).toContain('Buscar título, descrição, quarto ou responsável');
  expect(source).toContain('Todos os setores');
  expect(source).toContain('Todos os status');
  expect(source).toContain('Todas as prioridades');
  expect(source).toContain('Arquivados');
  expect(source).toContain('Consulta administrativa');
});
