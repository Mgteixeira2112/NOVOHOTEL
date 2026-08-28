import { WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';

export interface WorkspaceWidgetCatalogItem {
  type: WorkspaceWidgetType;
  label: string;
  requiresBoard: boolean;
  defaultSpan: WorkspaceWidgetDefinition['span'];
}

export const workspaceWidgetCatalog: WorkspaceWidgetCatalogItem[] = [
  { type: 'metrics', label: 'Indicadores', requiresBoard: true, defaultSpan: 'full' },
  { type: 'kanban-cards', label: 'Kanban', requiresBoard: true, defaultSpan: 'full' },
  { type: 'alerts', label: 'Alertas', requiresBoard: false, defaultSpan: 2 },
  { type: 'quick-actions', label: 'Ações rápidas', requiresBoard: false, defaultSpan: 2 },
];

export const getWidgetCatalogItem = (type: WorkspaceWidgetType) =>
  workspaceWidgetCatalog.find(item => item.type === type) || null;

export const normalizeWorkspaceWidgets = (widgets: WorkspaceWidgetDefinition[]) =>
  widgets
    .filter(widget => widget.enabled !== false)
    .map((widget, index) => ({
      ...widget,
      order: widget.order ?? index,
      span: widget.span ?? getWidgetCatalogItem(widget.type)?.defaultSpan ?? 'full',
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
