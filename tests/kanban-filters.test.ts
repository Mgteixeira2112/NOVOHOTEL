import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKanbanTemporalSearch, hasActiveKanbanFilters, matchesKanbanFilters, parseKanbanTemporalSearch } from '../src/domain/kanbanFilters';

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
  created_at: '2026-08-27T20:00:00-03:00',
  updated_at: '2026-08-27T21:15:00-03:00',
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

test('filtra cards por intervalo de criação e última alteração sem mudar o motor do kanban', () => {
  const search = buildKanbanTemporalSearch('', {
    createdFrom: '2026-08-27T19:00', createdTo: '2026-08-27T20:30',
    updatedFrom: '2026-08-27T21:00', updatedTo: '2026-08-27T21:30',
  });
  assert.equal(matchesKanbanFilters(baseCard, { ...defaults, search }), true);

  const outside = buildKanbanTemporalSearch('', {
    createdFrom: '2026-08-27T20:30', createdTo: '', updatedFrom: '', updatedTo: '',
  });
  assert.equal(matchesKanbanFilters(baseCard, { ...defaults, search: outside }), false);
});

test('preserva busca textual junto dos filtros temporais', () => {
  const search = buildKanbanTemporalSearch('enxoval', {
    createdFrom: '2026-08-27T19:00', createdTo: '', updatedFrom: '', updatedTo: '',
  });
  const parsed = parseKanbanTemporalSearch(search);
  assert.equal(parsed.text, 'enxoval');
  assert.equal(parsed.temporal.createdFrom, '2026-08-27T19:00');
  assert.equal(matchesKanbanFilters(baseCard, { ...defaults, search }), true);
});

test('detecta filtros ativos, inclusive data e hora', () => {
  assert.equal(hasActiveKanbanFilters(defaults), false);
  assert.equal(hasActiveKanbanFilters({ ...defaults, search: '203' }), true);
  assert.equal(hasActiveKanbanFilters({ ...defaults, search: buildKanbanTemporalSearch('', { createdFrom: '2026-08-27T19:00', createdTo: '', updatedFrom: '', updatedTo: '' }) }), true);
});
