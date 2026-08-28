import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { DEFAULT_WORKSPACE_HOTEL_ID, mergeWorkspaceDefinition } from './workspaceConfigStore';

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
];

export const getWorkspaceDefinition = (workspaceId: string, hotelId = DEFAULT_WORKSPACE_HOTEL_ID) => {
  const base = workspaceRegistry.find(workspace => workspace.id === workspaceId);
  return base ? mergeWorkspaceDefinition(base, hotelId) : null;
};

export const resolveWorkspaceForSectors = (sectorIds: OperationalSectorId[], hotelId = DEFAULT_WORKSPACE_HOTEL_ID) => {
  const base = workspaceRegistry.find(workspace => workspace.sectors.some(sector => sectorIds.includes(sector)));
  return base ? mergeWorkspaceDefinition(base, hotelId) : null;
};
