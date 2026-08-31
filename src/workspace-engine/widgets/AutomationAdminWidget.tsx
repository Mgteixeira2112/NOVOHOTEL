import React from 'react';
import { AutomationModule } from '../../components/admin/AutomationModule';

/**
 * Presentation adapter for the existing administrative automation module.
 * Business rules, data access and mutations remain owned by AutomationModule/useHotel.
 */
export const AutomationAdminWidget: React.FC = () => (
  <div data-workspace-automation-admin-adapter>
    <AutomationModule />
  </div>
);
