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
 * composição atual salva na Central/Fábrica de Workspaces. Adapters e páginas
 * setoriais antigas não podem injetar conteúdo fora dessa composição.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) =>
  <WidgetDrivenWorkspace definition={definition} />;
