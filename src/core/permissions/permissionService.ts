import type { AdminTab, RBACMatrixConfig, UserRole } from '../../types';

export function canAccessTab(matrix: RBACMatrixConfig, role: UserRole, tab: AdminTab): boolean {
  const rule = matrix.resources.find((resource) => resource.adminTab === tab);
  if (!rule) return false;
  return Boolean(rule.permissions[role]?.granted);
}

export function canAccessResource(matrix: RBACMatrixConfig, role: UserRole, resourceId: string): boolean {
  const rule = matrix.resources.find((resource) => resource.id === resourceId);
  if (!rule) return false;
  return Boolean(rule.permissions[role]?.granted);
}
