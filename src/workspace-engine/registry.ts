import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { DEFAULT_WORKSPACE_HOTEL_ID, loadWorkspaceOverrides, mergeWorkspaceDefinition } from './workspaceConfigStore';
import { migrateWorkspaceDefinitionToCanonicalWidgets } from './workspaceMigration';

export const workspaceRegistry: WorkspaceDefinition[] = [
  {
    id: 'workspace-governanca',
    name: 'Governança',
    description: 'Operação de quartos e tarefas do setor',
    sectors: ['governanca'],
    layout: 'operational',
    defaultScope: 'sector',
    widgets: normalizeWorkspaceWidgets([
      { id: 'governanca-metrics', type: 'metrics', boardId: 'kanban-board-governanca', order: 10, span: 'full' },
      { id: 'governanca-kanban', type: 'kanban-cards', boardId: 'kanban-board-governanca', title: 'Central de trabalho', order: 20, span: 'full' },
      { id: 'governanca-alerts', type: 'alerts', title: 'Alertas do setor', order: 30, span: 2, enabled: true },
      { id: 'governanca-actions', type: 'quick-actions', title: 'Ações rápidas', order: 40, span: 2, enabled: true },
    ]),
  },
  {
    id: 'workspace-recepcao',
    name: 'Recepção',
    description: 'Atendimento, hóspedes, reservas, quartos e solicitações do setor',
    sectors: ['recepcao'],
    layout: 'operational',
    defaultScope: 'sector',
    widgets: normalizeWorkspaceWidgets([
      { id: 'recepcao-metrics', type: 'metrics', title: 'Resumo operacional', order: 10, span: 'full', enabled: true },
      { id: 'recepcao-chegadas', type: 'arrivals', title: 'Chegadas de hoje', order: 20, span: 1, enabled: true },
      { id: 'recepcao-saidas', type: 'departures', title: 'Saídas de hoje', order: 30, span: 1, enabled: true },
      { id: 'recepcao-alertas', type: 'alerts', title: 'Alertas da recepção', order: 40, span: 2, enabled: true },
      { id: 'recepcao-quartos', type: 'room-map', title: 'Mapa de quartos', order: 50, span: 'full', enabled: true, dataSource: 'rooms', actions: { checkin: true, checkout: true, transferRoom: true } },
      { id: 'recepcao-hospedes', type: 'guests', title: 'Hóspedes', order: 60, span: 'full', enabled: true, dataSource: 'guests', permissions: { view: true, create: true, edit: true } },
      { id: 'recepcao-reservas', type: 'reservations-list', title: 'Reservas', order: 70, span: 'full', enabled: true, dataSource: 'reservations', permissions: { view: true, create: true, edit: true } },
      { id: 'recepcao-calendario-ocupacao', type: 'occupancy-calendar', title: 'Calendário de ocupação', order: 75, span: 'full', enabled: true, dataSource: 'composite', permissions: { view: true } },
      { id: 'recepcao-estadias', type: 'active-stays', title: 'Hóspedes hospedados', order: 80, span: 'full', enabled: true, dataSource: 'composite', actions: { checkout: true } },
      { id: 'recepcao-kanban', type: 'task-kanban', boardId: 'kanban-board-recepcao', title: 'Kanban de tarefas', order: 90, span: 'full', enabled: true, dataSource: 'kanban' },
    ]),
  },
];

const canonicalForRuntime = (definition: WorkspaceDefinition) =>
  definition.sectors.includes('recepcao')
    ? migrateWorkspaceDefinitionToCanonicalWidgets(definition).definition
    : definition;

export const getAllWorkspaceDefinitions = (hotelId = DEFAULT_WORKSPACE_HOTEL_ID): WorkspaceDefinition[] => {
  const overrides = loadWorkspaceOverrides(hotelId);
  const baseIds = new Set(workspaceRegistry.map(workspace => workspace.id));
  const custom = Object.values(overrides)
    .filter(workspace => !baseIds.has(workspace.id))
    .map(canonicalForRuntime);
  const bases = workspaceRegistry.map(base => canonicalForRuntime(mergeWorkspaceDefinition(base, hotelId)));
  return [...custom, ...bases];
};

export const getWorkspaceDefinition = (workspaceId: string, hotelId = DEFAULT_WORKSPACE_HOTEL_ID) =>
  getAllWorkspaceDefinitions(hotelId).find(workspace => workspace.id === workspaceId) || null;

export const resolveWorkspaceForSectors = (sectorIds: OperationalSectorId[], hotelId = DEFAULT_WORKSPACE_HOTEL_ID) =>
  getAllWorkspaceDefinitions(hotelId).find(workspace => workspace.sectors.some(sector => sectorIds.includes(sector))) || null;
