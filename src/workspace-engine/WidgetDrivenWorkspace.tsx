import React from 'react';
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

/**
 * Universal Workspace canvas.
 *
 * It intentionally contains no Reception, Governance, Maintenance or Kanban
 * business rules. It only interprets the declarative definition produced by
 * the Workspace Creator and resolves every visible block through the widget
 * runtime registry.
 */
export const WidgetDrivenWorkspace: React.FC<WidgetDrivenWorkspaceProps> = ({ definition }) => {
  const widgets = normalizeWorkspaceWidgets(definition.widgets)
    .filter(widget => widget.permissions?.view !== false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950" data-workspace-runtime="widget-driven" data-workspace-id={definition.id}>
      <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-4 sm:p-6 xl:grid-cols-4">
        {widgets.map(widget => {
          const Renderer = getWorkspaceWidgetRenderer(widget.type);
          return (
            <section key={widget.id} className={spanClass(widget.span)} data-workspace-widget={widget.type} data-widget-id={widget.id}>
              {Renderer
                ? <Renderer workspace={definition} widget={widget} />
                : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p>
                    <h2 className="mt-1 text-sm font-black text-slate-900">{widget.title || widget.type}</h2>
                    <p className="mt-2 text-xs text-slate-500">Este bloco já faz parte da definição do Workspace, mas ainda não foi migrado para um renderer reutilizável.</p>
                  </div>
                )}
            </section>
          );
        })}
      </main>
    </div>
  );
};
