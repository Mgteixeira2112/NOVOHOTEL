import type { WorkspaceWidgetDefinition } from './types';
import type {
  WorkspaceShortcutPlacement,
  WorkspaceShortcutSize,
  WorkspaceVisualPresentation,
  WorkspaceVisualSurface,
} from './visualPresentation';

const BACKGROUND_ASSET = '/workspace-templates/governance-classic.svg';

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
    id: 'governance-classic-desktop',
    label: 'Governança · Operação de quartos',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 16 / 9,
  },
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 15, height: 100 },
    widgetIds: compact([
      widgetByType(widgets, 'quick-actions')?.id || null,
      widgetByType(widgets, 'frigobar')?.id || null,
      widgetByType(widgets, 'team')?.id || null,
    ]),
  },
  shortcuts: compact([
    shortcut('desktop', widgetByType(widgets, 'metrics'), { x: 18, y: 7, width: 27, height: 18 }, 'l'),
    shortcut('desktop', widgetByType(widgets, 'alerts'), { x: 48, y: 7, width: 22, height: 18 }, 'm'),
    shortcut('desktop', widgetByType(widgets, 'room-details'), { x: 73, y: 7, width: 23, height: 18 }, 'm'),
    shortcut('desktop', widgetByType(widgets, 'room-map'), { x: 18, y: 30, width: 52, height: 56 }, 'xl'),
    shortcut('desktop', widgetByType(widgets, 'task-kanban'), { x: 73, y: 30, width: 23, height: 56 }, 'xl'),
  ]),
});

const tabletSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'tablet',
  template: {
    id: 'governance-classic-tablet',
    label: 'Governança · Tablet',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 4 / 3,
  },
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 18, height: 100 },
    widgetIds: compact([
      widgetByType(widgets, 'quick-actions')?.id || null,
      widgetByType(widgets, 'frigobar')?.id || null,
      widgetByType(widgets, 'team')?.id || null,
    ]),
  },
  shortcuts: compact([
    shortcut('tablet', widgetByType(widgets, 'metrics'), { x: 21, y: 6, width: 36, height: 17 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'alerts'), { x: 60, y: 6, width: 36, height: 17 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'room-details'), { x: 21, y: 27, width: 75, height: 15 }, 'm'),
    shortcut('tablet', widgetByType(widgets, 'room-map'), { x: 21, y: 46, width: 75, height: 29 }, 'l'),
    shortcut('tablet', widgetByType(widgets, 'task-kanban'), { x: 21, y: 79, width: 75, height: 17 }, 'm'),
  ]),
});

const mobileSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'mobile',
  template: {
    id: 'governance-classic-mobile',
    label: 'Governança · Celular',
    backgroundAsset: BACKGROUND_ASSET,
    aspectRatio: 9 / 16,
  },
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 20, height: 100 },
    widgetIds: compact([
      widgetByType(widgets, 'quick-actions')?.id || null,
      widgetByType(widgets, 'frigobar')?.id || null,
      widgetByType(widgets, 'team')?.id || null,
    ]),
  },
  shortcuts: compact([
    shortcut('mobile', widgetByType(widgets, 'metrics'), { x: 24, y: 4, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'alerts'), { x: 24, y: 19, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'room-details'), { x: 24, y: 34, width: 72, height: 12 }, 's'),
    shortcut('mobile', widgetByType(widgets, 'room-map'), { x: 24, y: 49, width: 72, height: 24 }, 'm'),
    shortcut('mobile', widgetByType(widgets, 'task-kanban'), { x: 24, y: 77, width: 72, height: 19 }, 'm'),
  ]),
});

const kdsSurface = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => ({
  viewport: 'kds',
  template: {
    id: 'governance-classic-kds',
    label: 'Governança · KDS / TV',
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
    shortcut('kds', widgetByType(widgets, 'alerts'), { x: 35, y: 6, width: 28, height: 20 }, 'l'),
    shortcut('kds', widgetByType(widgets, 'room-details'), { x: 66, y: 6, width: 30, height: 20 }, 'l'),
    shortcut('kds', widgetByType(widgets, 'room-map'), { x: 4, y: 31, width: 59, height: 63 }, 'xl'),
    shortcut('kds', widgetByType(widgets, 'task-kanban'), { x: 66, y: 31, width: 30, height: 63 }, 'xl'),
  ]),
});

/** Presentation-only preset for Governance using only existing widget IDs. */
export const createGovernanceVisualPresentation = (
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
