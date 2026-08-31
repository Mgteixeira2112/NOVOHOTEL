import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition, WorkspaceWidgetDefinition } from './types';
import { getWidgetAvailability } from './widgetCatalog';

export interface WorkspaceDefinitionIssue {
  code: 'missing-sector' | 'incompatible-widget' | 'duplicate-widget-id';
  message: string;
  widgetId?: string;
}

export interface WorkspaceDefinitionValidation {
  sector: OperationalSectorId | null;
  issues: WorkspaceDefinitionIssue[];
  incompatibleWidgets: WorkspaceWidgetDefinition[];
  valid: boolean;
}

/**
 * Pure validation boundary shared by the Factory and persistence-facing flows.
 * It only evaluates the Workspace composition contract; it never calls business
 * engines, Supabase or browser storage.
 */
export const validateWorkspaceDefinition = (definition: WorkspaceDefinition): WorkspaceDefinitionValidation => {
  const sector = definition.sectors[0] || null;
  const issues: WorkspaceDefinitionIssue[] = [];
  const incompatibleWidgets: WorkspaceWidgetDefinition[] = [];

  if (!sector) {
    issues.push({ code: 'missing-sector', message: 'O Workspace precisa estar vinculado a um setor operacional.' });
  }

  const seenIds = new Set<string>();
  for (const widget of definition.widgets) {
    if (seenIds.has(widget.id)) {
      issues.push({ code: 'duplicate-widget-id', widgetId: widget.id, message: `Widget duplicado na composição: ${widget.id}.` });
    }
    seenIds.add(widget.id);

    if (widget.enabled === false || !sector) continue;
    const availability = getWidgetAvailability(widget.type, sector);
    if (!availability.allowed) {
      incompatibleWidgets.push(widget);
      issues.push({
        code: 'incompatible-widget',
        widgetId: widget.id,
        message: availability.reason || `O widget ${widget.type} não é compatível com o setor ${sector}.`,
      });
    }
  }

  return { sector, issues, incompatibleWidgets, valid: issues.length === 0 };
};
