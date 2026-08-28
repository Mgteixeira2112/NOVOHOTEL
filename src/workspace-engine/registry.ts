import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { DEFAULT_WORKSPACE_HOTEL_ID, loadWorkspaceOverrides, mergeWorkspaceDefinition } from './workspaceConfigStore';

export const workspaceRegistry: WorkspaceDefinition[] = [
  {
    id: 'workspace-governanca',
    name: 'Governança',
    description: 'Operação de quartos e tarefas do setor',
    sectors: ['governanca'],
    layout: 'operational',
    defaultScope: 'mine',
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
    defaultScope: 'mine',
    widgets: normalizeWorkspaceWidgets([
      { id: 'recepcao-checkins', type: 'checkins', title: 'Chegadas e saídas', order: 10, span: 2, enabled: true },
      { id: 'recepcao-quartos', type: 'rooms-list', title: 'Quartos', order: 20, span: 2, enabled: true },
      { id: 'recepcao-alertas', type: 'alerts', title: 'Alertas da recepção', order: 30, span: 2, enabled: true },
      { id: 'recepcao-kanban', type: 'kanban-cards', boardId: 'kanban-board-recepcao', title: 'Central de atendimento', order: 40, span: 'full', enabled: true },
    ]),
  },
];

export const getAllWorkspaceDefinitions = (hotelId = DEFAULT_WORKSPACE_HOTEL_ID): WorkspaceDefinition[] => {
  const overrides = loadWorkspaceOverrides(hotelId);
  const baseIds = new Set(workspaceRegistry.map(workspace => workspace.id));
  const custom = Object.values(overrides).filter(workspace => !baseIds.has(workspace.id));
  const bases = workspaceRegistry.map(base => mergeWorkspaceDefinition(base, hotelId));
  return [...custom, ...bases];
};

export const getWorkspaceDefinition = (workspaceId: string, hotelId = DEFAULT_WORKSPACE_HOTEL_ID) =>
  getAllWorkspaceDefinitions(hotelId).find(workspace => workspace.id === workspaceId) || null;

export const resolveWorkspaceForSectors = (sectorIds: OperationalSectorId[], hotelId = DEFAULT_WORKSPACE_HOTEL_ID) =>
  getAllWorkspaceDefinitions(hotelId).find(workspace => workspace.sectors.some(sector => sectorIds.includes(sector))) || null;
