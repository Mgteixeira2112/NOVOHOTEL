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
    { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas da recepção', order: 10, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-metrics`, type: 'metrics', title: 'Resumo operacional', order: 20, span: 2, enabled: true },
    { id: `${id}-arrivals`, type: 'arrivals', title: 'Chegadas de hoje', order: 30, span: 1, enabled: true },
    { id: `${id}-departures`, type: 'departures', title: 'Saídas de hoje', order: 40, span: 1, enabled: true },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas da recepção', order: 50, span: 2, enabled: true },
    { id: `${id}-rooms`, type: 'room-map', title: 'Mapa de quartos', order: 60, span: 'full', enabled: true, dataSource: 'rooms', actions: { checkin: true, checkout: true, transferRoom: true } },
    { id: `${id}-tasks`, type: 'task-kanban', boardId, title: 'Kanban de tarefas', order: 70, span: 'full', enabled: true, dataSource: 'kanban' },
    { id: `${id}-team`, type: 'team', title: 'Equipe da recepção', order: 80, span: 2, enabled: true, dataSource: 'users' },
  ];

  if (sector === 'governanca') return [
    { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas da governança', order: 10, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-metrics`, type: 'metrics', title: 'Resumo da governança', order: 20, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-rooms`, type: 'room-map', title: 'Mapa de quartos da governança', order: 30, span: 'full', enabled: true, dataSource: 'rooms', actions: { checkin: false, checkout: false, transferRoom: false, editRoom: false, deleteRoom: false, requestMaintenance: true } },
    { id: `${id}-room-details`, type: 'room-details', title: 'Detalhes do quarto', order: 40, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-tasks`, type: 'task-kanban', boardId, title: 'Tarefas da governança', order: 50, span: 'full', enabled: true, dataSource: 'kanban' },
    { id: `${id}-frigobar`, type: 'frigobar', title: 'Frigobar e reposição', order: 60, span: 'full', enabled: true, dataSource: 'frigobar', actions: { consumeMinibar: false, restockMinibar: true } },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas da governança', order: 70, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-team`, type: 'team', title: 'Equipe da governança', order: 80, span: 2, enabled: true, dataSource: 'users' },
  ];

  if (sector === 'manutencao') return [
    { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas da manutenção', order: 10, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-metrics`, type: 'metrics', title: 'Resumo da manutenção', order: 20, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-maintenance`, type: 'maintenance', boardId, title: 'Ordens de manutenção', order: 30, span: 'full', enabled: true, dataSource: 'maintenance' },
    { id: `${id}-rooms`, type: 'room-map', title: 'Mapa técnico de quartos', order: 40, span: 'full', enabled: true, dataSource: 'rooms', actions: { checkin: false, checkout: false, transferRoom: false, editRoom: false, deleteRoom: false } },
    { id: `${id}-room-details`, type: 'room-details', title: 'Detalhes do quarto', order: 50, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas técnicos', order: 60, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-team`, type: 'team', title: 'Equipe de manutenção', order: 70, span: 2, enabled: true, dataSource: 'users' },
  ];

  if (sector === 'cozinha') return [
    { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas da cozinha', order: 10, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-metrics`, type: 'metrics', title: 'Resumo da cozinha', order: 20, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-tasks`, type: 'task-kanban', boardId, title: 'Fila operacional da cozinha', order: 30, span: 'full', enabled: true, dataSource: 'kanban' },
    { id: `${id}-dashboard`, type: 'dashboard', title: 'Dashboard da cozinha', order: 40, span: 'full', enabled: true, dataSource: 'dashboard' },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas da cozinha', order: 50, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-team`, type: 'team', title: 'Equipe da cozinha', order: 60, span: 2, enabled: true, dataSource: 'users' },
  ];

  return [
    { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas da operação', order: 10, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-metrics`, type: 'metrics', title: 'Resumo da operação', order: 20, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-dashboard`, type: 'dashboard', title: 'Dashboard operacional', order: 30, span: 'full', enabled: true, dataSource: 'dashboard' },
    { id: `${id}-tasks`, type: 'task-kanban', boardId, title: 'Fluxo operacional', order: 40, span: 'full', enabled: true, dataSource: 'kanban' },
    { id: `${id}-alerts`, type: 'alerts', title: 'Alertas operacionais', order: 50, span: 2, enabled: true, dataSource: 'composite' },
    { id: `${id}-frigobar`, type: 'frigobar', title: 'Frigobar', order: 60, span: 'full', enabled: true, dataSource: 'frigobar' },
    { id: `${id}-team`, type: 'team', title: 'Equipe operacional', order: 70, span: 2, enabled: true, dataSource: 'users' },
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

export const setWorkspaceSectorAndBoard = (definition: WorkspaceDefinition, sector: OperationalSectorId, boardId: string = defaultBoardForSector(sector)): WorkspaceDefinition => {
  const previousSector = definition.sectors[0];
  if (previousSector !== sector) {
    return {
      ...definition,
      sectors: [sector],
      widgets: normalizeWorkspaceWidgets(defaultWidgets(definition.id, sector, boardId)),
    };
  }

  return {
    ...definition,
    sectors: [sector],
    widgets: definition.widgets.map(widget =>
      widget.type === 'metrics' || widget.type === 'task-kanban' || widget.type === 'maintenance' || widget.type === 'kanban-cards'
        ? { ...widget, boardId }
        : widget,
    ),
  };
};
