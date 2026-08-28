import React from 'react';
import { LogOut } from 'lucide-react';
import { useHotel } from '../context/HotelContext';
import { normalizeWorkspaceWidgets } from './widgetCatalog';
import { WorkspaceDefinition, WorkspaceWidgetSpan } from './types';
import { getWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';

const spanClass = (span: WorkspaceWidgetSpan | undefined) => {
  switch (span) {
    case 1: return 'xl:col-span-1';
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
  const widgets = normalizeWorkspaceWidgets(definition.widgets)
    .filter(widget => widget.enabled !== false && widget.permissions?.view !== false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" data-workspace-runtime="widget-driven" data-workspace-id={definition.id}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div><div className="flex items-center gap-2"><h1 className="text-lg font-black">{definition.name}</h1><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">Workspace</span></div><p className="mt-0.5 text-[10px] text-slate-500">{definition.description}</p></div><div className="flex items-center gap-3"><span className="hidden text-right text-[10px] text-slate-500 sm:block"><strong className="block text-slate-700">{currentUser?.nome || 'Usuário'}</strong>{definition.sectors.join(' · ')}</span><button onClick={logout} className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-[10px] font-black text-slate-600"><LogOut className="h-3.5 w-3.5" />Sair</button></div></div></header>
      <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-4 sm:p-6 xl:grid-cols-4">
        {widgets.map(widget => {
          const Renderer = getWorkspaceWidgetRenderer(widget.type);
          return <section key={widget.id} className={spanClass(widget.span)} data-workspace-widget={widget.type} data-widget-id={widget.id}>{Renderer ? <Renderer workspace={definition} widget={widget} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p><h2 className="mt-1 text-sm font-black text-slate-900">{widget.title || widget.type}</h2></div>}</section>;
        })}
      </main>
    </div>
  );
};
