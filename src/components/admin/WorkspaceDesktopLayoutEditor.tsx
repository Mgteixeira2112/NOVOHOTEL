import React, { useState } from 'react';
import { GripVertical, Maximize2, Move } from 'lucide-react';
import { legacySpanToWidth } from '../../workspace-engine/presentation';
import { WorkspaceDefinition, WorkspaceWidgetWidth } from '../../workspace-engine/types';
import { getWidgetCatalogItem } from '../../workspace-engine/widgetCatalog';

interface WorkspaceDesktopLayoutEditorProps {
  definition: WorkspaceDefinition;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

const widths: WorkspaceWidgetWidth[] = ['small', 'medium', 'large', 'full'];
const widthLabels: Record<WorkspaceWidgetWidth, string> = {
  small: '25%',
  medium: '50%',
  large: '75%',
  full: '100%',
};
const widthClasses: Record<WorkspaceWidgetWidth, string> = {
  small: 'col-span-3',
  medium: 'col-span-6',
  large: 'col-span-9',
  full: 'col-span-12',
};

export const WorkspaceDesktopLayoutEditor: React.FC<WorkspaceDesktopLayoutEditorProps> = ({ definition, onChange }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const ordered = [...definition.widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const updateWidth = (widgetId: string, width: WorkspaceWidgetWidth) => {
    onChange({
      widgets: definition.widgets.map(widget => widget.id === widgetId
        ? { ...widget, presentation: { ...widget.presentation, width } }
        : widget),
    });
  };

  const reorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const next = [...ordered];
    const sourceIndex = next.findIndex(widget => widget.id === sourceId);
    const targetIndex = next.findIndex(widget => widget.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange({ widgets: next.map((widget, index) => ({ ...widget, order: (index + 1) * 10 })) });
  };

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, widgetId: string, currentWidth: WorkspaceWidgetWidth) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startIndex = widths.indexOf(currentWidth);
    let lastIndex = startIndex;

    const onMove = (pointerEvent: PointerEvent) => {
      const steps = Math.round((pointerEvent.clientX - startX) / 90);
      const nextIndex = Math.max(0, Math.min(widths.length - 1, startIndex + steps));
      if (nextIndex === lastIndex) return;
      lastIndex = nextIndex;
      updateWidth(widgetId, widths[nextIndex]);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  return <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4" data-workspace-desktop-layout-editor>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2"><Move className="h-4 w-4 text-amber-600" /><p className="text-xs font-black text-stone-900">Composição visual Desktop</p></div>
        <p className="mt-1 text-[10px] text-stone-500">Arraste os blocos para mudar a ordem e use a alça ou os tamanhos para redimensionar. Tablet herda esta composição enquanto estiver em Herdar Desktop.</p>
      </div>
      <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-stone-500">Layout apenas</span>
    </div>

    <div className="mt-4 grid grid-cols-12 gap-2 rounded-2xl border border-dashed border-stone-300 bg-white p-3" data-workspace-desktop-layout-canvas>
      {ordered.map(widget => {
        const width = widget.presentation?.width || legacySpanToWidth(widget.span);
        const label = getWidgetCatalogItem(widget.type)?.label || widget.title || widget.type;
        const isDisabled = widget.enabled === false;
        return <article
          key={widget.id}
          draggable
          onDragStart={event => { setDraggedId(widget.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', widget.id); }}
          onDragEnd={() => setDraggedId(null)}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
          onDrop={event => { event.preventDefault(); const sourceId = draggedId || event.dataTransfer.getData('text/plain'); if (sourceId) reorder(sourceId, widget.id); setDraggedId(null); }}
          className={`${widthClasses[width]} relative min-h-28 rounded-xl border bg-stone-50 p-3 transition ${draggedId === widget.id ? 'border-amber-400 opacity-60' : 'border-stone-200'} ${isDisabled ? 'opacity-50' : ''}`}
          data-workspace-layout-widget={widget.id}
          data-workspace-layout-width={width}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-stone-400"><GripVertical className="h-3.5 w-3.5" /><span className="text-[8px] font-black uppercase tracking-wider">{widget.type}</span></div>
              <p className="mt-1 truncate text-xs font-black text-stone-900">{widget.title || label}</p>
              <p className="mt-1 text-[9px] text-stone-500">{widget.presentation?.display === 'button' ? 'Botão / popup' : 'Painel'}{isDisabled ? ' · desativado' : ''}</p>
            </div>
            <span className="rounded-md bg-white px-1.5 py-1 text-[9px] font-black text-stone-600 shadow-sm">{widthLabels[width]}</span>
          </div>

          <div className="absolute bottom-2 left-2 flex gap-1" aria-label={`Largura de ${widget.title || label}`}>
            {widths.map(option => <button
              key={option}
              type="button"
              onClick={() => updateWidth(widget.id, option)}
              className={`h-6 rounded-md px-1.5 text-[8px] font-black ${width === option ? 'bg-stone-950 text-white' : 'border border-stone-200 bg-white text-stone-500 hover:bg-stone-100'}`}
              aria-pressed={width === option}
              data-workspace-layout-size={option}
            >{widthLabels[option]}</button>)}
          </div>

          <button
            type="button"
            onPointerDown={event => beginResize(event, widget.id, width)}
            className="absolute bottom-1.5 right-1.5 grid h-7 w-7 cursor-ew-resize place-items-center rounded-md text-stone-400 hover:bg-white hover:text-stone-700"
            aria-label={`Redimensionar ${widget.title || label}`}
            title="Arraste horizontalmente para redimensionar"
            data-workspace-layout-resize
          ><Maximize2 className="h-3.5 w-3.5" /></button>
        </article>;
      })}
    </div>

    <p className="mt-2 text-[9px] leading-relaxed text-stone-400">Este editor altera somente a ordem e a largura já existentes na apresentação do Workspace. Conteúdo, dados, permissões e comportamento dos widgets permanecem intocados.</p>
  </div>;
};
