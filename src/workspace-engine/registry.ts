import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition } from './types';

export const workspaceRegistry: WorkspaceDefinition[] = [
  {
    id: 'workspace-governanca',
    name: 'Governança',
    description: 'Operação de quartos e tarefas do setor',
    sectors: ['governanca'],
    layout: 'operational',
    defaultScope: 'mine',
    widgets: [
      { id: 'governanca-metrics', type: 'metrics', boardId: 'kanban-board-governanca' },
      { id: 'governanca-kanban', type: 'kanban-cards', boardId: 'kanban-board-governanca', title: 'Central de trabalho' },
    ],
  },
];

export const resolveWorkspaceForSectors = (sectorIds: OperationalSectorId[]) =>
  workspaceRegistry.find(workspace => workspace.sectors.some(sector => sectorIds.includes(sector))) || null;
