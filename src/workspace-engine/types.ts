import { OperationalSectorId } from '../domain/operationalSectors';
import type {
  WorkspacePresentation,
  WorkspaceWidgetPresentation,
  WorkspaceWidgetSpan,
} from './legacyPresentationTypes';
import type { WorkspaceVisualPresentation } from './visualPresentation';

/**
 * Deprecated presentation contracts are re-exported only so historical callers
 * and persisted-definition adapters keep compiling during the migration.
 * New runtime/editor code must import the visual contract from visualPresentation.ts.
 */
export type {
  WorkspaceDevicePresentation,
  WorkspaceDevicePresentationMode,
  WorkspaceHeaderPresentation,
  WorkspaceKdsPresentation,
  WorkspacePresentation,
  WorkspaceWidgetDevicePresentation,
  WorkspaceWidgetDisplay,
  WorkspaceWidgetHeaderStyle,
  WorkspaceWidgetHeight,
  WorkspaceWidgetPresentation,
  WorkspaceWidgetSpan,
  WorkspaceWidgetVisualStyle,
  WorkspaceWidgetWidth,
} from './legacyPresentationTypes';

export type WorkspaceLayout = 'operational' | 'management';
export type WorkspaceViewport = 'desktop' | 'tablet' | 'mobile' | 'kds';

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
  /** @deprecated Compatibility-only field for historical serialized definitions. */
  span?: WorkspaceWidgetSpan;
  enabled?: boolean;
  dataSource?: WorkspaceWidgetDataSource;
  filters?: Record<string, unknown>;
  actions?: WorkspaceWidgetActions;
  permissions?: WorkspaceWidgetPermissions;
  /** @deprecated Compatibility-only field. Active layout lives in visualPresentation. */
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
  /** @deprecated Compatibility-only field. Active presentation lives in visualPresentation. */
  presentation?: WorkspacePresentation;
  visualPresentation?: WorkspaceVisualPresentation;
  widgets: WorkspaceWidgetDefinition[];
}
