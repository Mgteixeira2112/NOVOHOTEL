import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  BarChart3,
  BedDouble,
  CalendarDays,
  ClipboardList,
  LayoutGrid,
  Settings,
  ShoppingBag,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { resolveWidgetPresentation } from '../../workspace-engine/presentation';
import { WorkspaceDefinition, WorkspaceWidgetDefinition, WorkspaceWidgetType } from '../../workspace-engine/types';
import { normalizeWorkspaceWidgets } from '../../workspace-engine/widgetCatalog';
import { getWorkspaceWidgetRenderer } from '../../workspace-engine/widgetRuntimeRegistry';
import { ReceptionWorkspaceShared } from './ReceptionWorkspaceShared';

const iconForWidget = (type: WorkspaceWidgetType) => {
  if (['room-map', 'room-details', 'rooms-list', 'checkins'].includes(type)) return BedDouble;
  if (['guests', 'team', 'user-access', 'active-stays'].includes(type)) return UsersRound;
  if (['arrivals', 'departures', 'reservations-list', 'occupancy-calendar'].includes(type)) return CalendarDays;
  if (['task-kanban', 'kanban-cards', 'maintenance', 'orders'].includes(type)) return ClipboardList;
  if (['financial-overview', 'financial-summary', 'financial-transactions', 'financial-receivables', 'financial-payables', 'stay-finance'].includes(type)) return WalletCards;
  if (type === 'frigobar') return ShoppingBag;
  if (type === 'alerts') return AlertTriangle;
  if (['metrics', 'dashboard'].includes(type)) return BarChart3;
  if (['settings-admin', 'automation-admin', 'hotel-os-admin'].includes(type)) return Settings;
  if (['quick-actions', 'shortcuts'].includes(type)) return Zap;
  return LayoutGrid;
};

const panelHeadings: Partial<Record<WorkspaceWidgetType, string[]>> = {
  metrics: ['Reservas', 'Check-ins hoje', 'Quartos disponíveis'],
  arrivals: ['Próximas chegadas'],
  departures: ['Saídas'],
  'room-map': ['Mapa de quartos'],
  alerts: ['Alertas ativos'],
  'task-kanban': ['Kanban de tarefas da Recepção'],
};

const findPanelTarget = (root: HTMLElement, widget: WorkspaceWidgetDefinition) => {
  const headings = panelHeadings[widget.type] || [];
  const candidates = Array.from(root.querySelectorAll<HTMLElement>('h1,h2,h3,p,strong'));
  for (const heading of headings) {
    const match = candidates.find(node => node.textContent?.trim() === heading);
    if (match) return match.closest<HTMLElement>('section') || match.parentElement;
  }
  return null;
};

export const ReceptionWorkspaceMenuBridge: React.FC<{ definition: WorkspaceDefinition }> = ({ definition }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuHost, setMenuHost] = useState<HTMLElement | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);

  const menuWidgets = useMemo(() => normalizeWorkspaceWidgets(definition.widgets)
    .map(widget => ({ widget, presentation: resolveWidgetPresentation(definition, widget, 'desktop') }))
    .filter(({ widget, presentation }) => widget.enabled !== false && widget.permissions?.view !== false && !presentation.hidden)
    .sort((a, b) => (a.presentation.order ?? a.widget.order ?? 0) - (b.presentation.order ?? b.widget.order ?? 0)), [definition]);

  const openWidget = useMemo(() => menuWidgets.find(item => item.widget.id === openWidgetId)?.widget || null, [menuWidgets, openWidgetId]);
  const OpenRenderer = openWidget ? getWorkspaceWidgetRenderer(openWidget.type) : null;

  useEffect(() => {
    const aside = rootRef.current?.querySelector<HTMLElement>('aside');
    if (!aside) return;
    const legacyMenu = aside.querySelector<HTMLElement>(':scope > .space-y-1');
    const host = document.createElement('div');
    host.dataset.workspaceWidgetMenu = 'reception';
    if (legacyMenu) legacyMenu.style.display = 'none';
    aside.insertBefore(host, aside.firstChild);
    setMenuHost(host);
    return () => {
      host.remove();
      if (legacyMenu) legacyMenu.style.removeProperty('display');
      setMenuHost(null);
    };
  }, []);

  useEffect(() => {
    if (!openWidgetId) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenWidgetId(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openWidgetId]);

  const activateWidget = (widget: WorkspaceWidgetDefinition, display: string) => {
    setActiveWidgetId(widget.id);
    if (display === 'button') {
      setOpenWidgetId(widget.id);
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const target = findPanelTarget(root, widget);
    if (!target) {
      setOpenWidgetId(widget.id);
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const previousOutline = target.style.outline;
    const previousOffset = target.style.outlineOffset;
    target.style.outline = '2px solid rgb(245 158 11)';
    target.style.outlineOffset = '4px';
    window.setTimeout(() => {
      target.style.outline = previousOutline;
      target.style.outlineOffset = previousOffset;
    }, 1400);
  };

  return <div ref={rootRef} data-reception-menu-bridge>
    <ReceptionWorkspaceShared definition={definition} />

    {menuHost && createPortal(<div className="space-y-1">
      {menuWidgets.map(({ widget, presentation }) => {
        const Icon = iconForWidget(widget.type);
        const selected = activeWidgetId === widget.id;
        return <button
          key={widget.id}
          type="button"
          onClick={() => activateWidget(widget, presentation.display)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${selected ? 'bg-amber-50 text-amber-900 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          title={widget.title || widget.type}
        >
          <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-amber-600' : 'text-slate-400'}`} />
          <span className="min-w-0 truncate">{widget.title || widget.type}</span>
        </button>;
      })}
      {menuWidgets.length === 0 && <p className="px-3 py-4 text-[10px] font-semibold text-slate-400">Nenhum widget habilitado neste Workspace.</p>}
    </div>, menuHost)}

    {openWidget && OpenRenderer && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-label={openWidget.title || openWidget.type}>
      <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Widget do Workspace</p><h2 className="truncate text-lg font-black text-slate-950">{openWidget.title || openWidget.type}</h2></div>
          <button type="button" onClick={() => setOpenWidgetId(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Fechar"><X className="h-4 w-4" /></button>
        </div>
        <OpenRenderer workspace={definition} widget={openWidget} />
      </div>
    </div>, document.body)}
  </div>;
};
