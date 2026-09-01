import React from 'react';
import { WorkspaceDefinition } from './types';
import { WidgetDrivenWorkspace } from './WidgetDrivenWorkspace';
import { VisualWorkspaceRuntime, hasVisualWorkspaceRuntime } from './VisualWorkspaceRuntime';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

/**
 * Runtime único dos Workspaces.
 *
 * Definitions that already participate in the visual presentation model use
 * the new renderer. Other Workspaces remain on the legacy compositor only as
 * a migration fallback until they receive their visual surface.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) =>
  hasVisualWorkspaceRuntime(definition)
    ? <VisualWorkspaceRuntime definition={definition} />
    : <WidgetDrivenWorkspace definition={definition} />;
