import test from 'node:test';
import assert from 'node:assert/strict';
import { hasActiveKanbanFilters, matchesKanbanFilters } from '../src/domain/kanbanFilters';

const baseCard: any = {
  id: 'card-1',
  hotel_id: 'default_hotel',
  board_id: 'kanban-board-governanca',
  column_id: 'gov-col-em-limpeza',
  titulo: 'Limpar apartamento 203',
  descricao: 'Trocar enxoval',
  prioridade: 'alta',
  departamento: 'governanca',
  room_number: '203',
  location: 'Quarto 203',
  assigned_to: { id: 'user-1', name: 'Luciana Ferreira' },
  assigned_user_id: 'user-1',
  is_archived: false,
  ordem: 0,
};

const defaults = {
  search: '',
  department: 'todos',
  user: 'todos',
  room: 'todos',
  columnId: 'todos',
  priority: 'todos',
  archiveView: 'active' as const,
};

test('filtros combinam busca, setor, responsável, acomodação, status e prioridade', () => {
  assert.equal(matchesKanbanFilters(baseCard, {
    ...defaults,
    search: 'enxoval',
    department: 'governanca',
    user: 'user-1',
    room: '203',
    columnId: 'gov-col-em-limpeza',
    priority: 'alta',
  }), true);
});

test('visão ativa não inclui arquivados e visão administrativa pode consultá-los', () => {
  const archived = { ...baseCard, is_archived: true };
  assert.equal(matchesKanbanFilters(archived, defaults), false);
  assert.equal(matchesKanbanFilters(archived, { ...defaults, archiveView: 'archived' }), true);
});

test('detecta filtros ativos', () => {
  assert.equal(hasActiveKanbanFilters(defaults), false);
  assert.equal(hasActiveKanbanFilters({ ...defaults, search: '203' }), true);
});
