import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition, WorkspaceWidgetDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

export type OfficialWorkspaceId = 'workspace-governanca' | 'workspace-recepcao';

interface OfficialWorkspaceTemplate {
  id: OfficialWorkspaceId;
  name: string;
  description: string;
  sector: OperationalSectorId;
  widgets: WorkspaceWidgetDefinition[];
}

/**
 * Official templates are inputs of the Workspace Factory, never runtime
 * instances by themselves. The registry receives only definitions generated
 * by createOfficialWorkspaceDefinition().
 *
 * Widget ids and the current compositions are intentionally preserved so that
 * existing hotel overrides keep matching the same base Workspace after the
 * cutover from the historical hardcoded registry.
 */
export const OFFICIAL_WORKSPACE_TEMPLATES: readonly OfficialWorkspaceTemplate[] = [
  {
    id: 'workspace-governanca',
    name: 'Governança',
    description: 'Operação de quartos e tarefas do setor',
    sector: 'governanca',
    widgets: [
      { id: 'governanca-metrics', type: 'metrics', boardId: 'kanban-board-governanca', order: 10, span: 'full' },
      { id: 'governanca-kanban', type: 'kanban-cards', boardId: 'kanban-board-governanca', title: 'Central de trabalho', order: 20, span: 'full' },
      { id: 'governanca-alerts', type: 'alerts', title: 'Alertas do setor', order: 30, span: 2, enabled: true },
      { id: 'governanca-actions', type: 'quick-actions', title: 'Ações rápidas', order: 40, span: 2, enabled: true },
    ],
  },
  {
    id: 'workspace-recepcao',
    name: 'Recepção',
    description: 'Atendimento, hóspedes, reservas, quartos e solicitações do setor',
    sector: 'recepcao',
    widgets: [
      { id: 'recepcao-metrics', type: 'metrics', title: 'Resumo operacional', order: 10, span: 'full', enabled: true },
      { id: 'recepcao-chegadas', type: 'arrivals', title: 'Chegadas de hoje', order: 20, span: 1, enabled: true },
      { id: 'recepcao-saidas', type: 'departures', title: 'Saídas de hoje', order: 30, span: 1, enabled: true },
      { id: 'recepcao-alertas', type: 'alerts', title: 'Alertas da recepção', order: 40, span: 2, enabled: true },
      { id: 'recepcao-quartos', type: 'room-map', title: 'Mapa de quartos', order: 50, span: 'full', enabled: true, dataSource: 'rooms', actions: { checkin: true, checkout: true, transferRoom: true } },
      { id: 'recepcao-hospedes', type: 'guests', title: 'Hóspedes', order: 60, span: 'full', enabled: true, dataSource: 'guests', permissions: { view: true, create: true, edit: true } },
      { id: 'recepcao-reservas', type: 'reservations-list', title: 'Reservas', order: 70, span: 'full', enabled: true, dataSource: 'reservations', permissions: { view: true, create: true, edit: true } },
      { id: 'recepcao-calendario-ocupacao', type: 'occupancy-calendar', title: 'Calendário de ocupação', order: 75, span: 'full', enabled: true, dataSource: 'composite', permissions: { view: true } },
      { id: 'recepcao-estadias', type: 'active-stays', title: 'Hóspedes hospedados', order: 80, span: 'full', enabled: true, dataSource: 'composite', actions: { checkout: true } },
      { id: 'recepcao-kanban', type: 'task-kanban', boardId: 'kanban-board-recepcao', title: 'Kanban de tarefas', order: 90, span: 'full', enabled: true, dataSource: 'kanban' },
    ],
  },
] as const;

export const createOfficialWorkspaceDefinition = (workspaceId: OfficialWorkspaceId): WorkspaceDefinition => {
  const template = OFFICIAL_WORKSPACE_TEMPLATES.find(item => item.id === workspaceId);
  if (!template) throw new Error(`Template oficial de Workspace não encontrado: ${workspaceId}`);

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    sectors: [template.sector],
    layout: 'operational',
    defaultScope: 'sector',
    widgets: normalizeWorkspaceWidgets(template.widgets.map(widget => ({
      ...widget,
      actions: widget.actions ? { ...widget.actions } : undefined,
      permissions: widget.permissions ? { ...widget.permissions } : undefined,
      presentation: widget.presentation ? { ...widget.presentation } : undefined,
      filters: widget.filters ? { ...widget.filters } : undefined,
      settings: widget.settings ? { ...widget.settings } : undefined,
    }))),
  };
};

export const createOfficialWorkspaceDefinitions = (): WorkspaceDefinition[] =>
  OFFICIAL_WORKSPACE_TEMPLATES.map(template => createOfficialWorkspaceDefinition(template.id));
