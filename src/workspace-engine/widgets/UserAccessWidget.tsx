import React from 'react';
import { UsersOperationalAccessModule } from '../../components/admin/UsersOperationalAccessModule';
import { WorkspaceWidgetRenderer } from '../widgetRuntimeRegistry';

/**
 * Presentation adapter only: the existing administrative module remains the
 * single owner of user, RBAC and operational-sector behavior/persistence.
 */
export const UserAccessWidget: WorkspaceWidgetRenderer = () => (
  <div data-workspace-user-access-adapter>
    <UsersOperationalAccessModule />
  </div>
);
