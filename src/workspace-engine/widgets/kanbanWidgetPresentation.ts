import { WorkspaceWidgetDefinition } from '../types';

export interface KanbanWidgetPresentationSettings {
  version: 1;
  /**
   * undefined = configuração ainda não personalizada, portanto exibe todas as colunas.
   * [] = usuário escolheu não exibir nenhuma coluna.
   */
  visibleColumnIds?: string[];
}

export const readKanbanWidgetPresentationSettings = (
  widget: WorkspaceWidgetDefinition,
): KanbanWidgetPresentationSettings => {
  const raw = widget.settings?.kanbanPresentation as Partial<KanbanWidgetPresentationSettings> | undefined;
  const visibleColumnIds = Array.isArray(raw?.visibleColumnIds)
    ? raw.visibleColumnIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : undefined;

  return {
    version: 1,
    visibleColumnIds,
  };
};
