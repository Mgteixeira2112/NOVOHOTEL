import React from 'react';
import { WorkspaceDefinition } from './types';
import { WidgetDrivenWorkspace } from './WidgetDrivenWorkspace';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';
import { ReceptionWorkspaceShared } from '../modules/recepcao/ReceptionWorkspaceShared';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

/**
 * Runtime único dos Workspaces.
 *
 * Regra oficial: o que aparece para o usuário é definido exclusivamente pela
 * composição atual salva na Central/Fábrica de Workspaces. Adapters e páginas
 * setoriais antigas não podem injetar conteúdo fora dessa composição.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) => {
  // A Recepção possui um template operacional próprio. A decisão é feita pelo
  // setor, e não pelo ID, para que áreas personalizadas como “Recepcionista”
  // recebam a mesma apresentação sem duplicar nenhum engine de negócio.
  if (definition.sectors.includes('recepcao')) return <ReceptionWorkspaceShared definition={definition} />;
  return <WidgetDrivenWorkspace definition={definition} />;
};
