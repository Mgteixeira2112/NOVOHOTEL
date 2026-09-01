import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, LogOut, X } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { WorkspaceUserMenu } from '../components/navigation/WorkspaceUserMenu';
import { getOperationalTodayStr } from '../utils/dateHelper';
import { getWidgetCatalogItem, getWidgetKdsSuitability, normalizeWorkspaceWidgets } from './widgetCatalog';
import { canAccessResource } from '../core/permissions/permissionService';
import { getWorkspaceDeviceMode, ResolvedWidgetPresentation, resolveWidgetPresentation } from './presentation';
import { WorkspaceDefinition, WorkspaceViewport, WorkspaceWidgetDefinition, WorkspaceWidgetHeight, WorkspaceWidgetVisualStyle, WorkspaceWidgetWidth } from './types';
import { getWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';

const kdsSpanClass = (width: WorkspaceWidgetWidth, orientation: 'landscape' | 'portrait') => {
  if (orientation === 'portrait') {
    if (width === 'small') return 'md:col-span-1';
    return 'md:col-span-2';
  }
  switch (width) {
    case 'small': return 'lg:col-span-1 xl:col-span-1';
    case 'medium': return 'lg:col-span-2 xl:col-span-2';
    case 'large': return 'lg:col-span-3 xl:col-span-3';
    case 'full': return 'lg:col-span-3 xl:col-span-4';
  }
};

const masonrySpanClass = (width: WorkspaceWidgetWidth) => {
  switch (width) {
    case 'small': return 'md:col-span-1 xl:col-span-3';
    case 'medium': return 'md:col-span-2 xl:col-span-6';
    case 'large': return 'md:col-span-3 xl:col-span-9';
    case 'full': return 'md:col-span-4 xl:col-span-12';
  }
};

const heightClass = (height: WorkspaceWidgetHeight) => {
  switch (height) {
    case 'low': return 'max-h-[18rem] overflow-auto';
    case 'medium': return 'max-h-[32rem] overflow-auto';
    case 'high': return 'max-h-[48rem] overflow-auto';
    case 'auto': return '';
  }
};

const visualClass = (visual: WorkspaceWidgetVisualStyle) => {
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

const MasonryCell: React.FC<{ width: WorkspaceWidgetWidth; children: React.ReactNode }> = ({ width, children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return;
    const updateRows = () => {
      const contentHeight = content.getBoundingClientRect().height;
      setRows(Math.max(1, Math.ceil((contentHeight + 16) / 24)));
    };
    updateRows();
    const observer = new ResizeObserver(updateRows);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return <div className={`${masonrySpanClass(width)} min-w-0`} style={{ gridRowEnd: `span ${rows}` }} data-masonry-cell data-masonry-rows={rows}>
    <div ref={contentRef} className="min-w-0" data-masonry-content>{children}</div>
  </div>;
};

const formatOperationalDate = (value: string, timezone: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: timezone }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

export interface WidgetDrivenWorkspaceProps {
  definition: WorkspaceDefinition;
  forcedViewport?: WorkspaceViewport;
  previewMode?: boolean;
}

export const WidgetDrivenWorkspace: React.FC<WidgetDrivenWorkspaceProps> = ({ definition, forcedViewport, previewMode = false }) => {
  const { currentUser, hotelConfig, logout, supabaseStatus, rbacMatrix } = useHotel();
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);
  const [detectedViewport, setDetectedViewport] = useState<WorkspaceViewport>(detectViewport);
  const [now, setNow] = useState(() => new Date());
  const viewport = forcedViewport || detectedViewport;

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30000);
    if (forcedViewport) return () => window.clearInterval(clock);
    const media = window.matchMedia('(max-width: 767px)');
    const onViewport = () => setDetectedViewport(detectViewport());
    media.addEventListener('change', onViewport);
    return () => { window.clearInterval(clock); media.removeEventListener('change', onViewport); };
  }, [forcedViewport]);

  const deviceMode = getWorkspaceDeviceMode(definition, viewport);
  const entries = normalizeWorkspaceWidgets(definition.widgets)
    .map(widget => ({ widget, presentation: resolveWidgetPresentation(definition, widget, viewport) }))
    .filter(({ widget, presentation }) => widget.enabled !== false && widget.permissions?.view !== false && !presentation.hidden)
    .filter(({ widget }) => {
      const requiredResource = getWidgetCatalogItem(widget.type)?.requiredRbacResource;
      if (!requiredResource) return true;
      const role = currentUser?.tipo_usuario;
      return Boolean(role && canAccessResource(rbacMatrix, role, requiredResource));
    })
    .filter(({ widget }) => viewport !== 'kds' || deviceMode !== 'auto' || getWidgetKdsSuitability(widget.type).suitability !== 'unsupported')
    .sort((a, b) => (a.presentation.order ?? a.widget.order ?? 0) - (b.presentation.order ?? b.widget.order ?? 0));
  const widgets = entries.map(entry => entry.widget);
  const openWidget = useMemo(() => widgets.find(widget => widget.id === openWidgetId) || null, [widgets, openWidgetId]);
  const OpenRenderer = openWidget ? getWorkspaceWidgetRenderer(openWidget.type) : null;
  const header = definition.presentation?.header;
  const kds = definition.presentation?.kds;
  const timezone = header?.timezone || 'America/Sao_Paulo';
  const dateText = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: timezone }).format(now);
  const timeText = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: header?.hourFormat === '12h', timeZone: timezone }).format(now);
  const operationalDateText = formatOperationalDate(getOperationalTodayStr(), timezone);
  const isKds = viewport === 'kds';
  const isKdsDisabled = isKds && deviceMode === 'disabled';
  const kdsOrientation = kds?.orientation || 'landscape';
  const kdsDensity = kds?.density || 'normal';
  const kdsDistance = kds?.viewingDistance || 'medium';
  const showAdministrativeControls = !previewMode && (!isKds || kds?.hideAdministrativeControls !== true);
  const showEditingControls = !isKds || kds?.hideEditingControls !== true;
  const realtimeEnabled = kds?.realtime !== false;
  const statusLabel = supabaseStatus === 'connected' ? 'Operação normal' : supabaseStatus === 'syncing' ? 'Sincronizando' : supabaseStatus === 'offline' ? 'Operação local' : 'Atenção operacional';

  useEffect(() => {
    if (!openWidgetId || previewMode || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenWidgetId(null); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [openWidgetId, previewMode]);

  const kdsShellClass = isKds && kds?.fullscreen && !previewMode ? 'fixed inset-0 z-[100] overflow-auto' : 'min-h-screen';
  const kdsGridClass = kdsOrientation === 'portrait'
    ? 'grid grid-cols-1 gap-5 md:grid-cols-2'
    : 'grid grid-cols-1 gap-5 lg:grid-cols-3 xl:grid-cols-4';
  const kdsDensityClass = kdsDensity === 'compact' ? 'p-3 sm:p-4 gap-3' : kdsDensity === 'large' ? 'p-6 sm:p-8 gap-7' : 'p-4 sm:p-6 gap-5';
  const kdsDistanceClass = kdsDistance === 'far'
    ? '[&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_p]:text-base [&_button]:text-base'
    : kdsDistance === 'near'
      ? '[&_h1]:text-xl [&_h2]:text-lg'
      : '[&_h1]:text-2xl [&_h2]:text-xl [&_p]:text-sm';

  const openWidgetPanel = (widgetId: string) => { if (!previewMode) setOpenWidgetId(widgetId); };

  const desktopSegments: Array<{ kind: 'panels' | 'buttons'; items: typeof entries }> = [];
  if (viewport === 'desktop') {
    entries.forEach(entry => {
      const kind = entry.presentation.display === 'button' ? 'buttons' : 'panels';
      const previous = desktopSegments[desktopSegments.length - 1];
      if (previous?.kind === kind) previous.items.push(entry);
      else desktopSegments.push({ kind, items: [entry] });
    });
  }

  const renderWidget = (
    widget: WorkspaceWidgetDefinition,
    presentation: ResolvedWidgetPresentation,
    desktopStyle?: { suppressHeader?: boolean; connectedPanel?: boolean; buttonInStrip?: boolean },
  ) => {
    const Renderer = getWorkspaceWidgetRenderer(widget.type);
    const isButton = !isKds && presentation.display === 'button';
    const isSummary = viewport === 'mobile' && presentation.display === 'summary';
    const headerStyle = presentation.header;
    const shellVisual = visualClass(presentation.visual);
    const connectedPanelClass = desktopStyle?.connectedPanel ? '[&>*]:!rounded-none [&>*]:!border-0 [&>*]:!shadow-none' : '';
    const buttonSectionClass = desktopStyle?.buttonInStrip ? 'min-w-[12rem] flex-1' : '';
    const buttonClass = desktopStyle?.buttonInStrip
      ? 'group flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/40'
      : 'group flex min-h-24 w-full items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md';

    return <section className={`${heightClass(presentation.height)} ${shellVisual} ${connectedPanelClass} ${buttonSectionClass}`} data-workspace-widget={widget.type} data-widget-id={widget.id} data-widget-display={isButton ? 'button' : isSummary ? 'summary' : 'panel'} data-widget-width={presentation.width} data-widget-height={presentation.height} data-widget-visual={presentation.visual} data-widget-header={headerStyle}>
      {!desktopStyle?.suppressHeader && headerStyle !== 'hidden' && !isButton && !isSummary && <div className={`mb-2 flex items-end justify-between gap-3 px-1 ${isKds ? 'text-white' : 'text-slate-900'}`} data-widget-presentation-header>
        <div className="min-w-0">
          {headerStyle === 'full' && <p className={`text-[9px] font-black uppercase tracking-wider ${isKds ? 'text-amber-300' : 'text-amber-700'}`}>{widget.type}</p>}
          <h2 className={`${headerStyle === 'compact' ? 'text-xs' : 'text-sm'} truncate font-black`}>{widget.title || widget.type}</h2>
        </div>
      </div>}
      {isButton ? <button type="button" onClick={() => openWidgetPanel(widget.id)} className={buttonClass} aria-haspopup="dialog"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Abrir widget</p><h2 className="mt-1 truncate text-sm font-black text-slate-900">{widget.title || widget.type}</h2><p className="mt-1 text-[10px] text-slate-500">Exibição em janela</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-amber-500 group-hover:text-slate-950"><ExternalLink className="h-4 w-4" /></span></button>
        : isSummary ? <button type="button" onClick={() => openWidgetPanel(widget.id)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm" aria-haspopup="dialog" data-widget-mobile-summary><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Resumo</p><h2 className="truncate text-sm font-black text-slate-900">{widget.title || widget.type}</h2><p className="mt-1 text-[10px] text-slate-500">Toque para ver o painel completo</p></div><ExternalLink className="h-4 w-4 shrink-0 text-slate-500" /></button>
          : Renderer ? <Renderer workspace={definition} widget={widget} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-slate-950"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p><h2 className="mt-1 text-sm font-black">{widget.title || widget.type}</h2></div>}
    </section>;
  };

  const renderDesktopSurface = () => {
    if (!desktopSegments.length) return null;
    return <MasonryCell width="full">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-200" data-desktop-connected-surface>
        {desktopSegments.map((segment, segmentIndex) => segment.kind === 'buttons'
          ? <div key={`desktop-buttons-${segmentIndex}`} className="bg-white p-2" data-desktop-button-strip>
              <div className="flex w-full flex-nowrap gap-2 overflow-x-auto">
                {segment.items.map(({ widget, presentation }) => <React.Fragment key={widget.id}>{renderWidget(widget, presentation, { buttonInStrip: true })}</React.Fragment>)}
              </div>
            </div>
          : <div key={`desktop-panels-${segmentIndex}`} className="grid grid-cols-1 bg-white md:grid-cols-4 xl:grid-cols-12" data-desktop-panel-grid>
              {segment.items.map(({ widget, presentation }) => <div key={widget.id} className={`${masonrySpanClass(presentation.width)} min-w-0 bg-white`} data-desktop-connected-item data-desktop-item-width={presentation.width}>
                {renderWidget(widget, presentation, { suppressHeader: true, connectedPanel: true })}
              </div>)}
            </div>)}
      </div>
    </MasonryCell>;
  };

  return <div className={`${kdsShellClass} text-slate-950 ${isKds ? `bg-slate-950 text-white ${kdsDistanceClass}` : 'bg-slate-100'}`} data-workspace-runtime="widget-driven" data-workspace-id={definition.id} data-workspace-viewport={viewport} data-workspace-device-mode={deviceMode} data-workspace-preview={previewMode ? 'true' : undefined} data-kds-orientation={isKds ? kdsOrientation : undefined} data-kds-density={isKds ? kdsDensity : undefined} data-kds-viewing-distance={isKds ? kdsDistance : undefined} data-kds-fullscreen={isKds ? String(kds?.fullscreen === true) : undefined} data-kds-realtime={isKds ? String(realtimeEnabled) : undefined} data-kds-admin-controls-hidden={isKds ? String(!showAdministrativeControls) : undefined} data-kds-editing-controls-hidden={isKds ? String(!showEditingControls) : undefined}>
    <header className={`sticky top-0 z-30 border-b ${isKds ? 'border-slate-800 bg-slate-950/95' : 'border-slate-200 bg-white/95'} backdrop-blur`}>
      <div className={`mx-auto flex max-w-[1800px] items-center justify-between gap-4 ${isKds && kdsDensity === 'large' ? 'px-8 py-5' : 'px-4 py-3 sm:px-6'}`}>
        <div className="min-w-0">
          {header?.showHotel !== false && <p className={`truncate text-[9px] font-black uppercase tracking-widest ${isKds ? 'text-amber-300' : 'text-amber-700'}`}>{hotelConfig.nome}</p>}
          {header?.showWorkspace !== false && <div className="flex items-center gap-2"><h1 className="truncate text-lg font-black">{definition.name}</h1><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">{isKds ? 'KDS / TV' : 'Workspace'}</span></div>}
          {!isKds && <p className="mt-0.5 truncate text-[10px] text-slate-500">{definition.description}</p>}
          {header?.showStatus !== false && <div className={`mt-1 inline-flex items-center gap-1.5 text-[9px] font-bold ${isKds ? 'text-slate-300' : 'text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${supabaseStatus === 'connected' ? 'bg-emerald-500' : supabaseStatus === 'syncing' ? 'bg-amber-500' : 'bg-rose-500'}`} />{statusLabel}{isKds && realtimeEnabled ? ' • Tempo real' : ''}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            {header?.showDate !== false && <div className={`text-[10px] font-bold capitalize ${isKds ? 'text-slate-300' : 'text-slate-500'}`}>{dateText}</div>}
            {header?.showTime !== false && <div className={`text-xl font-black tabular-nums ${isKds ? 'text-white' : 'text-slate-900'}`}>{timeText}</div>}
            {header?.showOperationalDate === true && <div className={`mt-0.5 text-[9px] font-bold ${isKds ? 'text-slate-400' : 'text-slate-400'}`}>Operacional: {operationalDateText}</div>}
          </div>
          {header?.showUser !== false && <span className={`hidden text-right text-[10px] lg:block ${isKds ? 'text-slate-300' : 'text-slate-500'}`}><strong className={`block ${isKds ? 'text-white' : 'text-slate-700'}`}>{currentUser?.nome || 'Usuário'}</strong>{definition.sectors.join(' · ')}</span>}
          {showAdministrativeControls && <><WorkspaceUserMenu /><button onClick={logout} className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-[10px] font-black transition ${isKds ? 'border-slate-700 text-slate-200 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><LogOut className="h-3.5 w-3.5" />Sair</button></>}
        </div>
      </div>
    </header>
    {isKdsDisabled ? <main className="mx-auto grid min-h-[50vh] max-w-[1800px] place-items-center p-8"><div className="max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center"><p className="text-xs font-black uppercase tracking-wider text-amber-300">KDS / TV</p><h2 className="mt-2 text-2xl font-black text-white">Apresentação desativada</h2><p className="mt-2 text-sm text-slate-300">Ative ou personalize o KDS na Fábrica de Workspaces.</p></div></main> : <main className={`mx-auto max-w-[1800px] ${viewport === 'mobile' ? 'flex flex-col gap-4 p-4' : isKds ? `${kdsGridClass} ${kdsDensityClass}` : 'grid grid-cols-1 gap-4 p-4 sm:p-6 md:grid-cols-4 md:auto-rows-[8px] md:[grid-auto-flow:dense] xl:grid-cols-12'}`}>
      {viewport === 'desktop'
        ? renderDesktopSurface()
        : entries.map(({ widget, presentation }) => <div key={widget.id} className={isKds ? kdsSpanClass(presentation.width, kdsOrientation) : ''}>{renderWidget(widget, presentation)}</div>)}
    </main>}
    {openWidget && !previewMode && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={openWidget.title || openWidget.type} onMouseDown={event => { if (event.target === event.currentTarget) setOpenWidgetId(null); }}><div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl sm:max-h-[calc(100dvh-3rem)]"><div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5"><div><p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Widget</p><h2 className="text-sm font-black text-slate-900">{openWidget.title || openWidget.type}</h2></div><button type="button" onClick={() => setOpenWidgetId(null)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600" aria-label="Fechar widget"><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">{OpenRenderer ? <OpenRenderer workspace={definition} widget={openWidget} /> : null}</div></div></div>, document.body)}
  </div>;
};
