import { WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';

export interface WorkspaceWidgetCatalogItem {
  type: WorkspaceWidgetType;
  label: string;
  description: string;
  category: 'operacao' | 'dados' | 'equipe' | 'atalhos';
  requiresBoard: boolean;
  defaultSpan: WorkspaceWidgetDefinition['span'];
  defaultDataSource?: WorkspaceWidgetDefinition['dataSource'];
  legacy?: boolean;
}

export const workspaceWidgetCatalog: WorkspaceWidgetCatalogItem[] = [
  { type: 'metrics', label: 'Indicadores', description: 'Resumo de volumes e estados do fluxo operacional.', category: 'operacao', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite' },
  { type: 'task-kanban', label: 'Kanban de tarefas', description: 'Quadro operacional de tarefas vinculado a um board, consumindo o motor Kanban sem alterá-lo.', category: 'operacao', requiresBoard: true, defaultSpan: 'full', defaultDataSource: 'kanban' },
  { type: 'room-map', label: 'Mapa de quartos', description: 'Cards permanentes dos quartos, status operacional, hóspede e reserva associada.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite' },
  { type: 'room-details', label: 'Detalhes do quarto', description: 'Painel contextual com dados do quarto, hóspede, reserva e ações permitidas.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite' },
  { type: 'arrivals', label: 'Chegadas', description: 'Reservas com chegada prevista e ações de check-in conforme regras de negócio.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations' },
  { type: 'departures', label: 'Saídas', description: 'Hospedagens com saída prevista e ações de checkout conforme regras de negócio.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations' },
  { type: 'alerts', label: 'Alertas', description: 'Destaques e pendências que exigem atenção no contexto do Workspace.', category: 'operacao', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite' },
  { type: 'quick-actions', label: 'Ações rápidas', description: 'Ações contextuais habilitadas pela configuração do widget.', category: 'atalhos', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite' },
  { type: 'reservations-list', label: 'Reservas', description: 'Reservas e movimentações relacionadas ao contexto operacional.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations' },
  { type: 'maintenance', label: 'Manutenção', description: 'Chamados e pendências técnicas vinculadas à operação.', category: 'operacao', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'maintenance' },
  { type: 'orders', label: 'Pedidos', description: 'Pedidos e solicitações de cozinha ou room service.', category: 'operacao', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'orders' },
  { type: 'team', label: 'Equipe', description: 'Pessoas, responsáveis e distribuição de trabalho.', category: 'equipe', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'users' },
  { type: 'shortcuts', label: 'Atalhos', description: 'Links e acessos rápidos a rotinas frequentes.', category: 'atalhos', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite' },

  // Saved definitions using these aliases continue to work while the migration
  // maps them to the canonical widget types above.
  { type: 'kanban-cards', label: 'Kanban (legado)', description: 'Compatibilidade temporária. Novas composições devem usar Kanban de tarefas.', category: 'operacao', requiresBoard: true, defaultSpan: 'full', defaultDataSource: 'kanban', legacy: true },
  { type: 'rooms-list', label: 'Quartos (legado)', description: 'Compatibilidade temporária. Novas composições devem usar Mapa de quartos.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', legacy: true },
  { type: 'checkins', label: 'Chegadas e saídas (legado)', description: 'Compatibilidade temporária. Use widgets separados de Chegadas e Saídas.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations', legacy: true },
];

export const getWidgetCatalogItem = (type: WorkspaceWidgetType) =>
  workspaceWidgetCatalog.find(item => item.type === type) || null;

export const createWorkspaceWidget = (
  type: WorkspaceWidgetType,
  options?: { boardId?: string; order?: number },
): WorkspaceWidgetDefinition => {
  const item = getWidgetCatalogItem(type);
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `widget-${type}-${Date.now().toString(36)}-${suffix}`,
    type,
    title: item?.label || type,
    boardId: item?.requiresBoard ? options?.boardId : undefined,
    order: options?.order ?? 10,
    span: item?.defaultSpan ?? 'full',
    enabled: true,
    dataSource: item?.defaultDataSource,
    filters: {},
    actions: {},
    permissions: { view: true },
    settings: {},
  };
};

export const normalizeWorkspaceWidgets = (widgets: WorkspaceWidgetDefinition[]) =>
  widgets
    .filter(widget => widget.enabled !== false)
    .map((widget, index) => {
      const catalog = getWidgetCatalogItem(widget.type);
      return {
        ...widget,
        order: widget.order ?? index,
        span: widget.span ?? catalog?.defaultSpan ?? 'full',
        dataSource: widget.dataSource ?? catalog?.defaultDataSource,
        filters: widget.filters ?? {},
        actions: widget.actions ?? {},
        permissions: widget.permissions ?? { view: true },
        settings: widget.settings ?? {},
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const canonicalWidgetType = (type: WorkspaceWidgetType): WorkspaceWidgetType => {
  if (type === 'kanban-cards') return 'task-kanban';
  if (type === 'rooms-list') return 'room-map';
  return type;
};
