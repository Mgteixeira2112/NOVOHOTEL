import { OperationalSectorId } from '../domain/operationalSectors';

export type WorkspaceLayout = 'operational' | 'management';
export type WorkspaceWidgetType = 'metrics' | 'kanban-cards';
export type WorkspaceScope = 'mine' | 'sector';

export interface WorkspaceWidgetDefinition {
  id: string;
  type: WorkspaceWidgetType;
  boardId?: string;
  title?: string;
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
