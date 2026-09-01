import React from 'react';
import { WorkspaceDefinition } from './types';
import { WidgetDrivenWorkspace } from './WidgetDrivenWorkspace';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

/**
 * Runtime único dos Workspaces.
 *
 * Regra oficial: o que aparece para o usuário é definido exclusivamente pela
 * definição atual salva na Central/Fábrica de Workspaces. O runtime não injeta
 * templates setoriais nem reescreve apresentação, composição ou widgets.
 *
 * Esta é a mesma estratégia usada pela prévia da Fábrica: a definição persistida
 * é entregue diretamente ao WidgetDrivenWorkspace.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) =>
  <WidgetDrivenWorkspace definition={definition} />;
