import React from 'react';
import { WorkspaceDefinition } from './types';
import { VisualWorkspaceRuntime } from './VisualWorkspaceRuntime';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

/**
 * Runtime único dos Workspaces.
 *
 * A camada operacional passa a usar exclusivamente o renderer visual. O antigo
 * WidgetDrivenWorkspace permanece temporariamente no código apenas como apoio
 * de comparação/Preview durante a retirada dos controles legados, mas não é
 * mais uma rota de execução do Workspace real.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) =>
  <VisualWorkspaceRuntime definition={definition} />;
