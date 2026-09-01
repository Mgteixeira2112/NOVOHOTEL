import { OperationalSectorId } from '../domain/operationalSectors';
import type { WorkspaceVisualPresentation } from './visualPresentation';

export type WorkspaceLayout = 'operational' | 'management';
export type WorkspaceViewport = 'desktop' | 'tablet' | 'mobile' | 'kds';
export type WorkspaceWidgetDisplay = 'panel' | 'button';
export type WorkspaceWidgetWidth = 'small' | 'medium' | 'large' | 'full';
export type WorkspaceWidgetHeight = 'auto' | 'low' | 'medium' | 'high';
export type WorkspaceWidgetVisualStyle = 'minimal' | 'standard' | 'highlight';
export type WorkspaceWidgetHeaderStyle = 'full' | 'compact' | 'hidden';
export type WorkspaceDevicePresentationMode = 'auto' | 'custom' | 'disabled';

export interface WorkspaceHeaderPresentation {
  showHotel?: boolean;
  showWorkspace?: boolean;
  showDate?: boolean;
  showTime?: boolean;
  showUser?: boolean;
  showStatus?: boolean;
  showOperationalDate?: boolean;
  hourFormat?: '24h' | '12h';
  timezone?: string;
}

export interface WorkspaceKdsPresentation {
  enabled?: boolean;
  orientation?: 'landscape' | 'portrait';
  density?: 'compact' | 'normal' | 'large';
  viewingDistance?: 'near' | 'medium' | 'far';
  fullscreen?: boolean;
  realtime?: boolean;
  hideAdministrativeControls?: boolean;
  hideEditingControls?: boolean;
}

export interface WorkspaceDevicePresentation {
  desktop?: Exclude<WorkspaceDevicePresentationMode, 'disabled'>;
  tablet?: Exclude<WorkspaceDevicePresentationMode, 'disabled'>;
  mobile?: Exclude<WorkspaceDevicePresentationMode, 'disabled'>;
  kds?: WorkspaceDevicePresentationMode;
}

export interface WorkspacePresentation {
  header?: WorkspaceHeaderPresentation;
  kds?: WorkspaceKdsPresentation;
  devices?: WorkspaceDevicePresentation;
}

export interface WorkspaceWidgetDevicePresentation {
  mode?: 'auto' | 'custom';
  hidden?: boolean;
  order?: number;
  display?: WorkspaceWidgetDisplay | 'summary' | 'highlight';
  width?: WorkspaceWidgetWidth;
  height?: WorkspaceWidgetHeight;
  visual?: WorkspaceWidgetVisualStyle;
  header?: WorkspaceWidgetHeaderStyle;
}

export interface WorkspaceWidgetPresentation {
  display?: WorkspaceWidgetDisplay;
  width?: WorkspaceWidgetWidth;
  height?: WorkspaceWidgetHeight;
  visual?: WorkspaceWidgetVisualStyle;
  header?: WorkspaceWidgetHeaderStyle;
  desktop?: WorkspaceWidgetDevicePresentation;
  tablet?: WorkspaceWidgetDevicePresentation;
  mobile?: WorkspaceWidgetDevicePresentation;
  kds?: WorkspaceWidgetDevicePresentation;
}

/**
 * Every visible or interactive element rendered inside a Workspace must be
 * represented by one of these widget types. Domain pages are not a Workspace
 * composition primitive anymore; they are only temporary migration adapters.
 */
export type WorkspaceWidgetType =
  | 'metrics'
  | 'dashboard'
  | 'stay-finance'
  | 'frigobar'
  | 'task-kanban'
  | 'room-map'
  | 'room-details'
  | 'guests'
  | 'active-stays'
  | 'arrivals'
  | 'departures'
  | 'alerts'
  | 'quick-actions'
  | 'reservations-list'
  | 'occupancy-calendar'
  | 'maintenance'
  | 'orders'
  | 'team'
  | 'user-access'
  | 'automation-admin'
  | 'settings-admin'
  | 'hotel-os-admin'
  | 'shortcuts'
  // Legacy aliases kept while existing saved definitions are migrated.
  | 'kanban-cards'
  | 'rooms-list'
  | 'checkins';

export type WorkspaceScope = 'mine' | 'sector';
/** Legacy layout contract kept only for persisted definitions created before presentation.width/display. */
export type WorkspaceWidgetSpan = 1 | 2 | 3 | 4 | 'full' | 'button';
export type WorkspaceWidgetDataSource =
  | 'dashboard'
  | 'finance'
  | 'frigobar'
  | 'kanban'
  | 'rooms'
  | 'reservations'
  | 'guests'
  | 'maintenance'
  | 'orders'
  | 'users'
  | 'composite';

export interface WorkspaceWidgetPermissions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  move?: boolean;
  assign?: boolean;
  archive?: boolean;
  delete?: boolean;
}

export interface WorkspaceWidgetActions {
  checkin?: boolean;
  checkout?: boolean;
  transferRoom?: boolean;
  createTask?: boolean;
  editRoom?: boolean;
  requestGovernance?: boolean;
  requestMaintenance?: boolean;
  consumeMinibar?: boolean;
  restockMinibar?: boolean;
  [action: string]: boolean | undefined;
}

export interface WorkspaceWidgetDefinition {
  id: string;
  type: WorkspaceWidgetType;
  boardId?: string;
  title?: string;
  order?: number;
  span?: WorkspaceWidgetSpan;
  enabled?: boolean;
  dataSource?: WorkspaceWidgetDataSource;
  filters?: Record<string, unknown>;
  actions?: WorkspaceWidgetActions;
  permissions?: WorkspaceWidgetPermissions;
  presentation?: WorkspaceWidgetPresentation;
  settings?: Record<string, unknown>;
}

export interface WorkspaceDefinition {
  id: string;
  name: string;
  description: string;
  sectors: OperationalSectorId[];
  layout: WorkspaceLayout;
  defaultScope: WorkspaceScope;
  presentation?: WorkspacePresentation;
  visualPresentation?: WorkspaceVisualPresentation;
  widgets: WorkspaceWidgetDefinition[];
}
