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

export interface KanbanTemporalFilters {
  createdFrom: string;
  createdTo: string;
  updatedFrom: string;
  updatedTo: string;
}

const TEMPORAL_TOKEN = /\[kanban-time:([^\]]+)\]/g;

function normalized(value?: string | null): string {
  return (value || '').trim().toLocaleLowerCase('pt-BR');
}

function decodeTemporalValue(value?: string): string {
  if (!value) return '';
  try { return decodeURIComponent(value); } catch { return ''; }
}

export function parseKanbanTemporalSearch(search: string): { text: string; temporal: KanbanTemporalFilters } {
  const temporal: KanbanTemporalFilters = { createdFrom: '', createdTo: '', updatedFrom: '', updatedTo: '' };
  const text = search.replace(TEMPORAL_TOKEN, (_, payload: string) => {
    payload.split('&').forEach(part => {
      const [key, rawValue] = part.split('=');
      const value = decodeTemporalValue(rawValue);
      if (key === 'cf') temporal.createdFrom = value;
      if (key === 'ct') temporal.createdTo = value;
      if (key === 'uf') temporal.updatedFrom = value;
      if (key === 'ut') temporal.updatedTo = value;
    });
    return '';
  }).trim();
  return { text, temporal };
}

export function buildKanbanTemporalSearch(text: string, temporal: KanbanTemporalFilters): string {
  const parts = [
    ['cf', temporal.createdFrom], ['ct', temporal.createdTo],
    ['uf', temporal.updatedFrom], ['ut', temporal.updatedTo],
  ].filter(([, value]) => Boolean(value)).map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return [text.trim(), parts.length ? `[kanban-time:${parts.join('&')}]` : ''].filter(Boolean).join(' ');
}

function withinDateRange(value: string | null | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  if (!Number.isFinite(timestamp)) return false;
  if (from) {
    const fromTimestamp = new Date(from).getTime();
    if (Number.isFinite(fromTimestamp) && timestamp < fromTimestamp) return false;
  }
  if (to) {
    const toTimestamp = new Date(to).getTime();
    if (Number.isFinite(toTimestamp) && timestamp > toTimestamp) return false;
  }
  return true;
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

  const parsedSearch = parseKanbanTemporalSearch(filters.search);
  if (!withinDateRange(card.created_at, parsedSearch.temporal.createdFrom, parsedSearch.temporal.createdTo)) return false;
  if (!withinDateRange(card.updated_at, parsedSearch.temporal.updatedFrom, parsedSearch.temporal.updatedTo)) return false;

  const query = normalized(parsedSearch.text);
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
  const parsedSearch = parseKanbanTemporalSearch(filters.search);
  const hasTemporalFilter = Object.values(parsedSearch.temporal).some(Boolean);
  return Boolean(
    parsedSearch.text.trim()
      || hasTemporalFilter
      || filters.department !== 'todos'
      || filters.user !== 'todos'
      || filters.room !== 'todos'
      || filters.columnId !== 'todos'
      || filters.priority !== 'todos'
      || filters.archiveView !== 'active',
  );
}
