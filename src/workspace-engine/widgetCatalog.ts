import { OperationalSectorId } from '../domain/operationalSectors';
import { legacySpanToWidth, normalizeWidgetPresentation } from './presentation';
import { WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';

export type WorkspaceWidgetReadiness = 'ready' | 'configurable' | 'planned';
export type WorkspaceWidgetKdsSuitability = 'supported' | 'limited' | 'unsupported';

export interface WorkspaceWidgetCatalogItem {
  type: WorkspaceWidgetType;
  label: string;
  description: string;
  category: 'operacao' | 'dados' | 'equipe' | 'atalhos';
  requiresBoard: boolean;
  defaultSpan: WorkspaceWidgetDefinition['span'];
  defaultDataSource?: WorkspaceWidgetDefinition['dataSource'];
  sectors?: OperationalSectorId[];
  readiness: WorkspaceWidgetReadiness;
  readinessNote?: string;
  requiredRbacResource?: string;
  legacy?: boolean;
}

const allSectors: OperationalSectorId[] = ['operacao', 'governanca', 'recepcao', 'manutencao', 'cozinha'];

const allWorkspaceWidgetCatalog: WorkspaceWidgetCatalogItem[] = [
  { type: 'metrics', label: 'Indicadores', description: 'Resumo de volumes e estados do fluxo operacional.', category: 'operacao', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: allSectors, readiness: 'ready' },
  { type: 'dashboard', label: 'Dashboard', description: 'Dashboard personalizado composto por métricas e visualizações do Dashboard Engine.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'dashboard', sectors: allSectors, readiness: 'ready', readinessNote: 'A composição interna é persistida no Supabase pelo Dashboard Engine.' },
  { type: 'stay-finance', label: 'Financeiro da hospedagem', description: 'Folio, lançamentos, pagamentos, saldo e estornos da hospedagem ativa via Financial Engine.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'finance', sectors: ['recepcao'], readiness: 'ready', readinessNote: 'Opera somente sobre Folio oficial da hospedagem e não mantém fonte financeira local.', requiredRbacResource: 'frontdesk' },
  { type: 'financial-summary', label: 'Resumo Financeiro', description: 'Recebimentos, estornos, líquido e composição por método a partir do ledger operacional canônico.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'finance', readiness: 'ready', readinessNote: 'Leitura exclusiva da projeção oficial de hotel_os_transactions.', requiredRbacResource: 'financial' },
  { type: 'financial-transactions', label: 'Transações Financeiras', description: 'Extrato operacional de pagamentos e estornos vinculados ao Folio e ao ledger canônico.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'finance', readiness: 'ready', readinessNote: 'Leitura exclusiva de hotel_os_transactions; não cria fonte financeira local.', requiredRbacResource: 'financial' },
  { type: 'financial-receivables', label: 'Contas a Receber', description: 'Contas a receber administrativas com consulta e liquidação pelo contrato financeiro oficial.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'finance', readiness: 'ready', readinessNote: 'Usa hotel_os_accounts_receivable e liquidação oficial; criação/exclusão permanecem bloqueadas até existir contrato próprio.', requiredRbacResource: 'financial' },
  { type: 'financial-payables', label: 'Contas a Pagar', description: 'Contas a pagar administrativas com consulta e liquidação pelo contrato financeiro oficial.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'finance', readiness: 'ready', readinessNote: 'Usa hotel_os_accounts_payable e liquidação oficial; criação/exclusão permanecem bloqueadas até existir contrato próprio.', requiredRbacResource: 'financial' },
  { type: 'frigobar', label: 'Frigobar', description: 'Estoque do frigobar por quarto, consumo com cobrança no Folio e reposição sem cobrança.', category: 'operacao', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'frigobar', sectors: ['operacao', 'recepcao', 'governanca'], readiness: 'ready', readinessNote: 'Usa exclusivamente o Frigobar Core; consumo é transacional com Inventory Core e Financial Engine.' },
  { type: 'task-kanban', label: 'Kanban de tarefas', description: 'Quadro operacional de tarefas vinculado a um board, consumindo o motor Kanban sem alterá-lo.', category: 'operacao', requiresBoard: true, defaultSpan: 'full', defaultDataSource: 'kanban', sectors: allSectors, readiness: 'ready' },
  { type: 'room-map', label: 'Mapa de quartos', description: 'Cards permanentes dos quartos, status operacional, hóspede e reserva associada.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: ['recepcao', 'governanca', 'manutencao'], readiness: 'configurable', readinessNote: 'Disponível nos setores que operam diretamente o ciclo do quarto.' },
  { type: 'room-details', label: 'Detalhes do quarto', description: 'Painel contextual com dados do quarto, hóspede, reserva e ações permitidas.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite', sectors: ['recepcao', 'governanca', 'manutencao'], readiness: 'configurable', readinessNote: 'Requer contexto de quarto no Workspace.' },
  { type: 'guests', label: 'Hóspedes', description: 'Cadastro e busca central de hóspedes para reservas e hospedagens.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'guests', sectors: ['recepcao'], readiness: 'ready' },
  { type: 'arrivals', label: 'Chegadas', description: 'Reservas com chegada prevista e ações de check-in conforme regras de negócio.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations', sectors: ['recepcao'], readiness: 'configurable', readinessNote: 'Exclusivo do fluxo de Recepção.' },
  { type: 'departures', label: 'Saídas', description: 'Hospedagens com saída prevista e ações de checkout conforme regras de negócio.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations', sectors: ['recepcao'], readiness: 'configurable', readinessNote: 'Exclusivo do fluxo de Recepção.' },
  { type: 'alerts', label: 'Alertas', description: 'Destaques e pendências que exigem atenção no contexto do Workspace.', category: 'operacao', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite', sectors: allSectors, readiness: 'ready' },
  { type: 'quick-actions', label: 'Ações rápidas', description: 'Ações contextuais habilitadas pela configuração do widget.', category: 'atalhos', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite', sectors: allSectors, readiness: 'configurable', readinessNote: 'As ações dependem da composição e das permissões do Workspace.' },
  { type: 'reservations-list', label: 'Reservas', description: 'Cria e acompanha reservas com quarto compatível por período, capacidade e esquema de camas.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'reservations', sectors: ['recepcao'], readiness: 'ready', readinessNote: 'Disponível para Workspaces ligados ao ciclo de reservas.' },
  { type: 'occupancy-calendar', label: 'Calendário de ocupação', description: 'Grade de quartos por data com reservas, hospedagens, bloqueios e disponibilidade visual.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: ['recepcao'], readiness: 'ready', readinessNote: 'Leitura operacional do inventário de quartos por período.' },
  { type: 'active-stays', label: 'Hóspedes hospedados', description: 'Hospedagens ativas com quarto, período e ação de check-out.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: ['recepcao'], readiness: 'ready' },
  { type: 'maintenance', label: 'Manutenção', description: 'Chamados e pendências técnicas vinculadas à operação.', category: 'operacao', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'maintenance', sectors: ['manutencao', 'governanca', 'recepcao'], readiness: 'ready', readinessNote: 'Reutiliza o Kanban oficial de Manutenção; não mantém motor técnico paralelo.' },
  { type: 'orders', label: 'Pedidos', description: 'Pedidos e solicitações de cozinha ou room service.', category: 'operacao', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'orders', sectors: ['cozinha', 'recepcao'], readiness: 'planned', readinessNote: 'Fora do Workspace 1.0: não existe renderer operacional consolidado e nenhum motor novo será criado aqui.' },
  { type: 'team', label: 'Equipe', description: 'Pessoas ativas e vínculos setoriais do Workspace.', category: 'equipe', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'users', sectors: allSectors, readiness: 'ready', readinessNote: 'Leitura do diretório de usuários e do vínculo oficial usuário↔setor.' },
  { type: 'user-access', label: 'Equipe & Acessos', description: 'Administração de usuários, perfis e vínculos com setores operacionais reutilizando o módulo existente.', category: 'equipe', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'users', sectors: allSectors, readiness: 'ready', readinessNote: 'Adapter de apresentação do módulo existente de Equipe & Acessos; não cria regras ou persistência paralelas.' },
  { type: 'automation-admin', label: 'Automações & Fechaduras', description: 'Administração das réguas de comunicação, simulações e fechaduras inteligentes reutilizando o módulo existente.', category: 'operacao', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: allSectors, readiness: 'ready', readinessNote: 'Adapter de apresentação do módulo administrativo existente de Automações; regras e mutações permanecem no módulo original.' },
  { type: 'settings-admin', label: 'Configurações & Design', description: 'Central administrativa de configuração, personalização, mídia e conectividade reutilizando o módulo existente.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: allSectors, readiness: 'ready', readinessNote: 'Adapter de apresentação do módulo existente de Configurações; operações e persistência permanecem no módulo original.' },
  { type: 'hotel-os-admin', label: 'Central Hotel OS', description: 'Visão administrativa integrada da operação, workflows, indicadores e integrações reutilizando a Central Hotel OS existente.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: allSectors, readiness: 'ready', readinessNote: 'Adapter de apresentação da Central Hotel OS existente; regras, dados e serviços permanecem no módulo original.' },
  { type: 'shortcuts', label: 'Atalhos', description: 'Links e acessos rápidos a rotinas frequentes.', category: 'atalhos', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'composite', sectors: allSectors, readiness: 'planned', readinessNote: 'Fora do Workspace 1.0: não há contrato de configuração próprio na Fábrica; use Ações rápidas para navegar entre widgets existentes.' },

  // Compatibilidade interna para definições já persistidas. Estes aliases não
  // fazem mais parte da biblioteca visível da Fábrica de Workspaces.
  { type: 'kanban-cards', label: 'Kanban (legado)', description: 'Compatibilidade temporária. Novas composições devem usar Kanban de tarefas.', category: 'operacao', requiresBoard: true, defaultSpan: 'full', defaultDataSource: 'kanban', sectors: allSectors, readiness: 'ready', legacy: true },
  { type: 'rooms-list', label: 'Quartos (legado)', description: 'Compatibilidade temporária. Novas composições devem usar Mapa de quartos.', category: 'dados', requiresBoard: false, defaultSpan: 'full', defaultDataSource: 'composite', sectors: ['recepcao', 'governanca', 'manutencao'], readiness: 'configurable', legacy: true },
  { type: 'checkins', label: 'Chegadas e saídas (legado)', description: 'Compatibilidade temporária. Use widgets separados de Chegadas e Saídas.', category: 'dados', requiresBoard: false, defaultSpan: 2, defaultDataSource: 'reservations', sectors: ['recepcao'], readiness: 'configurable', legacy: true },
];

/** Biblioteca oficial apresentada pelo Criador de Workspace. */
export const workspaceWidgetCatalog = allWorkspaceWidgetCatalog.filter(item => !item.legacy);

/** Busca interna inclui aliases legados para leitura/migração segura. */
export const getWidgetCatalogItem = (type: WorkspaceWidgetType) =>
  allWorkspaceWidgetCatalog.find(item => item.type === type) || null;

export const getWidgetAvailability = (type: WorkspaceWidgetType, sector: OperationalSectorId) => {
  const item = getWidgetCatalogItem(type);
  if (!item) return { allowed: false, readiness: 'planned' as const, reason: 'Widget não registrado na biblioteca.' };
  const allowed = !item.sectors?.length || item.sectors.includes(sector);
  if (!allowed) return { allowed: false, readiness: item.readiness, reason: `Não disponível para o setor ${sector}.` };
  if (item.readiness === 'planned') return { allowed: false, readiness: item.readiness, reason: item.readinessNote || 'Widget ainda não possui renderer operacional consolidado.' };
  return { allowed: true, readiness: item.readiness, reason: item.readinessNote || '' };
};

const kdsSuitability: Partial<Record<WorkspaceWidgetType, { suitability: WorkspaceWidgetKdsSuitability; reason: string }>> = {
  'stay-finance': { suitability: 'limited', reason: 'Fluxos financeiros detalhados exigem interação próxima; prefira resumo ou ocultação no KDS.' },
  'financial-summary': { suitability: 'unsupported', reason: 'Indicadores financeiros não devem aparecer automaticamente em monitores KDS compartilhados.' },
  'financial-transactions': { suitability: 'unsupported', reason: 'Extrato financeiro detalhado não deve aparecer automaticamente em monitores KDS compartilhados.' },
  'financial-receivables': { suitability: 'unsupported', reason: 'Contas a receber exigem acesso financeiro administrativo e não devem aparecer em KDS.' },
  'financial-payables': { suitability: 'unsupported', reason: 'Contas a pagar exigem acesso financeiro administrativo e não devem aparecer em KDS.' },
  frigobar: { suitability: 'limited', reason: 'Operações de consumo e reposição exigem interação; use somente quando o monitor for interativo.' },
  'room-details': { suitability: 'limited', reason: 'Painel contextual depende de seleção e ações de detalhe.' },
  guests: { suitability: 'limited', reason: 'Cadastro e busca de hóspedes não são ideais para visualização a distância.' },
  'reservations-list': { suitability: 'limited', reason: 'Criação e edição de reservas exigem interação próxima.' },
  'quick-actions': { suitability: 'unsupported', reason: 'Ações rápidas dependem de interação direta e não são adequadas ao KDS automático.' },
  'user-access': { suitability: 'unsupported', reason: 'Administração de usuários e acessos exige interação próxima e não deve aparecer em KDS.' },
  'automation-admin': { suitability: 'unsupported', reason: 'Configuração e simulação de automações exigem interação administrativa e não devem aparecer em KDS.' },
  'settings-admin': { suitability: 'unsupported', reason: 'Configurações administrativas e de infraestrutura exigem interação próxima e não devem aparecer em KDS.' },
  'hotel-os-admin': { suitability: 'unsupported', reason: 'A Central Hotel OS exige interação administrativa próxima e não deve aparecer em KDS.' },
  shortcuts: { suitability: 'unsupported', reason: 'Atalhos dependem de navegação interativa e não são adequados ao KDS automático.' },
};

export const getWidgetKdsSuitability = (type: WorkspaceWidgetType) =>
  kdsSuitability[type] || { suitability: 'supported' as const, reason: '' };

export const createWorkspaceWidget = (
  type: WorkspaceWidgetType,
  options?: { boardId?: string; order?: number },
): WorkspaceWidgetDefinition => {
  const item = getWidgetCatalogItem(type);
  if (item?.legacy) throw new Error(`Widget legado ${type} não pode ser criado pela Fábrica.`);
  const suffix = Math.random().toString(36).slice(2, 8);
  const span = item?.defaultSpan ?? 'full';
  return {
    id: `widget-${type}-${Date.now().toString(36)}-${suffix}`,
    type,
    title: item?.label || type,
    boardId: item?.requiresBoard ? options?.boardId : undefined,
    order: options?.order ?? 10,
    span,
    enabled: true,
    dataSource: item?.defaultDataSource,
    filters: {},
    actions: {},
    permissions: { view: true },
    presentation: {
      display: span === 'button' ? 'button' : 'panel',
      width: legacySpanToWidth(span),
      height: 'auto',
      visual: 'standard',
      header: 'full',
    },
    settings: {},
  };
};

/**
 * Normaliza a definição persistida sem apagar widgets desativados.
 * A decisão de exibição pertence ao runtime, não à persistência da Fábrica.
 */
export const normalizeWorkspaceWidgets = (widgets: WorkspaceWidgetDefinition[]) =>
  widgets
    .map((widget, index) => {
      const catalog = getWidgetCatalogItem(widget.type);
      return {
        ...widget,
        order: widget.order ?? index,
        span: widget.span ?? catalog?.defaultSpan ?? 'full',
        enabled: widget.enabled !== false,
        dataSource: widget.dataSource ?? catalog?.defaultDataSource,
        filters: widget.filters ?? {},
        actions: widget.actions ?? {},
        permissions: widget.permissions ?? { view: true },
        presentation: normalizeWidgetPresentation(widget, catalog?.defaultSpan),
        settings: widget.settings ?? {},
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

export const canonicalWidgetType = (type: WorkspaceWidgetType): WorkspaceWidgetType => {
  if (type === 'kanban-cards') return 'task-kanban';
  if (type === 'rooms-list') return 'room-map';
  return type;
};