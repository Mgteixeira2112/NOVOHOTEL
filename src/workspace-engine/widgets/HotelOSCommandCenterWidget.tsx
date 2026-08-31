import React from 'react';
import { HotelOSCommandCenter } from '../../components/admin/HotelOSCommandCenter';

/**
 * Presentation adapter for the existing Hotel OS administrative command center.
 * Operational behavior and data ownership remain inside HotelOSCommandCenter and its existing services.
 */
export const HotelOSCommandCenterWidget: React.FC = () => (
  <div data-workspace-hotel-os-command-center-adapter>
    <HotelOSCommandCenter />
  </div>
);
