import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceBackgroundPresetId, WorkspaceDefinition, WorkspaceLayout, WorkspaceScope, WorkspaceWidgetDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { createWorkspaceDefinition } from './workspaceFactory';

export type OfficialWorkspaceId =
  | 'workspace-governanca'
  | 'workspace-recepcao'
  | 'workspace-operacao'
  | 'workspace-manutencao'
  | 'workspace-cozinha'
  | 'workspace-financeiro'
  | 'workspace-administrativo'
  | 'workspace-administrativo-hotel'
  | 'workspace-administrativo-sistema';

interface OfficialWorkspaceTemplate {
  id: OfficialWorkspaceId;
  name: string;
  description: string;
  sectors: OperationalSectorId[];
  layout: WorkspaceLayout;
  defaultScope: WorkspaceScope;
  presentation?: WorkspaceDefinition['presentation'];
  widgets: WorkspaceWidgetDefinition[];
}

const createSectorWidgets = (id: OfficialWorkspaceId, name: string, sector: OperationalSectorId): WorkspaceWidgetDefinition[] =>
  createWorkspaceDefinition({ id, name, sector }).widgets;

const createVisualPresentation = (backgroundPreset: WorkspaceBackgroundPresetId): WorkspaceDefinition['presentation'] => ({
  surface: {
    backgroundPreset,
    backgroundFit: 'cover',
    backgroundPosition: 'center',
    overlayOpacity: 0,
    minHeight: 760,
  },
  sidebar: {
    enabled: false,
    x: 2,
    y: 110,
    width: 240,
    itemSize: 'normal',
    visual: 'glass',
  },
});

/**
 * Official templates are inputs of the Workspace Factory, never runtime
 * instances by themselves. The registry receives only definitions generated
 * by createOfficialWorkspaceDefinition().
 *
 * Widget ids and the current compositions for Governança and Recepção are
 * intentionally preserved so that existing hotel overrides keep matching the
 * same base Workspace after the cutover from the historical hardcoded registry.
 * New official operational sectors reuse createWorkspaceDefinition() so their
 * composition remains owned by the existing Workspace Factory instead of being
 * duplicated. Administrative and financial management are represented as
 * Workspace layouts, not as new operational sectors.
 */
export const OFFICIAL_WORKSPACE_TEMPLATES: readonly OfficialWorkspaceTemplate[] = [
  {
    id: 'workspace-governanca',
    name: 'Governança',
    description: 'Operação de quartos e tarefas do setor',
    sectors: ['governanca'],
    layout: 'operational',
    defaultScope: 'sector',
    presentation: createVisualPresentation('operations'),
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
    sectors: ['recepcao'],
    layout: 'operational',
    defaultScope: 'sector',
    presentation: createVisualPresentation('lobby'),
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
  {
    id: 'workspace-operacao',
    name: 'Operação Geral',
    description: 'Visão transversal da operação do hotel',
    sectors: ['operacao'],
    layout: 'operational',
    defaultScope: 'sector',
    presentation: createVisualPresentation('operations'),
    widgets: createSectorWidgets('workspace-operacao', 'Operação Geral', 'operacao'),
  },
  {
    id: 'workspace-manutencao',
    name: 'Manutenção',
    description: 'Chamados, reparos e ordens de serviço técnicas',
    sectors: ['manutencao'],
    layout: 'operational',
    defaultScope: 'sector',
    presentation: createVisualPresentation('operations'),
    widgets: createSectorWidgets('workspace-manutencao', 'Manutenção', 'manutencao'),
  },
  {
    id: 'workspace-cozinha',
    name: 'Cozinha & Room Service',
    description: 'Pedidos, preparo e entrega de alimentos e bebidas',
    sectors: ['cozinha'],
    layout: 'operational',
    defaultScope: 'sector',
    presentation: createVisualPresentation('service'),
    widgets: createSectorWidgets('workspace-cozinha', 'Cozinha & Room Service', 'cozinha'),
  },
  {
    id: 'workspace-financeiro',
    name: 'Financeiro',
    description: 'Visão financeira certificada com receitas, contas e transações oficiais do hotel',
    sectors: [],
    layout: 'management',
    defaultScope: 'mine',
    presentation: {
      ...createVisualPresentation('finance'),
      header: {
        showHotel: true,
        showWorkspace: true,
        showDate: true,
        showTime: true,
        showUser: true,
        showStatus: true,
        showOperationalDate: false,
        hourFormat: '24h',
        timezone: 'America/Sao_Paulo',
      },
      devices: { mobile: 'custom', kds: 'disabled' },
    },
    widgets: [
      {
        id: 'financeiro-overview', type: 'financial-overview', title: 'Visão Financeira Certificada', order: 10, span: 'full', enabled: true, dataSource: 'finance',
        presentation: { display: 'panel', width: 'full', height: 'auto', visual: 'highlight', header: 'full', mobile: { display: 'panel', width: 'full', visual: 'highlight', header: 'full' } },
      },
      {
        id: 'financeiro-summary', type: 'financial-summary', title: 'Resumo Financeiro', order: 20, span: 'full', enabled: true, dataSource: 'finance',
        presentation: { display: 'panel', width: 'full', height: 'auto', visual: 'standard', header: 'compact', mobile: { display: 'panel', width: 'full', header: 'compact' } },
      },
      {
        id: 'financeiro-receivables', type: 'financial-receivables', title: 'Contas a Receber', order: 30, span: 'full', enabled: true, dataSource: 'finance',
        presentation: { display: 'panel', width: 'medium', height: 'auto', visual: 'standard', header: 'compact', mobile: { display: 'summary', width: 'full', header: 'compact' } },
      },
      {
        id: 'financeiro-payables', type: 'financial-payables', title: 'Contas a Pagar', order: 40, span: 'full', enabled: true, dataSource: 'finance',
        presentation: { display: 'panel', width: 'medium', height: 'auto', visual: 'standard', header: 'compact', mobile: { display: 'summary', width: 'full', header: 'compact' } },
      },
      {
        id: 'financeiro-transactions', type: 'financial-transactions', title: 'Transações Financeiras', order: 50, span: 'full', enabled: true, dataSource: 'finance',
        presentation: { display: 'panel', width: 'full', height: 'auto', visual: 'standard', header: 'compact', mobile: { display: 'button', width: 'full', header: 'compact' } },
      },
    ],
  },
  {
    id: 'workspace-administrativo-hotel',
    name: 'Administrativo do Hotel',
    description: 'Gestão de acessos, automações, configurações e supervisão do Hotel OS',
    sectors: [],
    layout: 'management',
    defaultScope: 'mine',
    presentation: createVisualPresentation('operations'),
    widgets: [
      { id: 'administrativo-central', type: 'hotel-os-admin', title: 'Central Hotel OS', order: 10, span: 'full', enabled: true, dataSource: 'composite' },
      { id: 'administrativo-acessos', type: 'user-access', title: 'Equipe & Acessos', order: 20, span: 'full', enabled: true, dataSource: 'users' },
      { id: 'administrativo-automacoes', type: 'automation-admin', title: 'Automações & Fechaduras', order: 30, span: 'full', enabled: true, dataSource: 'composite' },
      { id: 'administrativo-configuracoes', type: 'settings-admin', title: 'Configurações & Design', order: 40, span: 'full', enabled: true, dataSource: 'composite' },
    ],
  },
  {
    id: 'workspace-administrativo-sistema',
    name: 'Administrativo do Sistema',
    description: 'Gestão organizacional, acessos e configurações da plataforma',
    sectors: [], layout: 'management', defaultScope: 'mine', presentation: createVisualPresentation('operations'),
    widgets: [
      { id: 'sistema-acessos', type: 'user-access', title: 'Usuários & Acessos', order: 10, span: 'full', enabled: true, dataSource: 'users' },
      { id: 'sistema-configuracoes', type: 'settings-admin', title: 'Configurações do Sistema', order: 20, span: 'full', enabled: true, dataSource: 'composite' },
      { id: 'sistema-central', type: 'hotel-os-admin', title: 'Central Hotel OS', order: 30, span: 'full', enabled: true, dataSource: 'composite' },
    ],
  },
] as const;

export const createOfficialWorkspaceDefinition = (workspaceId: OfficialWorkspaceId): WorkspaceDefinition => {
  const canonicalId = workspaceId === 'workspace-administrativo' ? 'workspace-administrativo-hotel' : workspaceId;
  const template = OFFICIAL_WORKSPACE_TEMPLATES.find(item => item.id === canonicalId);
  if (!template) throw new Error(`Template oficial de Workspace não encontrado: ${workspaceId}`);

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    sectors: [...template.sectors],
    layout: template.layout,
    defaultScope: template.defaultScope,
    presentation: template.presentation ? {
      ...template.presentation,
      header: template.presentation.header ? { ...template.presentation.header } : undefined,
      surface: template.presentation.surface ? { ...template.presentation.surface } : undefined,
      sidebar: template.presentation.sidebar ? { ...template.presentation.sidebar } : undefined,
      kds: template.presentation.kds ? { ...template.presentation.kds } : undefined,
      devices: template.presentation.devices ? { ...template.presentation.devices } : undefined,
    } : undefined,
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
