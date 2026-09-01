import React from 'react';
import { WorkspaceDefinition } from './types';
import { VisualWorkspaceRuntime } from './VisualWorkspaceRuntime';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

/**
 * Runtime único dos Workspaces.
 *
 * Toda apresentação operacional passa exclusivamente pelo renderer visual.
 * Widgets continuam sendo resolvidos pelo registry e abertos pelo host genérico.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) =>
  <VisualWorkspaceRuntime definition={definition} />;
