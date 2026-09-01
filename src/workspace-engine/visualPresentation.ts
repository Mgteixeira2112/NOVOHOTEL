import type { WorkspaceViewport, WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';

/**
 * Foundation for the next Workspace presentation model.
 *
 * This module is intentionally presentation-only. It must not own queries,
 * mutations, permissions, domain rules or widget business state.
 */
export const WORKSPACE_VISUAL_VIEWPORTS: readonly WorkspaceViewport[] = [
  'desktop',
  'tablet',
  'mobile',
  'kds',
] as const;

export type WorkspaceShortcutSize = 's' | 'm' | 'l' | 'xl';

export const WORKSPACE_SHORTCUT_SIZES: readonly WorkspaceShortcutSize[] = [
  's',
  'm',
  'l',
  'xl',
] as const;

export interface WorkspaceNormalizedRect {
  /** Horizontal position in the template canvas, from 0 to 100. */
  x: number;
  /** Vertical position in the template canvas, from 0 to 100. */
  y: number;
  /** Width as a percentage of the template canvas, from 0 to 100. */
  width: number;
  /** Height as a percentage of the template canvas, from 0 to 100. */
  height: number;
}

export interface WorkspaceVisualTemplateRef {
  id: string;
  /** Human-readable name shown in the Factory. */
  label: string;
  /** Static/decorative background asset. Never a source of operational data. */
  backgroundAsset: string;
  /** Optional native aspect ratio used by the visual editor. */
  aspectRatio?: number;
}

export interface WorkspaceShortcutPlacement {
  id: string;
  widgetId: string;
  widgetType: WorkspaceWidgetType;
  rect: WorkspaceNormalizedRect;
  /** Controls information density; larger sizes expose richer summaries. */
  size: WorkspaceShortcutSize;
  /** Optional presentation adapter key. It cannot contain business rules. */
  summaryKey?: string;
}

export interface WorkspaceSidebarPlacement {
  enabled: boolean;
  /** The universal Workspace navigation stays anchored to the left region. */
  anchor: 'left';
  rect: WorkspaceNormalizedRect;
  /** Widget IDs shown as direct entries in the sidebar, in visual order. */
  widgetIds: string[];
}

export interface WorkspaceVisualSurface {
  viewport: WorkspaceViewport;
  template?: WorkspaceVisualTemplateRef;
  shortcuts: WorkspaceShortcutPlacement[];
  sidebar: WorkspaceSidebarPlacement;
}

export interface WorkspaceVisualPresentation {
  version: 2;
  surfaces: Partial<Record<WorkspaceViewport, WorkspaceVisualSurface>>;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

/**
 * Keeps drag/resize persistence relative to the template instead of storing
 * device-specific pixels. The editor may snap before calling this helper.
 */
export const normalizeWorkspaceRect = (rect: WorkspaceNormalizedRect): WorkspaceNormalizedRect => {
  const width = clampPercent(rect.width);
  const height = clampPercent(rect.height);
  return {
    x: Math.min(clampPercent(rect.x), 100 - width),
    y: Math.min(clampPercent(rect.y), 100 - height),
    width,
    height,
  };
};

export const createWorkspaceVisualSurface = (viewport: WorkspaceViewport): WorkspaceVisualSurface => ({
  viewport,
  shortcuts: [],
  sidebar: {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 16, height: 100 },
    widgetIds: [],
  },
});

export const getWorkspaceVisualSurface = (
  presentation: WorkspaceVisualPresentation | undefined,
  viewport: WorkspaceViewport,
): WorkspaceVisualSurface => presentation?.surfaces[viewport] || createWorkspaceVisualSurface(viewport);

export const setWorkspaceVisualSurface = (
  presentation: WorkspaceVisualPresentation | undefined,
  surface: WorkspaceVisualSurface,
): WorkspaceVisualPresentation => ({
  version: 2,
  surfaces: {
    ...(presentation?.surfaces || {}),
    [surface.viewport]: surface,
  },
});

const defaultShortcutRect = (surface: WorkspaceVisualSurface): WorkspaceNormalizedRect => {
  const index = surface.shortcuts.length;
  const column = index % 3;
  const row = Math.floor(index / 3) % 4;
  const startX = Math.max(18, surface.sidebar.enabled ? surface.sidebar.rect.x + surface.sidebar.rect.width + 2 : 4);
  return normalizeWorkspaceRect({
    x: startX + column * 25,
    y: 5 + row * 22,
    width: 22,
    height: 18,
  });
};

/** A widget belongs to at most one visual destination on a surface. */
export const placeWidgetAsShortcut = (
  surface: WorkspaceVisualSurface,
  widget: WorkspaceWidgetDefinition,
): WorkspaceVisualSurface => {
  const existing = surface.shortcuts.find(item => item.widgetId === widget.id);
  return {
    ...surface,
    sidebar: {
      ...surface.sidebar,
      widgetIds: surface.sidebar.widgetIds.filter(id => id !== widget.id),
    },
    shortcuts: existing
      ? surface.shortcuts
      : [
          ...surface.shortcuts,
          {
            id: `shortcut-${surface.viewport}-${widget.id}`,
            widgetId: widget.id,
            widgetType: widget.type,
            rect: defaultShortcutRect(surface),
            size: 'm',
          },
        ],
  };
};

export const placeWidgetInSidebar = (
  surface: WorkspaceVisualSurface,
  widgetId: string,
): WorkspaceVisualSurface => ({
  ...surface,
  sidebar: {
    ...surface.sidebar,
    enabled: true,
    widgetIds: surface.sidebar.widgetIds.includes(widgetId)
      ? surface.sidebar.widgetIds
      : [...surface.sidebar.widgetIds, widgetId],
  },
  shortcuts: surface.shortcuts.filter(item => item.widgetId !== widgetId),
});

export const removeWidgetFromVisualSurface = (
  surface: WorkspaceVisualSurface,
  widgetId: string,
): WorkspaceVisualSurface => ({
  ...surface,
  sidebar: {
    ...surface.sidebar,
    widgetIds: surface.sidebar.widgetIds.filter(id => id !== widgetId),
  },
  shortcuts: surface.shortcuts.filter(item => item.widgetId !== widgetId),
});

/**
 * The semantic shortcut size is deliberately independent from raw pixels.
 * Each presentation adapter will decide which real-data fields are visible
 * at S, M, L and XL while the complete widget remains the click destination.
 */
export const getShortcutInformationLevel = (size: WorkspaceShortcutSize): 1 | 2 | 3 | 4 =>
  WORKSPACE_SHORTCUT_SIZES.indexOf(size) + 1 as 1 | 2 | 3 | 4;
