import type { WorkspaceWidgetDefinition } from './types';
import type { WorkspaceShortcutPlacement, WorkspaceShortcutSize, WorkspaceVisualPresentation, WorkspaceVisualSurface } from './visualPresentation';

const BACKGROUND_ASSET = '/workspace-templates/operations-overview.svg';
const widgetByType = (widgets: WorkspaceWidgetDefinition[], type: WorkspaceWidgetDefinition['type']) => widgets.find(widget => widget.enabled !== false && widget.type === type);
const compact = <T,>(items: Array<T | null>): T[] => items.filter((item): item is T => Boolean(item));
const shortcut = (viewport: WorkspaceVisualSurface['viewport'], widget: WorkspaceWidgetDefinition | undefined, rect: WorkspaceShortcutPlacement['rect'], size: WorkspaceShortcutSize): WorkspaceShortcutPlacement | null => widget ? ({ id: `shortcut-${viewport}-${widget.id}`, widgetId: widget.id, widgetType: widget.type, rect, size }) : null;

const surface = (viewport: WorkspaceVisualSurface['viewport'], widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => {
  const mobile = viewport === 'mobile';
  const tablet = viewport === 'tablet';
  const kds = viewport === 'kds';
  const sidebarWidth = kds ? 0 : mobile ? 20 : tablet ? 18 : 15;
  const x = kds ? 4 : sidebarWidth + 3;
  const width = 96 - x;
  return {
    viewport,
    template: { id: `operations-overview-${viewport}`, label: `Operação Geral · ${viewport}`, backgroundAsset: BACKGROUND_ASSET, aspectRatio: mobile ? 9 / 16 : tablet ? 4 / 3 : 16 / 9 },
    sidebar: { enabled: !kds, anchor: 'left', rect: { x: 0, y: 0, width: sidebarWidth, height: 100 }, widgetIds: compact([widgetByType(widgets, 'quick-actions')?.id || null, widgetByType(widgets, 'frigobar')?.id || null, widgetByType(widgets, 'team')?.id || null]) },
    shortcuts: compact([
      shortcut(viewport, widgetByType(widgets, 'metrics'), { x, y: 6, width: mobile ? width : Math.round(width * .34), height: mobile ? 13 : 19 }, mobile ? 's' : 'l'),
      shortcut(viewport, widgetByType(widgets, 'alerts'), { x: mobile ? x : x + Math.round(width * .37), y: mobile ? 22 : 6, width: mobile ? width : Math.round(width * .28), height: mobile ? 13 : 19 }, mobile ? 's' : 'm'),
      shortcut(viewport, widgetByType(widgets, 'dashboard'), { x, y: mobile ? 38 : 30, width: mobile ? width : Math.round(width * .58), height: mobile ? 27 : 62 }, 'xl'),
      shortcut(viewport, widgetByType(widgets, 'task-kanban'), { x: mobile ? x : x + Math.round(width * .61), y: mobile ? 68 : 30, width: mobile ? width : Math.round(width * .39), height: mobile ? 27 : 62 }, 'xl'),
    ]),
  };
};

/** Presentation-only preset for the transversal operational Workspace. */
export const createOperationsVisualPresentation = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualPresentation => ({ version: 2, surfaces: { desktop: surface('desktop', widgets), tablet: surface('tablet', widgets), mobile: surface('mobile', widgets), kds: surface('kds', widgets) } });
