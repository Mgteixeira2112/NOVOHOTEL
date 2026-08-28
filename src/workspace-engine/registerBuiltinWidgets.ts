import { registerWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';
import { TaskKanbanWidget } from './widgets/TaskKanbanWidget';
import { ReceptionRoomMapWidget } from './widgets/ReceptionRoomMapWidget';
import { ArrivalsWidget, DeparturesWidget, ReceptionAlertsWidget, ReceptionSummaryWidget } from './widgets/ReceptionInfoWidgets';

let registered = false;

export const registerBuiltinWorkspaceWidgets = () => {
  if (registered) return;
  registered = true;
  registerWorkspaceWidgetRenderer('task-kanban', TaskKanbanWidget);
  registerWorkspaceWidgetRenderer('room-map', ReceptionRoomMapWidget);
  registerWorkspaceWidgetRenderer('arrivals', ArrivalsWidget);
  registerWorkspaceWidgetRenderer('departures', DeparturesWidget);
  registerWorkspaceWidgetRenderer('alerts', ReceptionAlertsWidget);
  registerWorkspaceWidgetRenderer('metrics', ReceptionSummaryWidget);
};
