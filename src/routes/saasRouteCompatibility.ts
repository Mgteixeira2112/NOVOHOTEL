import type { AdminTab } from '../types';
import { findSaaSRoute, type SaaSRouteId } from './saasRouteCatalog';

export type HotelRouteRenderMode = 'admin-screen' | 'legacy-workspace';

export interface HotelRouteCompatibilityPlan {
  routeId: SaaSRouteId;
  mode: HotelRouteRenderMode;
  adminTab?: AdminTab;
}

const HOTEL_ADMIN_TAB_BY_ROUTE: Partial<Record<SaaSRouteId, AdminTab>> = {
  'hotel-home': 'dashboard',
  'hotel-reception': 'checkin_out',
  'hotel-reservations': 'reservations',
  'hotel-rooms': 'rooms',
  'hotel-guests': 'guests',
  'hotel-operations': 'kanban',
  'hotel-housekeeping': 'kanban',
  'hotel-maintenance': 'kanban',
  'hotel-kanban': 'kanban',
  'hotel-pdv': 'pdv',
  'hotel-kds': 'kds',
  'hotel-inventory': 'frigobar',
  'hotel-finance': 'financial',
  'hotel-management': 'management_bi',
  'hotel-team': 'users',
  'hotel-command-center': 'command_center',
  'hotel-settings': 'settings',
  'hotel-automations': 'automation',
};

export function resolveHotelRouteCompatibility(path: string): HotelRouteCompatibilityPlan | undefined {
  const route = findSaaSRoute(path);
  if (!route || route.environment !== 'hotel') return undefined;

  const adminTab = HOTEL_ADMIN_TAB_BY_ROUTE[route.id];
  if (!adminTab) return undefined;

  return {
    routeId: route.id,
    mode: 'admin-screen',
    adminTab,
  };
}
