import React from 'react';
import { BedDouble, CalendarDays, ClipboardList, Construction, LogIn, ShoppingBag, Users, Wrench } from 'lucide-react';
import { WorkspaceWidgetDefinition, WorkspaceWidgetType } from './types';
import { getWidgetCatalogItem } from './widgetCatalog';

const iconByType: Partial<Record<WorkspaceWidgetType, React.ComponentType<{ className?: string }>>> = {
  'rooms-list': BedDouble,
  'reservations-list': CalendarDays,
  checkins: LogIn,
  maintenance: Wrench,
  orders: ShoppingBag,
  team: Users,
  shortcuts: ClipboardList,
};

export const workspaceWidgetSpanClass = (span: WorkspaceWidgetDefinition['span']) =>
  span === 'full' ? 'lg:col-span-4' : span === 3 ? 'lg:col-span-3' : span === 2 ? 'lg:col-span-2' : 'lg:col-span-1';

/**
 * Visible runtime shell for catalog widgets whose domain data adapter is not connected yet.
 * Keeping this in the Workspace layer makes configured composition truthful without
 * inventing hotel data or coupling new modules to the sealed Kanban engine.
 */
export const WorkspaceDataWidget: React.FC<{ widget: WorkspaceWidgetDefinition }> = ({ widget }) => {
  const catalog = getWidgetCatalogItem(widget.type);
  const Icon = iconByType[widget.type] || Construction;

  return (
    <section className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></div>
        <div>
          <h2 className="text-sm font-black text-slate-900">{widget.title || catalog?.label || widget.type}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{catalog?.description || 'Bloco configurado para este Workspace.'}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Componente ativo</p>
        <p className="mt-1 text-[10px] text-slate-400">A fonte de dados deste bloco será conectada na etapa de ajustes.</p>
      </div>
    </section>
  );
};
