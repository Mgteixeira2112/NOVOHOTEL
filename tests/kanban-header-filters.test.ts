import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanHeaderFilters.tsx', 'utf8');

test('cabeçalho limpo expõe filtros completos e acesso ao arquivo administrativo', () => {
  assert.equal(source.includes('Buscar título, descrição, quarto ou responsável'), true);
  assert.equal(source.includes('Todos os setores'), true);
  assert.equal(source.includes('Todos os status'), true);
  assert.equal(source.includes('Todas as prioridades'), true);
  assert.equal(source.includes('Arquivo administrativo'), true);
  assert.equal(source.includes('Limpar'), true);
  assert.equal(source.includes('Novo Card'), false);
});
