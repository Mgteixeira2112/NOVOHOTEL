import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import { WorkspaceDefinition } from '../../workspace-engine/types';

interface WorkspaceGeneralPresentationControlsProps {
  definition: WorkspaceDefinition;
  onChange: (patch: Partial<WorkspaceDefinition>) => void;
}

/**
 * Transitional shell kept only so the Factory can retire the historical
 * presentation form without a large editor rewrite in the same cut.
 *
 * Device modes, header toggles and KDS styling are no longer editable here.
 * The visual canvas is the single presentation editor for Desktop, Tablet,
 * Mobile and KDS.
 */
export const WorkspaceGeneralPresentationControls: React.FC<WorkspaceGeneralPresentationControlsProps> = ({ definition }) => (
  <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5" data-workspace-general-presentation-retired>
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-stone-950"><LayoutTemplate className="h-4 w-4" /></div>
      <div>
        <h3 className="text-sm font-black text-stone-900">Apresentação centralizada no editor visual</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-stone-600">Os controles antigos de modo por dispositivo, cabeçalho e ajustes manuais de KDS foram retirados da Fábrica. Edite a composição de {definition.name} em “Editar / visualizar Workspace”, usando somente Desktop, Tablet, Celular e KDS.</p>
      </div>
    </div>
  </div>
);
