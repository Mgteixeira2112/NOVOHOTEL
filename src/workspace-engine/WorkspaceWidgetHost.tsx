import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { WorkspaceDefinition, WorkspaceWidgetDefinition } from './types';
import { getWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';

export interface WorkspaceWidgetHostProps {
  workspace: WorkspaceDefinition;
  widget: WorkspaceWidgetDefinition | null;
  open: boolean;
  onClose: () => void;
  mode?: 'modal' | 'fullscreen';
}

/**
 * Presentation-only host for complete registered widgets.
 *
 * It never owns domain state, queries, mutations or permissions. The host
 * resolves the existing renderer from the canonical widget runtime registry
 * and only controls where that renderer is presented.
 */
export const WorkspaceWidgetHost: React.FC<WorkspaceWidgetHostProps> = ({
  workspace,
  widget,
  open,
  onClose,
  mode = 'modal',
}) => {
  useEffect(() => {
    if (!open || !widget || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, widget, onClose]);

  if (!open || !widget || typeof document === 'undefined') return null;

  const Renderer = getWorkspaceWidgetRenderer(widget.type);
  const fullscreen = mode === 'fullscreen';

  return createPortal(
    <div
      className={`fixed inset-0 z-[140] flex bg-slate-950/55 backdrop-blur-sm ${fullscreen ? 'items-stretch justify-stretch p-0' : 'items-center justify-center p-3 sm:p-6'}`}
      role="dialog"
      aria-modal="true"
      aria-label={widget.title || widget.type}
      data-workspace-widget-host
      data-workspace-widget-host-mode={mode}
      data-widget-id={widget.id}
      onMouseDown={event => {
        if (!fullscreen && event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`flex w-full flex-col overflow-hidden border border-slate-200 bg-slate-100 shadow-2xl ${fullscreen ? 'h-full rounded-none' : 'max-h-[calc(100dvh-1.5rem)] max-w-[1600px] rounded-3xl sm:max-h-[calc(100dvh-3rem)]'}`}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-700">Widget</p>
            <h2 className="truncate text-sm font-black text-slate-900">{widget.title || widget.type}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Fechar widget">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {Renderer
            ? <Renderer workspace={workspace} widget={widget} />
            : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-700">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Widget aguardando renderer</p>
                <h2 className="mt-1 text-sm font-black">{widget.title || widget.type}</h2>
              </div>}
        </div>
      </div>
    </div>,
    document.body,
  );
};
