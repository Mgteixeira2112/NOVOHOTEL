import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical, Maximize2, Move } from 'lucide-react';
import { WidgetDrivenWorkspace } from '../../workspace-engine/WidgetDrivenWorkspace';
import { legacySpanToWidth, normalizeWidgetPresentation } from '../../workspace-engine/presentation';
import {
  WorkspaceDefinition,
  WorkspaceWidgetDevicePresentation,
  WorkspaceWidgetDisplay,
  WorkspaceWidgetHeaderStyle,
  WorkspaceWidgetHeight,
  WorkspaceWidgetVisualStyle,
  WorkspaceWidgetWidth,
} from '../../workspace-engine/types';

interface WorkspaceDesktopLayoutEditorProps {
  definition: WorkspaceDefinition;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

interface WidgetOverlayRect {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

const widths: WorkspaceWidgetWidth[] = ['small', 'medium', 'large', 'full'];
const widthLabels: Record<WorkspaceWidgetWidth, string> = {
  small: '25%',
  medium: '50%',
  large: '75%',
  full: '100%',
};

const fieldClass = 'mt-1 h-9 w-full rounded-xl border border-stone-200 bg-white px-2 text-xs text-stone-900';
const labelClass = 'text-[10px] font-bold text-stone-600';

export const WorkspaceDesktopLayoutEditor: React.FC<WorkspaceDesktopLayoutEditorProps> = ({ definition, onChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overlayRects, setOverlayRects] = useState<WidgetOverlayRect[]>([]);
  const ordered = [...definition.widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const selectedWidget = definition.widgets.find(widget => widget.id === selectedId);
  const selectedBasePresentation = selectedWidget ? normalizeWidgetPresentation(selectedWidget) : null;
  const selectedDesktop = selectedWidget?.presentation?.desktop?.mode === 'auto'
    ? {}
    : (selectedWidget?.presentation?.desktop || {});

  const updateDesktopOverride = (widgetId: string, patch: Partial<WorkspaceWidgetDevicePresentation>) => {
    onChange({
      presentation: {
        ...definition.presentation,
        devices: { ...definition.presentation?.devices, desktop: 'custom' },
      },
      widgets: definition.widgets.map(widget => {
        if (widget.id !== widgetId) return widget;
        const current = widget.presentation?.desktop?.mode === 'auto' ? {} : (widget.presentation?.desktop || {});
        return {
          ...widget,
          presentation: {
            ...widget.presentation,
            desktop: { ...current, mode: 'custom', ...patch },
          },
        };
      }),
    });
  };

  const updateWidth = (widgetId: string, width: WorkspaceWidgetWidth) => {
    updateDesktopOverride(widgetId, { width });
  };

  const clearDesktopOverride = (widgetId: string) => {
    onChange({
      widgets: definition.widgets.map(widget => widget.id === widgetId
        ? { ...widget, presentation: { ...widget.presentation, desktop: { mode: 'auto' } } }
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
    setSelectedId(widgetId);
    const startX = event.clientX;
    const startIndex = widths.indexOf(currentWidth);
    let lastIndex = startIndex;

    const onMove = (pointerEvent: PointerEvent) => {
      const canvasWidth = canvasRef.current?.clientWidth || 1200;
      const stepWidth = Math.max(70, canvasWidth / 12 * 3);
      const steps = Math.round((pointerEvent.clientX - startX) / stepWidth);
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

  const measureWidgets = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const next = Array.from(canvas.querySelectorAll<HTMLElement>('[data-widget-id]'))
      .map(element => {
        const id = element.dataset.widgetId;
        if (!id) return null;
        const rect = element.getBoundingClientRect();
        return {
          id,
          left: rect.left - canvasRect.left + canvas.scrollLeft,
          top: rect.top - canvasRect.top + canvas.scrollTop,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((value): value is WidgetOverlayRect => Boolean(value));
    setOverlayRects(next);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = window.requestAnimationFrame(measureWidgets);
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measureWidgets);
    });
    observer.observe(canvas);
    canvas.querySelectorAll<HTMLElement>('[data-widget-id]').forEach(element => observer.observe(element));
    window.addEventListener('resize', measureWidgets);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measureWidgets);
    };
  }, [definition, measureWidgets]);

  return <div className="mt-1" data-workspace-desktop-layout-editor>
    <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2"><Move className="h-4 w-4 text-amber-600" /><p className="text-xs font-black text-stone-900">Composição visual Desktop</p></div>
        <p className="mt-1 text-[10px] text-stone-500">Esta é a renderização real do Workspace. Mova e redimensione os widgets; ao selecionar um item, personalize somente a apresentação Desktop sem alterar o contrato comum.</p>
      </div>
      <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-stone-500">Runtime real · Desktop</span>
    </div>

    {selectedWidget && selectedBasePresentation && <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-3" data-workspace-desktop-presentation-inspector>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Override Desktop</p>
          <p className="mt-0.5 text-xs font-black text-stone-900">{selectedWidget.title || selectedWidget.type}</p>
        </div>
        <button type="button" onClick={() => clearDesktopOverride(selectedWidget.id)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-[10px] font-bold text-stone-600 hover:border-amber-300">Herdar configuração comum</button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className={labelClass}>EXIBIÇÃO<select value={selectedDesktop.display || selectedBasePresentation.display || 'panel'} onChange={e => updateDesktopOverride(selectedWidget.id, { display: e.target.value as WorkspaceWidgetDisplay })} className={fieldClass}><option value="panel">Painel</option><option value="button">Botão / popup</option></select></label>
        <label className={labelClass}>LARGURA<select value={selectedDesktop.width || selectedBasePresentation.width || 'full'} onChange={e => updateDesktopOverride(selectedWidget.id, { width: e.target.value as WorkspaceWidgetWidth })} className={fieldClass}>{widths.map(width => <option key={width} value={width}>{widthLabels[width]}</option>)}</select></label>
        <label className={labelClass}>ALTURA<select value={selectedDesktop.height || selectedBasePresentation.height || 'auto'} onChange={e => updateDesktopOverride(selectedWidget.id, { height: e.target.value as WorkspaceWidgetHeight })} className={fieldClass}><option value="auto">Automática</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></label>
        <label className={labelClass}>VISUAL<select value={selectedDesktop.visual || selectedBasePresentation.visual || 'standard'} onChange={e => updateDesktopOverride(selectedWidget.id, { visual: e.target.value as WorkspaceWidgetVisualStyle })} className={fieldClass}><option value="minimal">Minimalista</option><option value="standard">Padrão</option><option value="highlight">Destaque</option></select></label>
        <label className={labelClass}>CABEÇALHO<select value={selectedDesktop.header || selectedBasePresentation.header || 'full'} onChange={e => updateDesktopOverride(selectedWidget.id, { header: e.target.value as WorkspaceWidgetHeaderStyle })} className={fieldClass}><option value="full">Completo</option><option value="compact">Compacto</option><option value="hidden">Oculto</option></select></label>
      </div>
    </div>}

    <div ref={canvasRef} className="relative overflow-hidden rounded-2xl border border-stone-300 bg-white" data-workspace-desktop-layout-canvas>
      <div className="pointer-events-none select-none" aria-hidden="true" data-workspace-layout-runtime>
        <WidgetDrivenWorkspace definition={definition} forcedViewport="desktop" previewMode />
      </div>

      <div className="absolute inset-0 z-20" data-workspace-layout-overlay>
        {overlayRects.map(rect => {
          const widget = definition.widgets.find(item => item.id === rect.id);
          if (!widget || widget.enabled === false) return null;
          const width = widget.presentation?.desktop?.width || widget.presentation?.width || legacySpanToWidth(widget.span);
          const active = selectedId === widget.id || draggedId === widget.id;
          return <div
            key={widget.id}
            draggable
            onClick={() => setSelectedId(widget.id)}
            onDragStart={event => {
              setDraggedId(widget.id);
              setSelectedId(widget.id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', widget.id);
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={event => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={event => {
              event.preventDefault();
              const sourceId = draggedId || event.dataTransfer.getData('text/plain');
              if (sourceId) reorder(sourceId, widget.id);
              setDraggedId(null);
              setSelectedId(widget.id);
            }}
            className={`group absolute cursor-move rounded-xl border-2 transition ${active ? 'border-amber-500 bg-amber-400/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)]' : 'border-transparent hover:border-amber-400 hover:bg-amber-400/5'}`}
            style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
            data-workspace-layout-widget={widget.id}
            data-workspace-layout-width={width}
          >
            <div className={`absolute left-2 top-2 flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/95 px-2 py-1 text-[9px] font-black text-stone-700 shadow-sm backdrop-blur transition ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <GripVertical className="h-3.5 w-3.5 text-amber-600" />
              <span className="max-w-44 truncate">{widget.title || widget.type}</span>
              <span className="rounded bg-stone-950 px-1.5 py-0.5 text-white">{widthLabels[width]}</span>
            </div>

            <button
              type="button"
              onPointerDown={event => beginResize(event, widget.id, width)}
              className={`absolute bottom-2 right-2 grid h-8 w-8 cursor-ew-resize place-items-center rounded-lg border border-stone-200 bg-white/95 text-stone-600 shadow-sm backdrop-blur transition hover:border-amber-400 hover:text-amber-700 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              aria-label={`Redimensionar ${widget.title || widget.type}`}
              title="Arraste horizontalmente: 25%, 50%, 75% ou 100%"
              data-workspace-layout-resize
            ><Maximize2 className="h-4 w-4" /></button>
          </div>;
        })}
      </div>
    </div>

    <p className="mt-2 text-[9px] leading-relaxed text-stone-400">Ordem continua sendo da composição do Workspace. Largura, exibição, altura, visual e cabeçalho podem ser sobrescritos apenas no Desktop; remover o override restaura a configuração comum.</p>
  </div>;
};
