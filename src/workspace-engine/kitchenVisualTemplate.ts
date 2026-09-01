import type { WorkspaceWidgetDefinition } from './types';
import type { WorkspaceShortcutPlacement, WorkspaceShortcutSize, WorkspaceVisualPresentation, WorkspaceVisualSurface } from './visualPresentation';

const BACKGROUND_ASSET = '/workspace-templates/kitchen-room-service.svg';
const widgetByType = (widgets: WorkspaceWidgetDefinition[], type: WorkspaceWidgetDefinition['type']) => widgets.find(widget => widget.enabled !== false && widget.type === type);
const shortcut = (viewport: WorkspaceVisualSurface['viewport'], widget: WorkspaceWidgetDefinition | undefined, rect: WorkspaceShortcutPlacement['rect'], size: WorkspaceShortcutSize): WorkspaceShortcutPlacement | null => widget ? ({ id: `shortcut-${viewport}-${widget.id}`, widgetId: widget.id, widgetType: widget.type, rect, size }) : null;
const compact = <T,>(items: Array<T | null>): T[] => items.filter((item): item is T => Boolean(item));

const surface = (viewport: WorkspaceVisualSurface['viewport'], widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualSurface => {
  const mobile = viewport === 'mobile';
  const tablet = viewport === 'tablet';
  const kds = viewport === 'kds';
  const sidebarWidth = kds ? 0 : mobile ? 20 : tablet ? 18 : 15;
  const mainX = kds ? 4 : sidebarWidth + 3;
  const mainWidth = 96 - mainX;
  return {
    viewport,
    template: { id: `kitchen-room-service-${viewport}`, label: `Cozinha & Room Service · ${viewport}`, backgroundAsset: BACKGROUND_ASSET, aspectRatio: mobile ? 9 / 16 : tablet ? 4 / 3 : 16 / 9 },
    sidebar: {
      enabled: !kds,
      anchor: 'left',
      rect: { x: 0, y: 0, width: sidebarWidth, height: 100 },
      widgetIds: compact([widgetByType(widgets, 'quick-actions')?.id || null, widgetByType(widgets, 'team')?.id || null]),
    },
    shortcuts: compact([
      shortcut(viewport, widgetByType(widgets, 'metrics'), { x: mainX, y: 6, width: mobile ? mainWidth : Math.round(mainWidth * .30), height: mobile ? 13 : 19 }, mobile ? 's' : 'l'),
      shortcut(viewport, widgetByType(widgets, 'alerts'), { x: mobile ? mainX : mainX + Math.round(mainWidth * .33), y: mobile ? 22 : 6, width: mobile ? mainWidth : Math.round(mainWidth * .25), height: mobile ? 13 : 19 }, mobile ? 's' : 'm'),
      shortcut(viewport, widgetByType(widgets, 'task-kanban'), { x: mainX, y: mobile ? 38 : 30, width: mobile ? mainWidth : Math.round(mainWidth * .58), height: mobile ? 35 : 64 }, 'xl'),
      shortcut(viewport, widgetByType(widgets, 'dashboard'), { x: mobile ? mainX : mainX + Math.round(mainWidth * .61), y: mobile ? 76 : 30, width: mobile ? mainWidth : Math.round(mainWidth * .39), height: mobile ? 19 : 64 }, mobile ? 'm' : 'xl'),
    ]),
  };
};

/** Presentation-only preset. Existing widgets remain the source of behavior and live data. */
export const createKitchenVisualPresentation = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualPresentation => ({
  version: 2,
  surfaces: {
    desktop: surface('desktop', widgets),
    tablet: surface('tablet', widgets),
    mobile: surface('mobile', widgets),
    kds: surface('kds', widgets),
  },
});
