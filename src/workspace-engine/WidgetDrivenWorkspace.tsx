import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, LogOut, X } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { WorkspaceUserMenu } from '../components/navigation/WorkspaceUserMenu';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { WorkspaceDefinition, WorkspaceViewport, WorkspaceWidgetDefinition, WorkspaceWidgetSpan } from './types';
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

const masonrySpanClass = (span: WorkspaceWidgetSpan | undefined) => {
  switch (span) {
    case 1:
    case 'button': return 'md:col-span-1 xl:col-span-3';
    case 2: return 'md:col-span-2 xl:col-span-6';
    case 3: return 'md:col-span-3 xl:col-span-9';
    case 4:
    case 'full':
    default: return 'md:col-span-4 xl:col-span-12';
  }
};

const heightClass = (widget: WorkspaceWidgetDefinition) => {
  switch (widget.presentation?.height) {
    case 'low': return 'max-h-[18rem] overflow-auto';
    case 'medium': return 'max-h-[32rem] overflow-auto';
    case 'high': return 'max-h-[48rem] overflow-auto';
    default: return '';
  }
};

const visualClass = (widget: WorkspaceWidgetDefinition, kdsHighlight = false) => {
  const visual = kdsHighlight ? 'highlight' : (widget.presentation?.visual || 'standard');
  if (visual === 'minimal') return 'rounded-3xl [&>*]:shadow-none';
  if (visual === 'highlight') return 'rounded-3xl ring-2 ring-amber-400/80 shadow-lg shadow-amber-950/10';
  return '';
};

const detectViewport = (): WorkspaceViewport => {
  if (typeof window === 'undefined') return 'desktop';
  const requested = new URLSearchParams(window.location.search).get('workspaceView');
  if (requested === 'kds') return 'kds';
  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
};

const MasonryCell: React.FC<{ span?: WorkspaceWidgetSpan; children: React.ReactNode }> = ({ span, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const updateRows = () => setRows(Math.max(1, Math.ceil((element.getBoundingClientRect().height + 16) / 24)));
    updateRows();
    const observer = new ResizeObserver(updateRows);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={masonrySpanClass(span)} style={{ gridRowEnd: `span ${rows}` }}>{children}</div>;
};

export interface WidgetDrivenWorkspaceProps { definition: WorkspaceDefinition; }

export const WidgetDrivenWorkspace: React.FC<WidgetDrivenWorkspaceProps> = ({ definition }) => {
  const { currentUser, logout } = useHotel();
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<WorkspaceViewport>(detectViewport);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30000);
    const media = window.matchMedia('(max-width: 767px)');
    const onViewport = () => setViewport(detectViewport());
    media.addEventListener('change', onViewport);
    return () => { window.clearInterval(clock); media.removeEventListener('change', onViewport); };
  }, []);

  const widgets = normalizeWorkspaceWidgets(definition.widgets)
    .filter(widget => widget.enabled !== false && widget.permissions?.view !== false)
    .filter(widget => viewport !== 'mobile' || widget.presentation?.mobile?.hidden !== true)
    .filter(widget => viewport !== 'kds' || widget.presentation?.kds?.hidden !== true)
    .sort((a, b) => {
      const orderA = viewport === 'mobile' ? a.presentation?.mobile?.order : viewport === 'kds' ? a.presentation?.kds?.order : a.order;
      const orderB = viewport === 'mobile' ? b.presentation?.mobile?.order : viewport === 'kds' ? b.presentation?.kds?.order : b.order;
      return (orderA ?? a.order ?? 0) - (orderB ?? b.order ?? 0);
    });
  const openWidget = useMemo(() => widgets.find(widget => widget.id === openWidgetId) || null, [widgets, openWidgetId]);
  const OpenRenderer = openWidget ? getWorkspaceWidgetRenderer(openWidget.type) : null;
  const header = definition.presentation?.header;
  const kds = definition.presentation?.kds;
  const timezone = header?.timezone || 'America/Sao_Paulo';
  const dateText = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: timezone }).format(now);
  const timeText = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: header?.hourFormat === '12h', timeZone: timezone }).format(now);
  const isKds = viewport === 'kds';
  const kdsOrientation = kds?.orientation || 'landscape';
  const kdsDensity = kds?.density || 'normal';
  const kdsDistance = kds?.viewingDistance || 'medium';

  useEffect(() => {
    if (!openWidgetId || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenWidgetId(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [openWidgetId]);

  const kdsShellClass = isKds && kds?.fullscreen ? 'fixed inset-0 z-[100] overflow-auto' : 'min-h-screen';
  const kdsGridClass = kdsOrientation === 'portrait'
    ? 'grid grid-cols-1 gap-5 md:grid-cols-2'
    : 'grid grid-cols-1 gap-5 lg:grid-cols-3 xl:grid-cols-4';
  const kdsDensityClass = kdsDensity === 'compact' ? 'p-3 sm:p-4 gap-3' : kdsDensity === 'large' ? 'p-6 sm:p-8 gap-7' : 'p-4 sm:p-6 gap-5';
  const kdsDistanceClass = kdsDistance === 'far'
    ? '[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-base [&_button]:text-base'
    : kdsDistance === 'near'
      ? '[&_h1]:text-xl [&_h2]:text-lg'
      : '[&_h1]:text-2xl [&_h2]:text-xl [&_p]:text-sm';

  const renderWidget = (widget: WorkspaceWidgetDefinition) => {
    const Renderer = getWorkspaceWidgetRenderer(widget.type);
    const mobileDisplay = widget.presentation?.mobile?.display;
    const kdsDisplay = widget.presentation?.kds?.display;
    const isButton = !isKds && (widget.span === 'button' || (viewport === 'mobile' && mobileDisplay === 'button'));
    const isSummary = viewport === 'mobile' && mobileDisplay === 'summary';
    const headerStyle = widget.presentation?.header || 'full';
    const shellVisual = visualClass(widget, isKds && kdsDisplay === 'highlight');

    return <section className={`${heightClass(widget)} ${shellVisual}`} data-workspace-widget={widget.type} data-widget-id={widget.id} data-widget-display={isButton ? 'button' : isSummary ? 'summary' : 'panel'} data-widget-visual={widget.presentation?.visual || 'standard'} data-widget-header={headerStyle}>
      {headerStyle !== 'hidden' && !isButton && !isSummary && <div className={`mb-2 flex items-end justify-between gap-3 px-1 ${isKds ? 'text-white' : 'text-slate-900'}`} data-widget-presentation-header>
        <div className="min-w-0">
          {headerStyle === 'full' && <p className={`text-[9px] font-black uppercase tracking-wider ${isKds ? 'text-amber-300' : 'text-amber-700'}`}>{widget.type}</p>}
          <h2 className={`${headerStyle === 'compact' ? 'text-xs' : 'text-sm'} truncate font-black`}>{widget.title || widget.type}</h2>
        </div>
      </div>}
      {isButton ? <button type="button" onClick={() => setOpenWidgetId(widget.id)} className="group flex min-h-24 w-full items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md" aria-haspopup="dialog"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Abrir widget</p><h2 className="mt-1 truncate text-sm font-black text-slate-900">{widget.title || widget.type}</h2><p className="mt-1 text-[10px] text-slate-500">Exibição em janela</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-amber-500 group-hover:text-slate-950"><ExternalLink className="h-4 w-4" /></span></button>
        : isSummary ? <button type="button" onClick={() => setOpenWidgetId(widget.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm" aria-haspopup="dialog" data-widget-mobile-summary><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Resumo</p><h2 className="truncate text-sm font-black text-slate-900">{widget.title || widget.type}</h2><p className="mt-1 text-[10px] text-slate-500">Toque para ver o painel completo</p></div><ExternalLink className="h-4 w-4 shrink-0 text-slate-500" /></button>
          : Renderer ? <Renderer workspace={definition} widget={widget} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-slate-950"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p><h2 className="mt-1 text-sm font-black">{widget.title || widget.type}</h2></div>}
    </section>;
  };

  return <div className={`${kdsShellClass} text-slate-950 ${isKds ? `bg-slate-950 text-white ${kdsDistanceClass}` : 'bg-slate-100'}`} data-workspace-runtime="widget-driven" data-workspace-id={definition.id} data-workspace-viewport={viewport} data-kds-orientation={isKds ? kdsOrientation : undefined} data-kds-density={isKds ? kdsDensity : undefined} data-kds-viewing-distance={isKds ? kdsDistance : undefined} data-kds-fullscreen={isKds ? String(kds?.fullscreen === true) : undefined}>
    <header className={`sticky top-0 z-30 border-b ${isKds ? 'border-slate-800 bg-slate-950/95' : 'border-slate-200 bg-white/95'} backdrop-blur`}>
      <div className={`mx-auto flex max-w-[1800px] items-center justify-between gap-4 ${isKds && kdsDensity === 'large' ? 'px-8 py-5' : 'px-4 py-3 sm:px-6'}`}>
        <div>
          {header?.showWorkspace !== false && <div className="flex items-center gap-2"><h1 className="text-lg font-black">{definition.name}</h1><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">{isKds ? 'KDS / TV' : 'Workspace'}</span></div>}
          {!isKds && <p className="mt-0.5 text-[10px] text-slate-500">{definition.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {header?.showDate !== false && <div className={`text-[10px] font-bold capitalize ${isKds ? 'text-slate-300' : 'text-slate-500'}`}>{dateText}</div>}
            {header?.showTime !== false && <div className={`text-xl font-black tabular-nums ${isKds ? 'text-white' : 'text-slate-900'}`}>{timeText}</div>}
          </div>
          {!isKds && <><span className="hidden text-right text-[10px] text-slate-500 lg:block">{header?.showUser !== false && <strong className="block text-slate-700">{currentUser?.nome || 'Usuário'}</strong>}{definition.sectors.join(' · ')}</span><WorkspaceUserMenu /><button onClick={logout} className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-[10px] font-black text-slate-600 transition hover:bg-slate-50"><LogOut className="h-3.5 w-3.5" />Sair</button></>}
        </div>
      </div>
    </header>
    <main className={`mx-auto max-w-[1800px] ${viewport === 'mobile' ? 'flex flex-col gap-4 p-4' : isKds ? `${kdsGridClass} ${kdsDensityClass}` : 'grid grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-4 md:auto-rows-[8px] md:[grid-auto-flow:dense] xl:grid-cols-12'}`}>
      {widgets.map(widget => viewport === 'desktop'
        ? <MasonryCell key={widget.id} span={widget.span}>{renderWidget(widget)}</MasonryCell>
        : <div key={widget.id} className={isKds ? spanClass(widget.span) : ''}>{renderWidget(widget)}</div>)}
    </main>
    {openWidget && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={openWidget.title || openWidget.type} onMouseDown={event => { if (event.target === event.currentTarget) setOpenWidgetId(null); }}><div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl sm:max-h-[calc(100dvh-3rem)]"><div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5"><div><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Widget</p><h2 className="text-sm font-black text-slate-900">{openWidget.title || openWidget.type}</h2></div><button type="button" onClick={() => setOpenWidgetId(null)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Fechar widget"><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">{OpenRenderer ? <OpenRenderer workspace={definition} widget={openWidget} /> : null}</div></div></div>, document.body)}
  </div>;
};
