import React from 'react';
import { SettingsModule } from '../../components/admin/SettingsModule';

/**
 * Presentation adapter for the existing administrative settings module.
 * Configuration logic and data mutations remain owned by SettingsModule/useHotel.
 */
export const SettingsAdminWidget: React.FC = () => (
  <div data-workspace-settings-admin-adapter>
    <SettingsModule />
  </div>
);
