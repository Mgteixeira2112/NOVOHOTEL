import { useState, useCallback } from 'react';
import { 
  UserRole, 
  AdminTab, 
  RBACMatrixConfig, 
  RBACRolePermission, 
  RBACResourceRule, 
  Usuario 
} from '../types';
import { INITIAL_RBAC_MATRIX } from '../data/mockInitialData';

export function useHotelRBAC(
  currentUser: Usuario | null,
  initialMatrix: RBACMatrixConfig = INITIAL_RBAC_MATRIX,
  onMatrixChange?: (matrix: RBACMatrixConfig) => void
) {
  const [rbacMatrix, setRbacMatrix] = useState<RBACMatrixConfig>(initialMatrix);

  const hasTabAccess = useCallback((role: UserRole, tab: AdminTab): boolean => {
    if (role === 'admin') return true;

    // Buscar recurso mapeado com adminTab ou pelo id
    const rule = rbacMatrix.resources.find((r) => r.adminTab === tab || r.id === tab);
    if (rule && rule.permissions && rule.permissions[role]) {
      return rule.permissions[role].granted;
    }

    // Regras padrão de contingência
    if (tab === 'dashboard') return true;
    if (tab === 'settings' || tab === 'users') return role === 'gerente';
    if (tab === 'financial') return role === 'gerente' || role === 'financeiro';
    if (tab === 'rooms' || tab === 'checkin_out' || tab === 'frigobar') return true;
    if (tab === 'reservations' || tab === 'guests' || tab === 'automation') return role === 'gerente' || role === 'recepcionista';
    return false;
  }, [rbacMatrix]);

  const getRoleModulePermission = useCallback((role: UserRole, resourceId: string): RBACRolePermission | undefined => {
    const rule = rbacMatrix.resources.find((r) => r.id === resourceId);
    return rule?.permissions?.[role];
  }, [rbacMatrix]);

  const updateRBACPermission = useCallback((resourceId: string, role: UserRole, permissionData: Partial<RBACRolePermission>) => {
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome ? `${currentUser.nome} (${currentUser.cargo_titulo || currentUser.tipo_usuario})` : 'Administrador',
        resources: prev.resources.map((res) => {
          if (res.id !== resourceId) return res;
          const currentRolePerm = res.permissions[role] || { granted: true, level: 'total', customLabel: '✓ Total' };
          return {
            ...res,
            permissions: {
              ...res.permissions,
              [role]: {
                ...currentRolePerm,
                ...permissionData,
              },
            },
          };
        }),
      };
      if (onMatrixChange) onMatrixChange(updated);
      return updated;
    });
  }, [currentUser, onMatrixChange]);

  const updateRBACMatrix = useCallback((newMatrix: RBACMatrixConfig) => {
    setRbacMatrix(newMatrix);
    if (onMatrixChange) onMatrixChange(newMatrix);
  }, [onMatrixChange]);

  const addRBACResource = useCallback((resourceData: Omit<RBACResourceRule, 'id'>) => {
    const newId = 'custom-res-' + Date.now();
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: [
          ...prev.resources,
          {
            ...resourceData,
            id: newId,
            isCustom: true,
          },
        ],
      };
      if (onMatrixChange) onMatrixChange(updated);
      return updated;
    });
  }, [currentUser, onMatrixChange]);

  const editRBACResource = useCallback((resourceId: string, data: Partial<RBACResourceRule>) => {
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: prev.resources.map((r) => (r.id === resourceId ? { ...r, ...data } : r)),
      };
      if (onMatrixChange) onMatrixChange(updated);
      return updated;
    });
  }, [currentUser, onMatrixChange]);

  const deleteRBACResource = useCallback((resourceId: string) => {
    setRbacMatrix((prev) => {
      const updated: RBACMatrixConfig = {
        ...prev,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser?.nome || 'Administrador',
        resources: prev.resources.filter((r) => r.id !== resourceId),
      };
      if (onMatrixChange) onMatrixChange(updated);
      return updated;
    });
  }, [currentUser, onMatrixChange]);

  const resetRBACMatrix = useCallback(() => {
    setRbacMatrix(INITIAL_RBAC_MATRIX);
    if (onMatrixChange) onMatrixChange(INITIAL_RBAC_MATRIX);
  }, [onMatrixChange]);

  return {
    rbacMatrix,
    setRbacMatrix,
    hasTabAccess,
    getRoleModulePermission,
    updateRBACPermission,
    updateRBACMatrix,
    addRBACResource,
    editRBACResource,
    deleteRBACResource,
    resetRBACMatrix
  };
}
