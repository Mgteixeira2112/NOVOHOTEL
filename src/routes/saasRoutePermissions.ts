import { PERMISSIONS } from '../core/permissions/permissionKeys';
import type { SaaSRouteId } from './saasRouteCatalog';

export interface SaaSRoutePermissionPolicy {
  backendPermission?: string;
}

const ROUTE_PERMISSION_POLICIES: Partial<Record<SaaSRouteId, SaaSRoutePermissionPolicy>> = {
  'hotel-reception': { backendPermission: PERMISSIONS.reservationsView },
  'hotel-reservations': { backendPermission: PERMISSIONS.reservationsView },
  'hotel-rooms': { backendPermission: PERMISSIONS.roomsView },
  'hotel-guests': { backendPermission: PERMISSIONS.reservationsView },
  'hotel-pdv': { backendPermission: PERMISSIONS.posView },
  'hotel-kds': { backendPermission: PERMISSIONS.posView },
  'hotel-finance': { backendPermission: PERMISSIONS.financeView },
  'hotel-team': { backendPermission: PERMISSIONS.adminManage },
  'hotel-command-center': { backendPermission: PERMISSIONS.adminManage },
  'hotel-settings': { backendPermission: PERMISSIONS.adminManage },
  'hotel-automations': { backendPermission: PERMISSIONS.adminManage },
};

export const permissionPolicyForRoute = (routeId: SaaSRouteId): SaaSRoutePermissionPolicy =>
  ROUTE_PERMISSION_POLICIES[routeId] ?? {};
