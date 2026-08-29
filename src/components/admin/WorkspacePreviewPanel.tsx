import React, { useState } from 'react';
import { Monitor, Smartphone, Tv } from 'lucide-react';
import { WidgetDrivenWorkspace } from '../../workspace-engine/WidgetDrivenWorkspace';
import { WorkspaceDefinition, WorkspaceViewport } from '../../workspace-engine/types';

interface WorkspacePreviewPanelProps {
  definition: WorkspaceDefinition;
}

const options: Array<{ id: WorkspaceViewport; label: string; Icon: typeof Monitor }> = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
  { id: 'mobile', label: 'Celular', Icon: Smartphone },
  { id: 'kds', label: 'KDS / TV', Icon: Tv },
];

export const WorkspacePreviewPanel: React.FC<WorkspacePreviewPanelProps> = ({ definition }) => {
  const [viewport, setViewport] = useState<WorkspaceViewport>('desktop');
  const frameClass = viewport === 'mobile' ? 'max-w-[420px]' : viewport === 'kds' ? 'max-w-[1280px]' : 'max-w-[1440px]';

  return <div className="rounded-3xl border border-stone-200 bg-white p-5" data-workspace-factory-preview>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-black text-stone-900">Visualizar Workspace</h3>
        <p className="mt-1 text-[10px] text-stone-500">Prévia não interativa da configuração atual, inclusive antes de salvar.</p>
      </div>
      <div className="inline-flex w-fit rounded-2xl border border-stone-200 bg-stone-50 p-1" role="group" aria-label="Dispositivo do preview">
        {options.map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setViewport(id)} className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-black transition ${viewport === id ? 'bg-stone-950 text-white shadow-sm' : 'text-stone-600 hover:bg-white'}`} aria-pressed={viewport === id}><Icon className="h-3.5 w-3.5" />{label}</button>)}
      </div>
    </div>
    <div className="mt-4 max-h-[760px] overflow-auto rounded-2xl border border-stone-200 bg-stone-100 p-3" data-workspace-preview-viewport={viewport}>
      <div className={`mx-auto min-w-0 overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm ${frameClass}`}>
        <div className="pointer-events-none select-none" aria-hidden="true">
          <WidgetDrivenWorkspace definition={definition} forcedViewport={viewport} previewMode />
        </div>
      </div>
    </div>
  </div>;
};
