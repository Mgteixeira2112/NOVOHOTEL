import React from 'react';
import { WorkspaceDefinition } from './types';
import { WidgetDrivenWorkspace } from './WidgetDrivenWorkspace';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';
import { ReceptionWorkspaceShared } from '../modules/recepcao/ReceptionWorkspaceShared';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

/**
 * Runtime único dos Workspaces.
 *
 * A definição continua vindo da Central/Fábrica de Workspaces. A Recepção usa
 * a apresentação visual operacional aprovada; as demais áreas permanecem no
 * runtime dirigido diretamente pelos widgets da definição persistida.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) => {
  const isReception = definition.sectors.includes('recepcao') || definition.widgets.some(widget =>
    ['arrivals', 'departures', 'room-map', 'occupancy-calendar', 'active-stays'].includes(widget.type)
    || widget.boardId === 'kanban-board-recepcao',
  );

  if (isReception) return <ReceptionWorkspaceShared definition={definition} />;
  return <WidgetDrivenWorkspace definition={definition} />;
};
