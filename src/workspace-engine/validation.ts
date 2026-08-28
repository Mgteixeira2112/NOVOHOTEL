import { WorkspaceDefinition } from './types';
import { getWidgetCatalogItem } from './widgetCatalog';

export interface WorkspaceValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateWorkspaceDefinition = (workspace: WorkspaceDefinition): WorkspaceValidationResult => {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (!workspace.id.trim()) errors.push('Workspace sem id.');
  if (!workspace.name.trim()) errors.push('Workspace sem nome.');
  if (workspace.sectors.length === 0) errors.push('Workspace sem setor vinculado.');

  workspace.widgets.forEach(widget => {
    if (ids.has(widget.id)) errors.push(`Widget duplicado: ${widget.id}.`);
    ids.add(widget.id);

    const catalogItem = getWidgetCatalogItem(widget.type);
    if (!catalogItem) errors.push(`Tipo de widget não registrado: ${widget.type}.`);
    if (catalogItem?.requiresBoard && !widget.boardId) {
      errors.push(`Widget ${widget.id} exige boardId.`);
    }
  });

  return { valid: errors.length === 0, errors };
};
