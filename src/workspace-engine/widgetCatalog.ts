import { WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';

export interface WorkspaceWidgetCatalogItem {
  type: WorkspaceWidgetType;
  label: string;
  description: string;
  category: 'operacao' | 'dados' | 'equipe' | 'atalhos';
  requiresBoard: boolean;
  defaultSpan: WorkspaceWidgetDefinition['span'];
}

export const workspaceWidgetCatalog: WorkspaceWidgetCatalogItem[] = [
  { type: 'metrics', label: 'Indicadores', description: 'Resumo de volumes e estados do fluxo operacional.', category: 'operacao', requiresBoard: true, defaultSpan: 'full' },
  { type: 'kanban-cards', label: 'Kanban', description: 'Quadro de tarefas do board vinculado ao Workspace.', category: 'operacao', requiresBoard: true, defaultSpan: 'full' },
  { type: 'alerts', label: 'Alertas', description: 'Destaques e pendências que exigem atenção.', category: 'operacao', requiresBoard: false, defaultSpan: 2 },
  { type: 'quick-actions', label: 'Ações rápidas', description: 'Ações contextuais do ambiente operacional.', category: 'atalhos', requiresBoard: false, defaultSpan: 2 },
  { type: 'rooms-list', label: 'Lista de Quartos', description: 'Bloco para ocupação, limpeza e situação das UHs.', category: 'dados', requiresBoard: false, defaultSpan: 2 },
  { type: 'reservations-list', label: 'Reservas', description: 'Bloco para reservas e movimentações relacionadas.', category: 'dados', requiresBoard: false, defaultSpan: 2 },
  { type: 'checkins', label: 'Check-ins', description: 'Chegadas, saídas e movimentação de recepção.', category: 'dados', requiresBoard: false, defaultSpan: 2 },
  { type: 'maintenance', label: 'Manutenção', description: 'Chamados e pendências técnicas vinculadas à operação.', category: 'operacao', requiresBoard: false, defaultSpan: 2 },
  { type: 'orders', label: 'Pedidos', description: 'Pedidos e solicitações de cozinha ou room service.', category: 'operacao', requiresBoard: false, defaultSpan: 2 },
  { type: 'team', label: 'Equipe', description: 'Pessoas, responsáveis e distribuição de trabalho.', category: 'equipe', requiresBoard: false, defaultSpan: 2 },
  { type: 'shortcuts', label: 'Atalhos', description: 'Links e acessos rápidos a rotinas frequentes.', category: 'atalhos', requiresBoard: false, defaultSpan: 2 },
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
  };
};

export const normalizeWorkspaceWidgets = (widgets: WorkspaceWidgetDefinition[]) =>
  widgets
    .filter(widget => widget.enabled !== false)
    .map((widget, index) => ({
      ...widget,
      order: widget.order ?? index,
      span: widget.span ?? getWidgetCatalogItem(widget.type)?.defaultSpan ?? 'full',
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
