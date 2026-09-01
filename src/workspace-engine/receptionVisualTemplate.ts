import type { WorkspaceWidgetDefinition } from './types';
import type {
  WorkspaceShortcutPlacement,
  WorkspaceShortcutSize,
  WorkspaceVisualPresentation,
  WorkspaceVisualSurface,
} from './visualPresentation';

const BACKGROUND_ASSET = '/workspace-templates/reception-classic.svg';

const widgetByType = (widgets: WorkspaceWidgetDefinition[], type: WorkspaceWidgetDefinition['type']) =>
  widgets.find(widget => widget.enabled !== false && widget.type === type);

const shortcut = (
  viewport: WorkspaceVisualSurface['viewport'],
  widget: WorkspaceWidgetDefinition | undefined,
  rect: WorkspaceShortcutPlacement['rect'],
  size: WorkspaceShortcutSize,
): WorkspaceShortcutPlacement | null => widget ? ({
  id: `shortcut-${viewport}-${widget.id}`,
  widgetId: widget.id,
  widgetType: widget.type,
  rect,
  size,
}) : null;

const compact = <T,>(items: Array<T | null>): T[] => items.filter((item): item is T => Boolean(item));

const desktopSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'desktop',
  template: {
    id: 'reception-classic-desktop',
    label: 'Recepção · Clássico operacional',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 16 / 9,
  },
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 15, height: 100 },
    widgetIds: compact([
      widgetByType(widgets, 'quick-actions')?.id || null,
      widgetByType(widgets, 'team')?.id || null,
    ]),
  },
  shortcuts: compact([
    shortcut('desktop', widgetByType(widgets, 'metrics'), { x: 18, y: 8, width: 28, height: 18 }, 'l'),
    shortcut('desktop', widgetByType(widgets, 'arrivals'), { x: 49, y: 8, width: 22, height: 18 }, 'm'),
    shortcut('desktop', widgetByType(widgets, 'departures'), { x: 74, y: 8, width: 22, height: 18 }, 'm'),
    shortcut('desktop', widgetByType(widgets, 'room-map'), { x: 18, y: 31, width: 52, height: 38 }, 'xl'),
    shortcut('desktop', widgetByType(widgets, 'alerts'), { x: 73, y: 31, width: 23, height: 18 }, 'm'),
    shortcut('desktop', widgetByType(widgets, 'task-kanban'), { x: 73, y: 53, width: 23, height: 32 }, 'l'),
  ]),
});

const tabletSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'tablet',
  template: {
    id: 'reception-classic-tablet',
    label: 'Recepção · Tablet operacional',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 4 / 3,
  },
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 18, height: 100 },
    widgetIds: compact([
      widgetByType(widgets, 'quick-actions')?.id || null,
      widgetByType(widgets, 'team')?.id || null,
    ]),
  },
  shortcuts: compact([
    shortcut('tablet', widgetByType(widgets, 'metrics'), { x: 21, y: 6, width: 36, height: 17 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'arrivals'), { x: 60, y: 6, width: 36, height: 17 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'departures'), { x: 21, y: 27, width: 36, height: 17 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'alerts'), { x: 60, y: 27, width: 36, height: 17 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'room-map'), { x: 21, y: 48, width: 75, height: 29 }, 'l'),
    shortcut('tablet', widgetByType(widgets, 'task-kanban'), { x: 21, y: 81, width: 75, height: 15 }, 'm'),
  ]),
});

const mobileSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'mobile',
  template: {
    id: 'reception-classic-mobile',
    label: 'Recepção · Celular',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 9 / 16,
  },
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 20, height: 100 },
    widgetIds: compact([
      widgetByType(widgets, 'quick-actions')?.id || null,
      widgetByType(widgets, 'team')?.id || null,
    ]),
  },
  shortcuts: compact([
    shortcut('mobile', widgetByType(widgets, 'metrics'), { x: 24, y: 4, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'arrivals'), { x: 24, y: 19, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'departures'), { x: 24, y: 34, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'alerts'), { x: 24, y: 49, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'room-map'), { x: 24, y: 64, width: 72, height: 17 }, 'm'),
    shortcut('mobile', widgetByType(widgets, 'task-kanban'), { x: 24, y: 84, width: 72, height: 12 }, 's'),
  ]),
});

const kdsSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'kds',
  template: {
    id: 'reception-classic-kds',
    label: 'Recepção · KDS / TV',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 16 / 9,
  },
  sidebar: {
    enabled: false,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 0, height: 100 },
    widgetIds: [],
  },
  shortcuts: compact([
    shortcut('kds', widgetByType(widgets, 'metrics'), { x: 4, y: 6, width: 28, height: 20 }, 'xl'),
    shortcut('kds', widgetByType(widgets, 'arrivals'), { x: 35, y: 6, width: 28, height: 20 }, 'l'),
    shortcut('kds', widgetByType(widgets, 'departures'), { x: 66, y: 6, width: 30, height: 20 }, 'l'),
    shortcut('kds', widgetByType(widgets, 'room-map'), { x: 4, y: 31, width: 59, height: 63 }, 'xl'),
    shortcut('kds', widgetByType(widgets, 'alerts'), { x: 66, y: 31, width: 30, height: 25 }, 'l'),
    shortcut('kds', widgetByType(widgets, 'task-kanban'), { x: 66, y: 61, width: 30, height: 33 }, 'xl'),
  ]),
});

/**
 * Presentation-only preset for Reception. It references existing widget IDs and
 * never owns data access, permissions, business rules or widget state.
 */
export const createReceptionVisualPresentation = (
  widgets: WorkspaceWidgetDefinition[],
): WorkspaceVisualPresentation => ({
  version: 2,
  surfaces: {
    desktop: desktopSurface(widgets),
    tablet: tabletSurface(widgets),
    mobile: mobileSurface(widgets),
    kds: kdsSurface(widgets),
  },
});
