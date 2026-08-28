import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition, WorkspaceWidgetDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

export const WORKSPACE_BOARD_OPTIONS = [
  { id: 'kanban-default-board', sector: 'operacao' as OperationalSectorId, label: 'Operação Geral' },
  { id: 'kanban-board-governanca', sector: 'governanca' as OperationalSectorId, label: 'Governança' },
  { id: 'kanban-board-recepcao', sector: 'recepcao' as OperationalSectorId, label: 'Recepção' },
  { id: 'kanban-board-manutencao', sector: 'manutencao' as OperationalSectorId, label: 'Manutenção' },
  { id: 'kanban-board-cozinha', sector: 'cozinha' as OperationalSectorId, label: 'Cozinha & Room Service' },
] as const;

export const defaultBoardForSector = (sector: OperationalSectorId): string =>
  WORKSPACE_BOARD_OPTIONS.find(option => option.sector === sector)?.id || 'kanban-default-board';

const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'personalizado';

const defaultWidgets = (id: string, sector: OperationalSectorId, boardId: string): WorkspaceWidgetDefinition[] => {
  if (sector === 'recepcao') return [
    { id: `${id}-metrics`, type: 'metrics', title: 'Resumo operacional', order: 10, span: 'full', enabled: true },
    { id: `${id}-arrivals`, type: 'arrivals', title: 'Chegadas de hoje', order: 20, span: 1, enabled: true },
    { id: `${id}-departures`, type: 'departures', title: 'Saídas de hoje', order: 30, span: 1, enabled: true },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas da recepção', order: 40, span: 2, enabled: true },
    { id: `${id}-rooms`, type: 'room-map', title: 'Mapa de quartos', order: 50, span: 'full', enabled: true, dataSource: 'rooms', actions: { checkin: true, checkout: true, transferRoom: true } },
    { id: `${id}-tasks`, type: 'task-kanban', boardId, title: 'Kanban de tarefas', order: 60, span: 'full', enabled: true, dataSource: 'kanban' },
  ];
  return [
    { id: `${id}-metrics`, type: 'metrics', boardId, order: 10, span: 'full', enabled: true },
    { id: `${id}-tasks`, type: 'task-kanban', boardId, title: 'Fluxo operacional', order: 20, span: 'full', enabled: true, dataSource: 'kanban' },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas', order: 30, span: 2, enabled: false },
    { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas', order: 40, span: 2, enabled: false },
  ];
};

export const createWorkspaceDefinition = (input: { name: string; sector: OperationalSectorId; boardId?: string; id?: string; }): WorkspaceDefinition => {
  const boardId = input.boardId || defaultBoardForSector(input.sector);
  const id = input.id || `workspace-custom-${slug(input.name)}-${Date.now().toString(36)}`;
  return { id, name: input.name, description: `Ambiente operacional personalizado para ${input.name}.`, sectors: [input.sector], layout: 'operational', defaultScope: 'sector', widgets: normalizeWorkspaceWidgets(defaultWidgets(id, input.sector, boardId)) };
};

export const duplicateWorkspaceDefinition = (source: WorkspaceDefinition): WorkspaceDefinition => {
  const id = `workspace-custom-${slug(source.name)}-copia-${Date.now().toString(36)}`;
  return { ...source, id, name: `${source.name} — Cópia`, widgets: normalizeWorkspaceWidgets(source.widgets.map(widget => ({ ...widget, id: `${id}-${widget.type}-${Math.random().toString(36).slice(2, 7)}` }))) };
};

export const setWorkspaceSectorAndBoard = (definition: WorkspaceDefinition, sector: OperationalSectorId, boardId: string = defaultBoardForSector(sector)): WorkspaceDefinition => ({
  ...definition,
  sectors: [sector],
  widgets: definition.widgets.map(widget => widget.type === 'metrics' || widget.type === 'task-kanban' || widget.type === 'kanban-cards' ? { ...widget, boardId } : widget),
});
