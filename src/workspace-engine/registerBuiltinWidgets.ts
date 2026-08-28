import { registerWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';
import { TaskKanbanWidget } from './widgets/TaskKanbanWidget';
import { ReceptionRoomMapWidget } from './widgets/ReceptionRoomMapWidget';
import { ArrivalsWidget, DeparturesWidget, ReceptionAlertsWidget, ReceptionSummaryWidget } from './widgets/ReceptionInfoWidgets';
import { ActiveStaysWidget, GuestsWidget } from './widgets/ReceptionGuestStayWidgets';
import { ReservationsWidget } from './widgets/ReservationsWidget';
import { OccupancyCalendarWidget } from './widgets/OccupancyCalendarWidget';
import { DashboardWidget } from './widgets/DashboardWidget';

let registered = false;

export const registerBuiltinWorkspaceWidgets = () => {
  if (registered) return;
  registered = true;
  registerWorkspaceWidgetRenderer('dashboard', DashboardWidget);
  registerWorkspaceWidgetRenderer('task-kanban', TaskKanbanWidget);
  registerWorkspaceWidgetRenderer('room-map', ReceptionRoomMapWidget);
  registerWorkspaceWidgetRenderer('guests', GuestsWidget);
  registerWorkspaceWidgetRenderer('reservations-list', ReservationsWidget);
  registerWorkspaceWidgetRenderer('occupancy-calendar', OccupancyCalendarWidget);
  registerWorkspaceWidgetRenderer('active-stays', ActiveStaysWidget);
  registerWorkspaceWidgetRenderer('arrivals', ArrivalsWidget);
  registerWorkspaceWidgetRenderer('departures', DeparturesWidget);
  registerWorkspaceWidgetRenderer('alerts', ReceptionAlertsWidget);
  registerWorkspaceWidgetRenderer('metrics', ReceptionSummaryWidget);
};
