import React from 'react';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';
import { TaskKanbanWidget } from './TaskKanbanWidget';

const MAINTENANCE_BOARD_ID = 'kanban-board-manutencao';

export const MaintenanceWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ workspace, widget }) => {
  const boardId = widget.boardId || MAINTENANCE_BOARD_ID;
  const kanbanWidget = {
    ...widget,
    type: 'task-kanban' as const,
    boardId,
    title: widget.title || 'Manutenção',
    dataSource: 'kanban' as const,
  };

  return <div data-maintenance-widget data-maintenance-board={boardId}>
    <TaskKanbanWidget workspace={workspace} widget={kanbanWidget} />
  </div>;
};
