import React from 'react';
import { WorkspaceDefinition, WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';

export interface WorkspaceWidgetRuntimeContext {
  workspace: WorkspaceDefinition;
  widget: WorkspaceWidgetDefinition;
}

export type WorkspaceWidgetRenderer = React.FC<WorkspaceWidgetRuntimeContext>;

/**
 * Canonical registry used by the Workspace Runtime.
 *
 * Architectural rule: a Workspace may only render functionality that enters
 * through this registry. Domain services remain outside the Workspace Engine;
 * widgets consume those services through their own adapters.
 */
const widgetRenderers = new Map<WorkspaceWidgetType, WorkspaceWidgetRenderer>();

export const registerWorkspaceWidgetRenderer = (
  type: WorkspaceWidgetType,
  renderer: WorkspaceWidgetRenderer,
) => {
  widgetRenderers.set(type, renderer);
};

export const unregisterWorkspaceWidgetRenderer = (type: WorkspaceWidgetType) => {
  widgetRenderers.delete(type);
};

export const getWorkspaceWidgetRenderer = (type: WorkspaceWidgetType) =>
  widgetRenderers.get(type) || null;

export const hasWorkspaceWidgetRenderer = (type: WorkspaceWidgetType) =>
  widgetRenderers.has(type);

export const listRegisteredWorkspaceWidgetTypes = () =>
  Array.from(widgetRenderers.keys());
