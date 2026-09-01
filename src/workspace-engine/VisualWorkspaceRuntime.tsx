import React, { useEffect, useMemo, useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { WorkspaceShortcutSummary } from './WorkspaceShortcutSummary';
import { WorkspaceWidgetHost } from './WorkspaceWidgetHost';
import { createReceptionVisualPresentation } from './receptionVisualTemplate';
import { createGovernanceVisualPresentation } from './governanceVisualTemplate';
import { createMaintenanceVisualPresentation } from './maintenanceVisualTemplate';
import { createKitchenVisualPresentation } from './kitchenVisualTemplate';
import { createOperationsVisualPresentation } from './operationsVisualTemplate';
import { WorkspaceDefinition, WorkspaceViewport, WorkspaceWidgetDefinition } from './types';
import { getWorkspaceVisualSurface } from './visualPresentation';

const detectViewport = (): WorkspaceViewport => {
  if (typeof window === 'undefined') return 'desktop';
  const requested = new URLSearchParams(window.location.search).get('workspaceView');
  if (requested === 'kds') return 'kds';
  if (requested === 'tablet') return 'tablet';
  if (requested === 'mobile') return 'mobile';
  const width = window.innerWidth;
  if (width <= 767) return 'mobile';
  if (width <= 1180) return 'tablet';
  return 'desktop';
};

const resolveVisualPresentation = (definition: WorkspaceDefinition) => {
  if (definition.visualPresentation) return definition.visualPresentation;
  if (definition.sectors.includes('recepcao')) return createReceptionVisualPresentation(definition.widgets);
  if (definition.sectors.includes('governanca')) return createGovernanceVisualPresentation(definition.widgets);
  if (definition.sectors.includes('manutencao')) return createMaintenanceVisualPresentation(definition.widgets);
  if (definition.sectors.includes('cozinha')) return createKitchenVisualPresentation(definition.widgets);
  if (definition.sectors.includes('operacao')) return createOperationsVisualPresentation(definition.widgets);
  return undefined;
};

interface VisualWorkspaceRuntimeProps { definition: WorkspaceDefinition; }

/** Presentation-only operational renderer. Domain behavior remains in existing widgets. */
export const VisualWorkspaceRuntime: React.FC<VisualWorkspaceRuntimeProps> = ({ definition }) => {
  const [viewport, setViewport] = useState<WorkspaceViewport>(detectViewport);
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);
  const presentation = useMemo(() => resolveVisualPresentation(definition), [definition]);
  useEffect(() => { const onResize = () => setViewport(detectViewport()); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
  if (!presentation) return null;
  const surface = getWorkspaceVisualSurface(presentation, viewport);
  const visibleWidget = (widgetId: string): WorkspaceWidgetDefinition | null => {
    const widget = definition.widgets.find(item => item.id === widgetId) || null;
    return !widget || widget.enabled === false || widget.permissions?.view === false ? null : widget;
  };
  const openWidget = openWidgetId ? visibleWidget(openWidgetId) : null;
  return <div className="min-h-screen bg-slate-100 p-2 sm:p-4" data-workspace-runtime="visual" data-workspace-id={definition.id} data-workspace-viewport={viewport}>
    <div className="relative mx-auto w-full max-w-[1800px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl" style={{ aspectRatio: String(surface.template?.aspectRatio || (viewport === 'mobile' ? 9 / 16 : viewport === 'tablet' ? 4 / 3 : 16 / 9)) }} data-workspace-visual-runtime-surface>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.12)_1px,transparent_0)] bg-[size:18px_18px]" />
      {surface.template?.backgroundAsset && <img src={surface.template.backgroundAsset} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" />}
      <div className="absolute inset-0 bg-white/5" />
      {surface.sidebar.enabled && <aside className="absolute z-20 overflow-hidden rounded-r-3xl border border-slate-900/10 bg-slate-950/92 p-2 text-white shadow-2xl backdrop-blur" style={{ left: `${surface.sidebar.rect.x}%`, top: `${surface.sidebar.rect.y}%`, width: `${surface.sidebar.rect.width}%`, height: `${surface.sidebar.rect.height}%` }} data-workspace-runtime-sidebar>
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 text-[9px] font-black uppercase tracking-wider"><PanelLeft className="h-3.5 w-3.5" />{definition.name}</div>
        <div className="mt-2 space-y-1.5">{surface.sidebar.widgetIds.map(widgetId => { const widget = visibleWidget(widgetId); return widget ? <button key={widgetId} type="button" onClick={() => setOpenWidgetId(widget.id)} className="block w-full truncate rounded-xl bg-white/10 px-2 py-2.5 text-left text-[9px] font-bold transition hover:bg-white/20" aria-haspopup="dialog">{widget.title || widget.type}</button> : null; })}</div>
      </aside>}
      {surface.shortcuts.map(shortcut => { const widget = visibleWidget(shortcut.widgetId); return widget ? <button key={shortcut.id} type="button" onClick={() => setOpenWidgetId(widget.id)} className="absolute z-10 overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-3 text-left shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400" style={{ left: `${shortcut.rect.x}%`, top: `${shortcut.rect.y}%`, width: `${shortcut.rect.width}%`, height: `${shortcut.rect.height}%` }} aria-haspopup="dialog" data-workspace-runtime-shortcut={shortcut.widgetId} data-workspace-shortcut-size={shortcut.size}><WorkspaceShortcutSummary widget={widget} size={shortcut.size} /></button> : null; })}
    </div>
    <WorkspaceWidgetHost workspace={definition} widget={openWidget} open={Boolean(openWidget)} onClose={() => setOpenWidgetId(null)} mode={viewport === 'mobile' ? 'fullscreen' : 'modal'} />
  </div>;
};

export const hasVisualWorkspaceRuntime = (definition: WorkspaceDefinition) => Boolean(
  definition.visualPresentation
  || definition.sectors.includes('recepcao')
  || definition.sectors.includes('governanca')
  || definition.sectors.includes('manutencao')
  || definition.sectors.includes('cozinha')
  || definition.sectors.includes('operacao')
);
