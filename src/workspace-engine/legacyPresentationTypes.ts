/**
 * Historical presentation types kept only for compatibility with persisted
 * Workspace definitions created before the visual presentation runtime.
 *
 * New runtime/editor code must use visualPresentation.ts instead of importing
 * these contracts directly.
 */
export type WorkspaceWidgetDisplay = 'panel' | 'button';
export type WorkspaceWidgetWidth = 'small' | 'medium' | 'large' | 'full';
export type WorkspaceWidgetHeight = 'auto' | 'low' | 'medium' | 'high';
export type WorkspaceWidgetVisualStyle = 'minimal' | 'standard' | 'highlight';
export type WorkspaceWidgetHeaderStyle = 'full' | 'compact' | 'hidden';
export type WorkspaceDevicePresentationMode = 'auto' | 'custom' | 'disabled';

export interface WorkspaceHeaderPresentation {
  showHotel?: boolean;
  showWorkspace?: boolean;
  showDate?: boolean;
  showTime?: boolean;
  showUser?: boolean;
  showStatus?: boolean;
  showOperationalDate?: boolean;
  hourFormat?: '24h' | '12h';
  timezone?: string;
}

export interface WorkspaceKdsPresentation {
  enabled?: boolean;
  orientation?: 'landscape' | 'portrait';
  density?: 'compact' | 'normal' | 'large';
  viewingDistance?: 'near' | 'medium' | 'far';
  fullscreen?: boolean;
  realtime?: boolean;
  hideAdministrativeControls?: boolean;
  hideEditingControls?: boolean;
}

export interface WorkspaceDevicePresentation {
  desktop?: Exclude<WorkspaceDevicePresentationMode, 'disabled'>;
  tablet?: Exclude<WorkspaceDevicePresentationMode, 'disabled'>;
  mobile?: Exclude<WorkspaceDevicePresentationMode, 'disabled'>;
  kds?: WorkspaceDevicePresentationMode;
}

export interface WorkspacePresentation {
  header?: WorkspaceHeaderPresentation;
  kds?: WorkspaceKdsPresentation;
  devices?: WorkspaceDevicePresentation;
}

export interface WorkspaceWidgetDevicePresentation {
  mode?: 'auto' | 'custom';
  hidden?: boolean;
  order?: number;
  display?: WorkspaceWidgetDisplay | 'summary' | 'highlight';
  width?: WorkspaceWidgetWidth;
  height?: WorkspaceWidgetHeight;
  visual?: WorkspaceWidgetVisualStyle;
  header?: WorkspaceWidgetHeaderStyle;
}

export interface WorkspaceWidgetPresentation {
  display?: WorkspaceWidgetDisplay;
  width?: WorkspaceWidgetWidth;
  height?: WorkspaceWidgetHeight;
  visual?: WorkspaceWidgetVisualStyle;
  header?: WorkspaceWidgetHeaderStyle;
  desktop?: WorkspaceWidgetDevicePresentation;
  tablet?: WorkspaceWidgetDevicePresentation;
  mobile?: WorkspaceWidgetDevicePresentation;
  kds?: WorkspaceWidgetDevicePresentation;
}

/** Historical layout field kept only while old serialized definitions exist. */
export type WorkspaceWidgetSpan = 1 | 2 | 3 | 4 | 'full' | 'button';
