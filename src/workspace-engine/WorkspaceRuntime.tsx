import React from 'react';
import { WorkspaceDefinition } from './types';
import { GovernancaWorkspace } from '../modules/governanca/GovernancaWorkspace';

interface WorkspaceRuntimeProps {
  definition: WorkspaceDefinition;
}

/**
 * Runtime boundary for personalized workspaces.
 * Sector modules are adapters over stable domain engines; this layer never owns Kanban persistence.
 */
export const WorkspaceRuntime: React.FC<WorkspaceRuntimeProps> = ({ definition }) => {
  switch (definition.id) {
    case 'workspace-governanca':
      return <GovernancaWorkspace definition={definition} />;
    default:
      return (
        <div className="min-h-screen grid place-items-center bg-slate-100 p-6">
          <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-lg font-black text-slate-900">{definition.name}</h1>
            <p className="mt-2 text-sm text-slate-500">Workspace ainda não possui um adaptador visual registrado.</p>
          </div>
        </div>
      );
  }
};
