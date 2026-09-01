import type { WorkspaceWidgetDefinition } from './types';
import type { WorkspaceShortcutPlacement, WorkspaceShortcutSize, WorkspaceVisualPresentation, WorkspaceVisualSurface } from './visualPresentation';

const BACKGROUND_ASSET = '/workspace-templates/admin-management.svg';
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
    template: { id: `admin-management-${viewport}`, label: `Administrativo · Gestão ${viewport}`, backgroundAsset: BACKGROUND_ASSET, aspectRatio: mobile ? 9 / 16 : tablet ? 4 / 3 : 16 / 9 },
    sidebar: {
      enabled: !kds,
      anchor: 'left',
      rect: { x: 0, y: 0, width: sidebarWidth, height: 100 },
      widgetIds: compact([
        widgetByType(widgets, 'hotel-os-admin')?.id || null,
        widgetByType(widgets, 'user-access')?.id || null,
        widgetByType(widgets, 'automation-admin')?.id || null,
        widgetByType(widgets, 'settings-admin')?.id || null,
      ]),
    },
    shortcuts: compact([
      shortcut(viewport, widgetByType(widgets, 'hotel-os-admin'), { x, y: 7, width: mobile ? width : Math.round(width * .47), height: mobile ? 20 : 36 }, 'xl'),
      shortcut(viewport, widgetByType(widgets, 'user-access'), { x: mobile ? x : x + Math.round(width * .51), y: mobile ? 30 : 7, width: mobile ? width : Math.round(width * .49), height: mobile ? 18 : 36 }, mobile ? 'm' : 'l'),
      shortcut(viewport, widgetByType(widgets, 'automation-admin'), { x, y: mobile ? 51 : 48, width: mobile ? width : Math.round(width * .47), height: mobile ? 18 : 38 }, mobile ? 'm' : 'l'),
      shortcut(viewport, widgetByType(widgets, 'settings-admin'), { x: mobile ? x : x + Math.round(width * .51), y: mobile ? 72 : 48, width: mobile ? width : Math.round(width * .49), height: mobile ? 22 : 38 }, mobile ? 'l' : 'xl'),
    ]),
  };
};

/** Presentation-only preset for the transversal management Workspace. */
export const createAdminVisualPresentation = (widgets: WorkspaceWidgetDefinition[]): WorkspaceVisualPresentation => ({ version: 2, surfaces: { desktop: surface('desktop', widgets), tablet: surface('tablet', widgets), mobile: surface('mobile', widgets), kds: surface('kds', widgets) } });
