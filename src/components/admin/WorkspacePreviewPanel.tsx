import React, { useEffect, useState } from 'react';
import { Eye, Monitor, Smartphone, Tablet, Tv, X } from 'lucide-react';
import { WidgetDrivenWorkspace } from '../../workspace-engine/WidgetDrivenWorkspace';
import { WorkspaceDefinition, WorkspaceViewport } from '../../workspace-engine/types';

interface WorkspacePreviewPanelProps {
  definition: WorkspaceDefinition;
}

const options: Array<{ id: WorkspaceViewport; label: string; Icon: typeof Monitor }> = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
  { id: 'tablet', label: 'Tablet', Icon: Tablet },
  { id: 'mobile', label: 'Celular', Icon: Smartphone },
  { id: 'kds', label: 'KDS / TV', Icon: Tv },
];

export const WorkspacePreviewPanel: React.FC<WorkspacePreviewPanelProps> = ({ definition }) => {
  const [viewport, setViewport] = useState<WorkspaceViewport>('desktop');
  const [open, setOpen] = useState(false);
  const frameClass = viewport === 'mobile'
    ? 'max-w-[420px]'
    : viewport === 'tablet'
      ? 'max-w-[1024px]'
      : viewport === 'kds'
        ? 'max-w-[1280px]'
        : 'max-w-[1440px]';
  const runtimeViewport: WorkspaceViewport = viewport === 'tablet' ? 'desktop' : viewport;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return <div className="flex justify-end" data-workspace-factory-preview>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-black text-stone-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50" data-workspace-preview-open>
      <Eye className="h-4 w-4" /> Visualizar Workspace
    </button>

    {open && <div className="fixed inset-0 z-[120] bg-stone-950/60 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Visualizar Workspace" data-workspace-preview-popup onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-sm font-black text-stone-900">Visualizar Workspace</h3>
            <p className="mt-1 text-[10px] text-stone-500">Prévia não interativa da configuração atual, inclusive antes de salvar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex w-fit rounded-2xl border border-stone-200 bg-stone-50 p-1" role="group" aria-label="Dispositivo do preview">
              {options.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setViewport(id)} className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-black transition ${viewport === id ? 'bg-stone-950 text-white shadow-sm' : 'text-stone-600 hover:bg-white'}`} aria-pressed={viewport === id}><Icon className="h-3.5 w-3.5" />{label}</button>)}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50" aria-label="Fechar visualização"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-stone-100 p-3 sm:p-4" data-workspace-preview-viewport={viewport}>
          <div className={`mx-auto min-w-0 overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm ${frameClass}`}>
            <div className="pointer-events-none select-none" aria-hidden="true">
              <WidgetDrivenWorkspace definition={definition} forcedViewport={runtimeViewport} previewMode />
            </div>
          </div>
        </div>
      </div>
    </div>}
  </div>;
};
