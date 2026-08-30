import React, { useMemo } from 'react';
import { ArrowRight, Bell, BedDouble, CalendarCheck, ClipboardList, Gauge, LayoutDashboard, ReceiptText, Users, UtensilsCrossed, WalletCards, Wrench } from 'lucide-react';
import { getOperationalSectorLabel, type OperationalSectorId } from '../../domain/operationalSectors';
import { getWidgetCatalogItem } from '../widgetCatalog';
import type { WorkspaceWidgetDefinition, WorkspaceWidgetType } from '../types';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

type QuickActionDefinition = {
  type: WorkspaceWidgetType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ACTIONS_BY_SECTOR: Record<OperationalSectorId, QuickActionDefinition[]> = {
  operacao: [
    { type: 'dashboard', label: 'Dashboard', description: 'Abrir visão gerencial', icon: LayoutDashboard },
    { type: 'metrics', label: 'Indicadores', description: 'Ver resumo operacional', icon: Gauge },
    { type: 'alerts', label: 'Alertas', description: 'Ver pendências atuais', icon: Bell },
    { type: 'task-kanban', label: 'Tarefas', description: 'Abrir quadro operacional', icon: ClipboardList },
    { type: 'room-map', label: 'Mapa de quartos', description: 'Ver situação dos quartos', icon: BedDouble },
    { type: 'frigobar', label: 'Frigobar', description: 'Abrir operação de frigobar', icon: ReceiptText },
  ],
  recepcao: [
    { type: 'arrivals', label: 'Chegadas', description: 'Ver chegadas e check-in', icon: CalendarCheck },
    { type: 'departures', label: 'Saídas', description: 'Ver saídas e check-out', icon: CalendarCheck },
    { type: 'reservations-list', label: 'Reservas', description: 'Abrir reservas', icon: ReceiptText },
    { type: 'active-stays', label: 'Hospedados', description: 'Ver hospedagens ativas', icon: BedDouble },
    { type: 'guests', label: 'Hóspedes', description: 'Abrir cadastro de hóspedes', icon: Users },
    { type: 'room-map', label: 'Mapa de quartos', description: 'Ver situação dos quartos', icon: BedDouble },
    { type: 'room-details', label: 'Detalhes do quarto', description: 'Abrir contexto do quarto', icon: BedDouble },
    { type: 'stay-finance', label: 'Financeiro', description: 'Abrir Folio da hospedagem', icon: WalletCards },
    { type: 'frigobar', label: 'Frigobar', description: 'Abrir operação de frigobar', icon: ReceiptText },
  ],
  governanca: [
    { type: 'room-map', label: 'Mapa de quartos', description: 'Ver limpeza e liberação', icon: BedDouble },
    { type: 'room-details', label: 'Detalhes do quarto', description: 'Abrir contexto do quarto', icon: BedDouble },
    { type: 'task-kanban', label: 'Tarefas', description: 'Abrir tarefas da Governança', icon: ClipboardList },
    { type: 'alerts', label: 'Alertas', description: 'Ver quartos que exigem atenção', icon: Bell },
    { type: 'frigobar', label: 'Frigobar', description: 'Abrir reposição do quarto', icon: ReceiptText },
  ],
  manutencao: [
    { type: 'maintenance', label: 'Manutenção', description: 'Abrir ordens técnicas do setor', icon: Wrench },
    { type: 'room-map', label: 'Mapa de quartos', description: 'Localizar quartos e estados', icon: BedDouble },
    { type: 'room-details', label: 'Detalhes do quarto', description: 'Abrir contexto técnico do quarto', icon: Wrench },
    { type: 'alerts', label: 'Alertas', description: 'Ver pendências técnicas', icon: Bell },
  ],
  cozinha: [
    { type: 'task-kanban', label: 'Tarefas', description: 'Abrir fila operacional', icon: UtensilsCrossed },
    { type: 'alerts', label: 'Alertas', description: 'Ver pendências da operação', icon: Bell },
    { type: 'dashboard', label: 'Dashboard', description: 'Ver indicadores disponíveis', icon: LayoutDashboard },
  ],
};

const findTargetElement = (widget: WorkspaceWidgetDefinition) =>
  typeof document === 'undefined' ? null : document.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(widget.id)}"]`);

const openExistingWidget = (target: WorkspaceWidgetDefinition) => {
  const element = findTargetElement(target);
  if (!element) return;
  const dialogButton = element.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]');
  if (dialogButton) {
    dialogButton.click();
    return;
  }
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  element.focus({ preventScroll: true });
};

export const QuickActionsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ workspace, widget }) => {
  const sectors = workspace.sectors.length ? workspace.sectors : ['operacao'];
  const actions = useMemo(() => {
    const seen = new Set<string>();
    return sectors.flatMap(sector => ACTIONS_BY_SECTOR[sector] || []).flatMap(action => {
      if (seen.has(action.type) || widget.actions?.[action.type] === false) return [];
      const target = workspace.widgets.find(candidate =>
        candidate.type === action.type &&
        candidate.id !== widget.id &&
        candidate.enabled !== false &&
        candidate.permissions?.view !== false,
      );
      if (!target) return [];
      const catalog = getWidgetCatalogItem(target.type);
      if (catalog?.readiness === 'planned') return [];
      seen.add(action.type);
      return [{ ...action, target }];
    });
  }, [sectors, widget.actions, widget.id, workspace.widgets]);

  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" data-quick-actions-sector={sectors.join(',')}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Ações rápidas</p>
        <h2 className="mt-1 text-sm font-black text-slate-900">{widget.title || sectors.map(getOperationalSectorLabel).join(' · ')}</h2>
        <p className="mt-1 text-[10px] text-slate-500">Somente rotinas disponíveis neste Workspace e compatíveis com o setor.</p>
      </div>
    </div>

    {actions.length > 0 ? <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {actions.map(({ target, icon: Icon, label, description }) => <button key={target.id} type="button" onClick={() => openExistingWidget(target)} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-amber-300 hover:bg-amber-50/50" data-quick-action-target={target.type}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm"><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-[11px] text-slate-900">{target.title || label}</strong><span className="block truncate text-[9px] text-slate-500">{description}</span></span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700" />
      </button>)}
    </div> : <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-[10px] text-slate-500">Nenhuma rotina rápida disponível para este setor nesta composição.</div>}
  </div>;
};
