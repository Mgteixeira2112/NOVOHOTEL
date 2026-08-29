import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, LogOut, X } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { WorkspaceUserMenu } from '../components/navigation/WorkspaceUserMenu';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { WorkspaceDefinition, WorkspaceWidgetSpan } from './types';
import { getWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';

const spanClass = (span: WorkspaceWidgetSpan | undefined) => {
  switch (span) {
    case 1:
    case 'button': return 'xl:col-span-1';
    case 2: return 'xl:col-span-2';
    case 3: return 'xl:col-span-3';
    case 4:
    case 'full':
    default: return 'xl:col-span-4';
  }
};

export interface WidgetDrivenWorkspaceProps {
  definition: WorkspaceDefinition;
}

/** Universal canvas. Business functionality enters only through registered widgets. */
export const WidgetDrivenWorkspace: React.FC<WidgetDrivenWorkspaceProps> = ({ definition }) => {
  const { currentUser, logout } = useHotel();
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);
  const widgets = normalizeWorkspaceWidgets(definition.widgets)
    .filter(widget => widget.enabled !== false && widget.permissions?.view !== false);
  const openWidget = useMemo(() => widgets.find(widget => widget.id === openWidgetId) || null, [widgets, openWidgetId]);
  const OpenRenderer = openWidget ? getWorkspaceWidgetRenderer(openWidget.type) : null;

  useEffect(() => {
    if (!openWidgetId || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenWidgetId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openWidgetId]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" data-workspace-runtime="widget-driven" data-workspace-id={definition.id}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black">{definition.name}</h1>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">Workspace</span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">{definition.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-[10px] text-slate-500 lg:block">
              <strong className="block text-slate-700">{currentUser?.nome || 'Usuário'}</strong>
              {definition.sectors.join(' · ')}
            </span>
            <WorkspaceUserMenu />
            <button onClick={logout} className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-[10px] font-black text-slate-600 transition hover:bg-slate-50">
              <LogOut className="h-3.5 w-3.5" />Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-4 sm:p-6 xl:grid-cols-4">
        {widgets.map(widget => {
          const Renderer = getWorkspaceWidgetRenderer(widget.type);
          const isButton = widget.span === 'button';
          return (
            <section key={widget.id} className={spanClass(widget.span)} data-workspace-widget={widget.type} data-widget-id={widget.id} data-widget-display={isButton ? 'button' : 'inline'}>
              {isButton ? (
                <button
                  type="button"
                  onClick={() => setOpenWidgetId(widget.id)}
                  className="group flex min-h-24 w-full items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                  aria-haspopup="dialog"
                >
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Abrir widget</p>
                    <h2 className="mt-1 truncate text-sm font-black text-slate-900">{widget.title || widget.type}</h2>
                    <p className="mt-1 text-[10px] text-slate-500">Exibição em janela</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-amber-500 group-hover:text-slate-950">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </button>
              ) : Renderer ? (
                <Renderer workspace={definition} widget={widget} />
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p><h2 className="mt-1 text-sm font-black text-slate-900">{widget.title || widget.type}</h2></div>
              )}
            </section>
          );
        })}
      </main>
      {openWidget && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={openWidget.title || openWidget.type}
          onMouseDown={event => { if (event.target === event.currentTarget) setOpenWidgetId(null); }}
        >
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Widget</p>
                <h2 className="truncate text-sm font-black text-slate-900">{openWidget.title || openWidget.type}</h2>
              </div>
              <button type="button" onClick={() => setOpenWidgetId(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" aria-label="Fechar widget">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5" data-widget-popup-content>
              {OpenRenderer ? <OpenRenderer workspace={definition} widget={openWidget} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p><h2 className="mt-1 text-sm font-black text-slate-900">{openWidget.title || openWidget.type}</h2></div>}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
