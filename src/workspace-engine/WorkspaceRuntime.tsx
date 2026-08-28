import React from 'react';
import { getWorkspaceAdapter } from './adapterRegistry';
import { WorkspaceDefinition } from './types';
import { WidgetDrivenWorkspace } from './WidgetDrivenWorkspace';
import { registerBuiltinWorkspaceWidgets } from './registerBuiltinWidgets';
import { hasWorkspaceWidgetRenderer } from './widgetRuntimeRegistry';

interface WorkspaceRuntimeProps { definition: WorkspaceDefinition; }

registerBuiltinWorkspaceWidgets();

const isFullyWidgetDriven = (definition: WorkspaceDefinition) => definition.sectors.includes('recepcao') && definition.widgets
  .filter(widget => widget.enabled !== false)
  .every(widget => hasWorkspaceWidgetRenderer(widget.type));

/** Runtime boundary for personalized workspaces. */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) => {
  if (isFullyWidgetDriven(definition)) return <WidgetDrivenWorkspace definition={definition} />;
  const Adapter = getWorkspaceAdapter(definition.id);
  if (Adapter) return <Adapter definition={definition} />;
  return <div className="min-h-screen grid place-items-center bg-slate-100 p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm"><h1 className="text-lg font-black text-slate-900">{definition.name}</h1><p className="mt-2 text-sm text-slate-500">Workspace ainda não possui todos os widgets funcionais registrados.</p></div></div>;
};
