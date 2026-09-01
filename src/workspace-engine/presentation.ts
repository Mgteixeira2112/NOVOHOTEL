import {
  WorkspaceDefinition,
  WorkspaceDevicePresentationMode,
  WorkspaceViewport,
  WorkspaceWidgetDefinition,
  WorkspaceWidgetDisplay,
  WorkspaceWidgetDisplayMode,
  WorkspaceWidgetHeaderStyle,
  WorkspaceWidgetHeight,
  WorkspaceWidgetPresentation,
  WorkspaceWidgetSpan,
  WorkspaceWidgetVisualStyle,
  WorkspaceWidgetWidth,
} from './types';

export interface ResolvedWidgetPresentation {
  display: WorkspaceWidgetDisplay | 'summary';
  width: WorkspaceWidgetWidth;
  height: WorkspaceWidgetHeight;
  visual: WorkspaceWidgetVisualStyle;
  header: WorkspaceWidgetHeaderStyle;
  hidden: boolean;
  order?: number;
}

export const legacySpanToWidth = (span: WorkspaceWidgetSpan | undefined): WorkspaceWidgetWidth => {
  switch (span) {
    case 1:
    case 'button': return 'small';
    case 2: return 'medium';
    case 3: return 'large';
    case 4:
    case 'full':
    default: return 'full';
  }
};

export const widthToLegacySpan = (width: WorkspaceWidgetWidth): WorkspaceWidgetSpan => {
  switch (width) {
    case 'small': return 1;
    case 'medium': return 2;
    case 'large': return 3;
    case 'full': return 'full';
  }
};

export const normalizeWidgetPresentation = (
  widget: WorkspaceWidgetDefinition,
  defaultSpan?: WorkspaceWidgetSpan,
): WorkspaceWidgetPresentation => {
  const legacySpan = widget.span ?? defaultSpan ?? 'full';
  const presentation = widget.presentation || {};
  return {
    ...presentation,
    display: presentation.display || (legacySpan === 'button' ? 'button' : 'panel'),
    width: presentation.width || legacySpanToWidth(legacySpan),
    height: presentation.height || 'auto',
    visual: presentation.visual || 'standard',
    header: presentation.header || 'full',
  };
};

const hasOverrideValues = (value: WorkspaceWidgetPresentation['mobile'] | undefined) =>
  !!value && Object.entries(value).some(([key, field]) => key !== 'mode' && field !== undefined);

export const getWorkspaceDeviceMode = (
  definition: WorkspaceDefinition,
  viewport: WorkspaceViewport,
): WorkspaceDevicePresentationMode => {
  const configured = definition.presentation?.devices?.[viewport];
  if (configured) return configured;
  if (viewport === 'desktop') return 'auto';
  if (viewport === 'tablet') {
    return definition.widgets.some(widget => hasOverrideValues(widget.presentation?.tablet)) ? 'custom' : 'auto';
  }
  if (viewport === 'mobile') {
    return definition.widgets.some(widget => hasOverrideValues(widget.presentation?.mobile)) ? 'custom' : 'auto';
  }
  if (definition.presentation?.kds?.enabled === false) return 'disabled';
  if (definition.presentation?.kds?.enabled === true || definition.widgets.some(widget => hasOverrideValues(widget.presentation?.kds))) return 'custom';
  return 'disabled';
};

const customOverrideEnabled = (override: WorkspaceWidgetPresentation['mobile'] | undefined) =>
  override?.mode === 'custom' || (override?.mode === undefined && hasOverrideValues(override));

export const resolveWidgetPresentation = (
  definition: WorkspaceDefinition,
  widget: WorkspaceWidgetDefinition,
  viewport: WorkspaceViewport,
): ResolvedWidgetPresentation => {
  const base = normalizeWidgetPresentation(widget);
  const deviceMode = getWorkspaceDeviceMode(definition, viewport);

  // Tablet starts by inheriting the complete Desktop presentation contract.
  if (viewport === 'tablet' && deviceMode === 'auto') {
    return resolveWidgetPresentation(definition, widget, 'desktop');
  }

  const override = viewport === 'desktop'
    ? base.desktop
    : viewport === 'tablet'
      ? base.tablet
      : viewport === 'mobile'
        ? base.mobile
        : base.kds;
  const useCustom = deviceMode === 'custom' && customOverrideEnabled(override);

  const displayFromMode = (mode?: WorkspaceWidgetDisplayMode): ResolvedWidgetPresentation['display'] | undefined =>
    mode === 'button' || mode === 'shortcut' ? 'button' : mode === 'summary' ? 'summary' : mode === 'full' ? 'panel' : undefined;
  const modeFromOverride = override?.displayMode;
  let display: ResolvedWidgetPresentation['display'] = displayFromMode(viewport === 'desktop' ? base.desktop?.displayMode : modeFromOverride) || base.display || 'panel';
  let width = base.width || 'full';
  let height = base.height || 'auto';
  let visual = base.visual || 'standard';
  let header = base.header || 'full';
  let hidden = modeFromOverride === 'hidden';
  let order = widget.order;

  if (viewport === 'mobile' && deviceMode === 'auto') width = 'full';
  if (viewport === 'kds' && deviceMode === 'auto' && display === 'button') display = 'panel';

  if (useCustom && override) {
    if (override.displayMode === 'hidden') hidden = true;
    const modeDisplay = displayFromMode(override.displayMode);
    if (modeDisplay) display = modeDisplay;
    if (override.display === 'summary' && viewport === 'mobile') display = 'summary';
    else if (override.display === 'button' || override.display === 'panel') display = override.display;
    else if (override.display === 'highlight' && viewport === 'kds') {
      display = 'panel';
      visual = 'highlight';
    }
    width = override.width || width;
    height = override.height || height;
    visual = override.visual || visual;
    header = override.header || header;
    hidden = override.hidden === true;
    order = override.order ?? order;
  }

  return { display, width, height, visual, header, hidden, order };
};
