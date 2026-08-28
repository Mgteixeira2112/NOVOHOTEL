import React from 'react';
import { GovernancaWorkspace } from '../modules/governanca/GovernancaWorkspace';
import { ReceptionWorkspaceShared } from '../modules/recepcao/ReceptionWorkspaceShared';
import { GenericOperationalWorkspace } from './GenericOperationalWorkspace';
import { WorkspaceDefinition } from './types';

export type WorkspaceAdapterComponent = React.FC<{ definition: WorkspaceDefinition }>;

const adapters: Record<string, WorkspaceAdapterComponent> = {
  'workspace-governanca': GovernancaWorkspace,
  'workspace-recepcao': ReceptionWorkspaceShared,
};

export const getWorkspaceAdapter = (workspaceId: string) => adapters[workspaceId] || GenericOperationalWorkspace;
