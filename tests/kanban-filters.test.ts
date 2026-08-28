import { describe, expect, it } from 'bun:test';
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

describe('kanban complete filters', () => {
  it('combines search, sector, responsible, room, column and priority', () => {
    expect(matchesKanbanFilters(baseCard, {
      ...defaults,
      search: 'enxoval',
      department: 'governanca',
      user: 'user-1',
      room: '203',
      columnId: 'gov-col-em-limpeza',
      priority: 'alta',
    })).toBe(true);
  });

  it('keeps archived cards out of the active view and allows administrative archive view', () => {
    const archived = { ...baseCard, is_archived: true };
    expect(matchesKanbanFilters(archived, defaults)).toBe(false);
    expect(matchesKanbanFilters(archived, { ...defaults, archiveView: 'archived' })).toBe(true);
  });

  it('detects active filters', () => {
    expect(hasActiveKanbanFilters(defaults)).toBe(false);
    expect(hasActiveKanbanFilters({ ...defaults, search: '203' })).toBe(true);
  });
});
