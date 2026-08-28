import React from 'react';
import { GovernancaWorkspace } from '../modules/governanca/GovernancaWorkspace';
import { GenericOperationalWorkspace } from './GenericOperationalWorkspace';
import { WorkspaceDefinition } from './types';

export type WorkspaceAdapterComponent = React.FC<{ definition: WorkspaceDefinition }>;

const adapters: Record<string, WorkspaceAdapterComponent> = {
  'workspace-governanca': GovernancaWorkspace,
};

export const getWorkspaceAdapter = (workspaceId: string) => adapters[workspaceId] || GenericOperationalWorkspace;
