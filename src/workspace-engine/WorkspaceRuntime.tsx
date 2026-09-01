import React from 'react';
import { WorkspaceDefinition } from './types';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';
import { OperationalWorkspacePresentation } from './OperationalWorkspacePresentation';
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
  // setor ou pela sua composição canônica. Assim áreas personalizadas como
  // “Recepcionista” recebem a mesma apresentação mesmo quando foram criadas
  // antes da associação de setor, sem duplicar nenhum engine de negócio.
  const isReceptionComposition = definition.widgets.some(widget =>
    ['arrivals', 'departures', 'room-map', 'occupancy-calendar', 'active-stays'].includes(widget.type)
    || widget.boardId === 'kanban-board-recepcao',
  );
  if (definition.sectors.includes('recepcao') || isReceptionComposition) return <ReceptionWorkspaceShared definition={definition} />;

  // Todas as demais áreas usam o mesmo runtime dirigido por widgets, agora com
  // um baseline visual premium. A camada apenas completa apresentação ausente;
  // dados, RBAC, ações, engines e personalizações salvas continuam intactos.
  return <OperationalWorkspacePresentation definition={definition} />;
};
