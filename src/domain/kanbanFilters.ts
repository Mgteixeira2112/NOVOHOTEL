import { KanbanV2Card } from '../services/kanbanV2';

export type KanbanArchiveView = 'active' | 'archived' | 'all';

export interface KanbanCardFilters {
  search: string;
  department: string;
  user: string;
  room: string;
  columnId: string;
  priority: string;
  archiveView: KanbanArchiveView;
}

function normalized(value?: string | null): string {
  return (value || '').trim().toLocaleLowerCase('pt-BR');
}

export function matchesKanbanFilters(card: KanbanV2Card, filters: KanbanCardFilters): boolean {
  if (filters.archiveView === 'active' && card.is_archived) return false;
  if (filters.archiveView === 'archived' && !card.is_archived) return false;

  if (filters.department !== 'todos' && (card.departamento || 'operacao') !== filters.department) return false;

  if (filters.user !== 'todos') {
    const assigned = card.assigned_to as any;
    const assignedId = (card as any).assigned_user_id || assigned?.id || '';
    const assignedName = assigned?.name || '';
    if (filters.user === 'sem_responsavel') {
      if (assignedId || assignedName) return false;
    } else if (assignedId !== filters.user && assignedName !== filters.user) {
      return false;
    }
  }

  if (filters.room !== 'todos') {
    if (filters.room === 'sem_quarto') {
      if (card.room_number) return false;
    } else if (card.room_number !== filters.room) {
      return false;
    }
  }

  if (filters.columnId !== 'todos' && card.column_id !== filters.columnId) return false;
  if (filters.priority !== 'todos' && (card.prioridade || 'normal') !== filters.priority) return false;

  const query = normalized(filters.search);
  if (query) {
    const assigned = card.assigned_to as any;
    const haystack = [
      card.titulo,
      card.descricao,
      card.room_number,
      card.location,
      card.departamento,
      assigned?.name,
    ].map(normalized).join(' ');
    if (!haystack.includes(query)) return false;
  }

  return true;
}

export function hasActiveKanbanFilters(filters: KanbanCardFilters): boolean {
  return Boolean(
    filters.search.trim()
      || filters.department !== 'todos'
      || filters.user !== 'todos'
      || filters.room !== 'todos'
      || filters.columnId !== 'todos'
      || filters.priority !== 'todos'
      || filters.archiveView !== 'active',
  );
}
