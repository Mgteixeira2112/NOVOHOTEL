import type { AdminTab, RBACMatrixConfig, UserRole } from '../../types';
import { PERMISSIONS, type PermissionKey } from './permissionKeys';

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: Object.values(PERMISSIONS),
  gerente: [
    PERMISSIONS.reservationsView,
    PERMISSIONS.reservationsCreate,
    PERMISSIONS.reservationsEdit,
    PERMISSIONS.reservationsCancel,
    PERMISSIONS.reservationsCheckin,
    PERMISSIONS.reservationsCheckout,
    PERMISSIONS.posView,
    PERMISSIONS.posCreateOrder,
    PERMISSIONS.posEditOrder,
    PERMISSIONS.posCancelItem,
    PERMISSIONS.posApplyDiscount,
    PERMISSIONS.posOpenCash,
    PERMISSIONS.posCloseCash,
    PERMISSIONS.posRefund,
    PERMISSIONS.housekeepingView,
    PERMISSIONS.housekeepingAssign,
    PERMISSIONS.housekeepingStart,
    PERMISSIONS.housekeepingComplete,
    PERMISSIONS.maintenanceView,
    PERMISSIONS.maintenanceCreate,
    PERMISSIONS.maintenanceAssign,
    PERMISSIONS.maintenanceComplete,
    PERMISSIONS.financeView,
    PERMISSIONS.financeCreatePayment,
    PERMISSIONS.financeRefund,
    PERMISSIONS.financeCloseCash,
    PERMISSIONS.tabletMenuView,
    PERMISSIONS.tabletOrderCreate,
    PERMISSIONS.tabletOrderView,
    PERMISSIONS.tabletServiceRequest,
  ],
  recepcionista: [
    PERMISSIONS.reservationsView,
    PERMISSIONS.reservationsCreate,
    PERMISSIONS.reservationsEdit,
    PERMISSIONS.reservationsCancel,
    PERMISSIONS.reservationsCheckin,
    PERMISSIONS.reservationsCheckout,
    PERMISSIONS.posView,
    PERMISSIONS.housekeepingView,
    PERMISSIONS.tabletMenuView,
    PERMISSIONS.tabletOrderCreate,
    PERMISSIONS.tabletOrderView,
    PERMISSIONS.tabletServiceRequest,
  ],
  governanca: [
    PERMISSIONS.housekeepingView,
    PERMISSIONS.housekeepingAssign,
    PERMISSIONS.housekeepingStart,
    PERMISSIONS.housekeepingComplete,
    PERMISSIONS.maintenanceView,
    PERMISSIONS.maintenanceCreate,
  ],
  financeiro: [
    PERMISSIONS.financeView,
    PERMISSIONS.financeCreatePayment,
    PERMISSIONS.financeRefund,
    PERMISSIONS.financeCloseCash,
    PERMISSIONS.reservationsView,
    PERMISSIONS.posView,
  ],
  pdv_only: [
    PERMISSIONS.posView,
    PERMISSIONS.posCreateOrder,
    PERMISSIONS.posEditOrder,
    PERMISSIONS.posCancelItem,
    PERMISSIONS.posApplyDiscount,
    PERMISSIONS.posOpenCash,
    PERMISSIONS.posCloseCash,
    PERMISSIONS.posRefund,
  ],
  cozinha_only: [
    PERMISSIONS.posView,
  ],
  tablet_quarto: [
    PERMISSIONS.tabletMenuView,
    PERMISSIONS.tabletOrderCreate,
    PERMISSIONS.tabletOrderView,
    PERMISSIONS.tabletServiceRequest,
  ],
};

const TAB_ROLE_ALLOWLIST: Record<AdminTab, UserRole[]> = {
  dashboard: ['admin', 'gerente', 'recepcionista', 'financeiro', 'governanca'],
  management_bi: ['admin', 'gerente', 'financeiro'],
  command_center: ['admin', 'gerente'],
  production_audit: ['admin', 'gerente'],
  kanban: ['admin', 'gerente', 'recepcionista', 'governanca'],
  reservations: ['admin', 'gerente', 'recepcionista', 'financeiro'],
  checkin_out: ['admin', 'gerente', 'recepcionista'],
  rooms: ['admin', 'gerente', 'recepcionista', 'governanca'],
  guests: ['admin', 'gerente', 'recepcionista', 'financeiro'],
  financial: ['admin', 'gerente', 'financeiro'],
  frigobar: ['admin', 'gerente', 'governanca', 'recepcionista'],
  automation: ['admin', 'gerente'],
  users: ['admin', 'gerente'],
  pdv: ['admin', 'gerente', 'recepcionista', 'pdv_only'],
  kds: ['admin', 'gerente', 'cozinha_only', 'pdv_only'],
  settings: ['admin', 'gerente'],
  design: ['admin', 'gerente'],
};

export function hasRolePermission(role: UserRole, permission: PermissionKey | string): boolean {
  if (role === 'admin') return true;
  const list = ROLE_DEFAULT_PERMISSIONS[role] || [];
  return list.includes(permission as PermissionKey);
}

export function canAccessTab(matrix: RBACMatrixConfig | undefined, role: UserRole, tab: AdminTab): boolean {
  if (role === 'admin') return true;

  if (matrix && matrix.resources) {
    const rule = matrix.resources.find((resource) => resource.adminTab === tab);
    if (rule && rule.permissions[role] !== undefined) {
      return Boolean(rule.permissions[role]?.granted);
    }
  }

  const allowedRoles = TAB_ROLE_ALLOWLIST[tab];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

export function canAccessResource(matrix: RBACMatrixConfig | undefined, role: UserRole, resourceId: string): boolean {
  if (role === 'admin') return true;
  if (!matrix || !matrix.resources) return false;
  const rule = matrix.resources.find((resource) => resource.id === resourceId);
  if (!rule) return false;
  return Boolean(rule.permissions[role]?.granted);
}

export function filterAllowedTabs(matrix: RBACMatrixConfig | undefined, role: UserRole, tabs: AdminTab[]): AdminTab[] {
  return tabs.filter((t) => canAccessTab(matrix, role, t));
}

export function guardTab(role: UserRole, tab: AdminTab, matrix?: RBACMatrixConfig): { allowed: boolean; reason?: string } {
  const allowed = canAccessTab(matrix, role, tab);
  if (!allowed) {
    return {
      allowed: false,
      reason: `Acesso negado: Perfil ${role} não possui permissão para acessar o módulo ${tab}.`,
    };
  }
  return { allowed: true };
}
