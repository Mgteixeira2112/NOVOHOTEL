import React from 'react';
import { MousePointer2 } from 'lucide-react';
import {
  WorkspaceDevicePresentationMode,
  WorkspaceWidgetDefinition,
  WorkspaceWidgetSpan,
} from '../../workspace-engine/types';

interface WorkspaceWidgetPresentationControlsProps {
  widget: WorkspaceWidgetDefinition;
  defaultSpan?: WorkspaceWidgetSpan;
  desktopMode: WorkspaceDevicePresentationMode;
  mobileMode: WorkspaceDevicePresentationMode;
  kdsMode: WorkspaceDevicePresentationMode;
  onChange: (patch: Partial<WorkspaceWidgetDefinition>) => void;
}

/**
 * Legacy compatibility shell. Manual width/height/visual/header/device
 * presentation controls no longer mutate Workspace definitions.
 * Presentation belongs to the visual canvas and its S/M/L/XL shortcuts.
 */
export const WorkspaceWidgetPresentationControls: React.FC<WorkspaceWidgetPresentationControlsProps> = ({ widget }) => (
  <div className="border-t border-stone-100 pt-4" data-widget-presentation-controls-retired>
    <div className="flex items-start gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3">
      <MousePointer2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-[10px] leading-relaxed text-stone-600"><strong className="font-black text-stone-800">Apresentação pelo canvas.</strong> Posição, tamanho e densidade de “{widget.title || widget.type}” são configurados no editor visual. Os controles manuais antigos de largura, altura, estilo, cabeçalho e overrides por dispositivo não são mais editáveis aqui.</p>
    </div>
  </div>
);
