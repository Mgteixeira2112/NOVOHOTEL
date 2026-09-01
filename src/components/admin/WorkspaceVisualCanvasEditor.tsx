import React, { useMemo, useRef, useState } from 'react';
import { ExternalLink, Image, PanelLeft, Plus, Trash2 } from 'lucide-react';
import { WorkspaceShortcutSummary } from '../../workspace-engine/WorkspaceShortcutSummary';
import { WorkspaceWidgetHost } from '../../workspace-engine/WorkspaceWidgetHost';
import { WorkspaceDefinition, WorkspaceViewport } from '../../workspace-engine/types';
import {
  getWorkspaceVisualSurface,
  normalizeWorkspaceRect,
  placeWidgetAsShortcut,
  placeWidgetInSidebar,
  removeWidgetFromVisualSurface,
  setWorkspaceVisualSurface,
  WorkspaceShortcutSize,
  WorkspaceVisualSurface,
} from '../../workspace-engine/visualPresentation';

interface WorkspaceVisualCanvasEditorProps {
  definition: WorkspaceDefinition;
  viewport: WorkspaceViewport;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

const sizeLabels: Record<WorkspaceShortcutSize, string> = {
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
};

const viewportRatios: Record<WorkspaceViewport, number> = {
  desktop: 16 / 9,
  tablet: 4 / 3,
  mobile: 9 / 16,
  kds: 16 / 9,
};

export const WorkspaceVisualCanvasEditor: React.FC<WorkspaceVisualCanvasEditorProps> = ({ definition, viewport, onChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openWidgetId, setOpenWidgetId] = useState<string | null>(null);
  const [backgroundDraft, setBackgroundDraft] = useState('');
  const surface = getWorkspaceVisualSurface(definition.visualPresentation, viewport);
  const activeWidgets = useMemo(() => definition.widgets.filter(widget => widget.enabled !== false), [definition.widgets]);
  const placedIds = useMemo(() => new Set([
    ...surface.sidebar.widgetIds,
    ...surface.shortcuts.map(shortcut => shortcut.widgetId),
  ]), [surface]);
  const availableWidgets = activeWidgets.filter(widget => !placedIds.has(widget.id));
  const openWidget = definition.widgets.find(widget => widget.id === openWidgetId) || null;

  const persistSurface = (next: WorkspaceVisualSurface) => {
    onChange({ visualPresentation: setWorkspaceVisualSurface(definition.visualPresentation, next) });
  };

  const updateShortcut = (shortcutId: string, patch: Partial<WorkspaceVisualSurface['shortcuts'][number]>) => {
    persistSurface({
      ...surface,
      shortcuts: surface.shortcuts.map(shortcut => shortcut.id === shortcutId ? { ...shortcut, ...patch } : shortcut),
    });
  };

  const beginMove = (event: React.PointerEvent<HTMLDivElement>, shortcutId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(shortcutId);
    const canvas = canvasRef.current;
    const shortcut = surface.shortcuts.find(item => item.id === shortcutId);
    if (!canvas || !shortcut) return;
    const bounds = canvas.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = shortcut.rect;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / bounds.width * 100;
      const dy = (moveEvent.clientY - startY) / bounds.height * 100;
      updateShortcut(shortcutId, { rect: normalizeWorkspaceRect({ ...startRect, x: startRect.x + dx, y: startRect.y + dy }) });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, shortcutId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(shortcutId);
    const canvas = canvasRef.current;
    const shortcut = surface.shortcuts.find(item => item.id === shortcutId);
    if (!canvas || !shortcut) return;
    const bounds = canvas.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = shortcut.rect;

    const onMove = (moveEvent: PointerEvent) => {
      const dw = (moveEvent.clientX - startX) / bounds.width * 100;
      const dh = (moveEvent.clientY - startY) / bounds.height * 100;
      updateShortcut(shortcutId, {
        rect: normalizeWorkspaceRect({
          ...startRect,
          width: Math.max(8, startRect.width + dw),
          height: Math.max(8, startRect.height + dh),
        }),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  };

  const applyBackground = () => {
    const value = backgroundDraft.trim();
    persistSurface({
      ...surface,
      template: value ? {
        id: `template-${viewport}`,
        label: `Template ${viewport}`,
        backgroundAsset: value,
        aspectRatio: viewportRatios[viewport],
      } : undefined,
    });
  };

  return <div className="space-y-3" data-workspace-visual-canvas-editor={viewport}>
    <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
      <label className="text-[10px] font-bold text-stone-600">
        <span className="mb-1 flex items-center gap-1.5"><Image className="h-3.5 w-3.5" /> Imagem de fundo do template</span>
        <input
          value={backgroundDraft}
          onChange={event => setBackgroundDraft(event.target.value)}
          placeholder={surface.template?.backgroundAsset || 'URL ou asset estático'}
          className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs outline-none focus:border-amber-400"
        />
      </label>
      <button type="button" onClick={applyBackground} className="h-10 rounded-xl border border-stone-200 bg-white px-4 text-xs font-black text-stone-700 hover:border-amber-300 hover:bg-amber-50">Aplicar fundo</button>
    </div>

    <div className="grid gap-3 xl:grid-cols-[240px_1fr]">
      <aside className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-amber-600" /><strong className="text-xs text-stone-900">Componentes disponíveis</strong></div>
        <p className="mt-1 text-[9px] leading-relaxed text-stone-500">Cada widget pode existir no canvas ou no menu lateral deste dispositivo, nunca nos dois ao mesmo tempo.</p>
        <div className="mt-3 space-y-2">
          {availableWidgets.length === 0 && <div className="rounded-xl border border-dashed border-stone-200 bg-white p-3 text-[10px] text-stone-400">Todos os widgets ativos já estão posicionados.</div>}
          {availableWidgets.map(widget => <div key={widget.id} className="rounded-xl border border-stone-200 bg-white p-2.5">
            <div className="truncate text-[10px] font-black text-stone-800">{widget.title || widget.type}</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" onClick={() => persistSurface(placeWidgetAsShortcut(surface, widget))} className="rounded-lg bg-stone-950 px-2 py-2 text-[9px] font-black text-white">No canvas</button>
              <button type="button" onClick={() => persistSurface(placeWidgetInSidebar(surface, widget.id))} className="rounded-lg border border-stone-200 px-2 py-2 text-[9px] font-black text-stone-700">No menu</button>
            </div>
          </div>)}
        </div>
      </aside>

      <div>
        <div
          ref={canvasRef}
          className="relative w-full overflow-hidden rounded-2xl border border-stone-300 bg-stone-100 shadow-inner"
          style={{ aspectRatio: String(surface.template?.aspectRatio || viewportRatios[viewport]) }}
          data-workspace-visual-surface={viewport}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(120,113,108,0.16)_1px,transparent_0)] bg-[size:18px_18px]" />
          {surface.template?.backgroundAsset && <img src={surface.template.backgroundAsset} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" />}
          <div className="absolute inset-0 bg-white/10" />

          {surface.sidebar.enabled && <div
            className="absolute z-10 overflow-hidden rounded-r-2xl border border-stone-900/15 bg-stone-950/90 p-2 text-white shadow-xl backdrop-blur"
            style={{ left: `${surface.sidebar.rect.x}%`, top: `${surface.sidebar.rect.y}%`, width: `${surface.sidebar.rect.width}%`, height: `${surface.sidebar.rect.height}%` }}
            data-workspace-visual-sidebar
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 text-[9px] font-black uppercase tracking-wider"><PanelLeft className="h-3.5 w-3.5" /> Menu</div>
            <div className="mt-2 space-y-1.5">
              {surface.sidebar.widgetIds.map(widgetId => {
                const widget = definition.widgets.find(item => item.id === widgetId);
                if (!widget) return null;
                return <div key={widgetId} className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
                  <button type="button" onClick={() => setOpenWidgetId(widgetId)} className="min-w-0 flex-1 truncate rounded-md px-1 py-1.5 text-left text-[9px] font-bold hover:bg-white/10" aria-haspopup="dialog">{widget.title || widget.type}</button>
                  <button type="button" onClick={() => persistSurface(removeWidgetFromVisualSurface(surface, widgetId))} title="Remover do menu" className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/55 hover:bg-rose-500/20 hover:text-rose-200" aria-label={`Remover ${widget.title || widget.type} do menu`}><Trash2 className="h-3 w-3" /></button>
                </div>;
              })}
              {surface.sidebar.widgetIds.length === 0 && <div className="rounded-lg border border-dashed border-white/20 p-2 text-[8px] text-white/50">Menu vazio</div>}
            </div>
          </div>}

          {surface.shortcuts.map(shortcut => {
            const widget = definition.widgets.find(item => item.id === shortcut.widgetId);
            if (!widget) return null;
            const selected = selectedId === shortcut.id;
            return <div
              key={shortcut.id}
              onPointerDown={event => beginMove(event, shortcut.id)}
              onClick={() => setSelectedId(shortcut.id)}
              className={`group absolute z-20 cursor-move overflow-hidden rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur transition ${selected ? 'border-amber-500 ring-2 ring-amber-300/50' : 'border-white/70 hover:border-amber-300'}`}
              style={{ left: `${shortcut.rect.x}%`, top: `${shortcut.rect.y}%`, width: `${shortcut.rect.width}%`, height: `${shortcut.rect.height}%` }}
              data-workspace-visual-shortcut={shortcut.widgetId}
              data-workspace-shortcut-size={shortcut.size}
            >
              <div className="pr-6">
                <WorkspaceShortcutSummary widget={widget} size={shortcut.size} />
              </div>
              <button type="button" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); persistSurface(removeWidgetFromVisualSurface(surface, shortcut.widgetId)); }} className={`absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} aria-label="Remover atalho"><Trash2 className="h-3.5 w-3.5" /></button>
              {selected && <div className="absolute bottom-2 left-2 flex gap-1" onPointerDown={event => event.stopPropagation()}>
                {(['s', 'm', 'l', 'xl'] as WorkspaceShortcutSize[]).map(size => <button key={size} type="button" onClick={() => updateShortcut(shortcut.id, { size })} className={`h-6 min-w-6 rounded-md px-1 text-[8px] font-black ${shortcut.size === size ? 'bg-stone-950 text-white' : 'border border-stone-200 bg-white text-stone-600'}`}>{sizeLabels[size]}</button>)}
                <button type="button" onClick={() => setOpenWidgetId(shortcut.widgetId)} className="inline-flex h-6 items-center gap-1 rounded-md bg-amber-400 px-2 text-[8px] font-black text-stone-950" aria-haspopup="dialog"><ExternalLink className="h-3 w-3" />Abrir widget</button>
                <button type="button" onClick={() => persistSurface(placeWidgetInSidebar(surface, shortcut.widgetId))} className="h-6 rounded-md border border-stone-200 bg-white px-2 text-[8px] font-black text-stone-600">Mover ao menu</button>
              </div>}
              <button type="button" onPointerDown={event => beginResize(event, shortcut.id)} className={`absolute bottom-1.5 right-1.5 h-5 w-5 cursor-se-resize rounded-md border border-stone-200 bg-white text-[9px] text-stone-500 shadow-sm ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} aria-label="Redimensionar atalho">↘</button>
            </div>;
          })}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-stone-400">Os atalhos usam dados vivos quando existe um adaptador de apresentação. Selecione um atalho e use “Abrir widget” — ou clique em uma entrada do menu — para testar o widget completo existente no host genérico.</p>
      </div>
    </div>

    <WorkspaceWidgetHost
      workspace={definition}
      widget={openWidget}
      open={Boolean(openWidget)}
      onClose={() => setOpenWidgetId(null)}
      mode={viewport === 'mobile' ? 'fullscreen' : 'modal'}
    />
  </div>;
};