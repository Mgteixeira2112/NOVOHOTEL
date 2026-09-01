import type { CSSProperties } from 'react';
import type { WorkspaceWidgetDefinition, WorkspaceWidgetWidth } from './types';

const WIDTH_PERCENT: Record<WorkspaceWidgetWidth, number> = {
  small: 25,
  medium: 50,
  large: 75,
  full: 100,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const hasDesktopSpatialPosition = (widget: WorkspaceWidgetDefinition): boolean => {
  const desktop = widget.presentation?.desktop;
  return typeof desktop?.x === 'number' && typeof desktop?.y === 'number';
};

export const desktopWidthPercent = (width: WorkspaceWidgetWidth): number => WIDTH_PERCENT[width];

export const desktopSpatialStyle = (
  widget: WorkspaceWidgetDefinition,
  width: WorkspaceWidgetWidth,
): CSSProperties | undefined => {
  if (!hasDesktopSpatialPosition(widget)) return undefined;
  const desktop = widget.presentation?.desktop;
  const widthPercent = desktopWidthPercent(width);
  const maxLeft = Math.max(0, 100 - widthPercent);
  const left = clamp(desktop?.x ?? 0, 0, maxLeft);
  const top = Math.max(0, desktop?.y ?? 0);

  return {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}px`,
    width: `${widthPercent}%`,
  };
};

export const desktopSpatialMinHeight = (
  widgets: WorkspaceWidgetDefinition[],
  configuredMinHeight = 720,
): number => {
  const largestTop = widgets.reduce((max, widget) => {
    const top = widget.presentation?.desktop?.y;
    return typeof top === 'number' ? Math.max(max, Math.max(0, top)) : max;
  }, 0);
  return Math.max(480, configuredMinHeight, largestTop + 320);
};
