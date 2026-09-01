import React from 'react';
import { WorkspaceDefinition } from './types';
import { VisualWorkspaceRuntime } from './VisualWorkspaceRuntime';

/** @deprecated Use VisualWorkspaceRuntime. Kept temporarily as a source-compatible alias while stacked PRs settle. */
export const WidgetDrivenWorkspace: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) =>
  <VisualWorkspaceRuntime definition={definition} />;
