import { OperationalSectorId } from '../domain/operationalSectors';

export type WorkspaceLayout = 'operational' | 'management';
export type WorkspaceWidgetType =
  | 'metrics'
  | 'kanban-cards'
  | 'alerts'
  | 'quick-actions'
  | 'rooms-list'
  | 'reservations-list'
  | 'checkins'
  | 'maintenance'
  | 'orders'
  | 'team'
  | 'shortcuts';
export type WorkspaceScope = 'mine' | 'sector';
export type WorkspaceWidgetSpan = 1 | 2 | 3 | 4 | 'full';

export interface WorkspaceWidgetDefinition {
  id: string;
  type: WorkspaceWidgetType;
  boardId?: string;
  title?: string;
  order?: number;
  span?: WorkspaceWidgetSpan;
  enabled?: boolean;
}

export interface WorkspaceDefinition {
  id: string;
  name: string;
  description: string;
  sectors: OperationalSectorId[];
  layout: WorkspaceLayout;
  defaultScope: WorkspaceScope;
  widgets: WorkspaceWidgetDefinition[];
}
