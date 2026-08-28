import React from 'react';
import { getWorkspaceAdapter } from './adapterRegistry';
import { WorkspaceDefinition } from './types';

interface WorkspaceRuntimeProps {
  definition: WorkspaceDefinition;
}

/** Runtime boundary for personalized workspaces. */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) => {
  const Adapter = getWorkspaceAdapter(definition.id);

  if (Adapter) return <Adapter definition={definition} />;

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-6">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-black text-slate-900">{definition.name}</h1>
        <p className="mt-2 text-sm text-slate-500">Workspace ainda não possui um adaptador visual registrado.</p>
      </div>
    </div>
  );
};
