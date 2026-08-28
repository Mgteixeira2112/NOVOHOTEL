import { WorkspaceDefinition, WorkspaceWidgetDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

export interface WorkspaceMigrationReport {
  definition: WorkspaceDefinition;
  migratedWidgetIds: string[];
  legacyWidgetIds: string[];
}

const migrateWidget = (widget: WorkspaceWidgetDefinition): WorkspaceWidgetDefinition[] => {
  if (widget.type === 'kanban-cards') return [{ ...widget, type: 'task-kanban' }];
  if (widget.type === 'rooms-list') return [{ ...widget, type: 'room-map' }];
  if (widget.type === 'checkins') {
    const baseOrder = widget.order ?? 0;
    return [
      {
        ...widget,
        id: `${widget.id}-arrivals`,
        type: 'arrivals',
        title: 'Chegadas',
        order: baseOrder,
        span: widget.span === 'full' ? 2 : widget.span,
        dataSource: 'reservations',
      },
      {
        ...widget,
        id: `${widget.id}-departures`,
        type: 'departures',
        title: 'Saídas',
        order: baseOrder + 1,
        span: widget.span === 'full' ? 2 : widget.span,
        dataSource: 'reservations',
      },
    ];
  }
  return [widget];
};

export const migrateWorkspaceDefinitionToCanonicalWidgets = (
  source: WorkspaceDefinition,
): WorkspaceMigrationReport => {
  const legacyWidgetIds = source.widgets
    .filter(widget => ['kanban-cards', 'rooms-list', 'checkins'].includes(widget.type))
    .map(widget => widget.id);

  const widgets = source.widgets.flatMap(migrateWidget);
  const migratedWidgetIds = widgets
    .filter(widget => !source.widgets.some(previous => previous.id === widget.id && previous.type === widget.type))
    .map(widget => widget.id);

  return {
    definition: {
      ...source,
      widgets: normalizeWorkspaceWidgets(widgets),
    },
    migratedWidgetIds,
    legacyWidgetIds,
  };
};

export const workspaceUsesOnlyCanonicalWidgets = (definition: WorkspaceDefinition) =>
  definition.widgets.every(widget => !['kanban-cards', 'rooms-list', 'checkins'].includes(widget.type));
