import React, { useEffect, useMemo, useState } from 'react';
import type { AdminTab, UserRole } from '../../types';
import { useSaaSTenant } from '../../context/SaaSTenantContext';
import { SAAS_FIXED_MENU, menuSectionForTab, roleCanSeeMenuItem, type SaaSMenuItem } from '../../navigation/saasFixedMenu';
import { findSaaSRoute } from '../../routes/saasRouteCatalog';
import { permissionPolicyForRoute } from '../../routes/saasRoutePermissions';

interface SaaSFixedMenuProps {
  activeTab: string;
  role: UserRole;
  hasTabAccess: (role: UserRole, tab: AdminTab) => boolean;
  onNavigate: (tab: AdminTab, path: string) => void;
}

const backendPermissionForItem = (item: SaaSMenuItem): string | undefined => {
  const route = findSaaSRoute(item.path);
  return route ? permissionPolicyForRoute(route.id).backendPermission : undefined;
};

export const SaaSFixedMenu: React.FC<SaaSFixedMenuProps> = ({ activeTab, role, hasTabAccess, onNavigate }) => {
  const { available: tenantAvailable, loading: tenantLoading, checkPermissions } = useSaaSTenant();
  const [backendPermissions, setBackendPermissions] = useState<Record<string, boolean>>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const activeSection = menuSectionForTab(activeTab) ?? SAAS_FIXED_MENU[0];

  const requiredBackendPermissions = useMemo(() => [...new Set(
    SAAS_FIXED_MENU
      .flatMap(section => section.items)
      .map(backendPermissionForItem)
      .filter((permission): permission is string => Boolean(permission)),
  )], []);

  useEffect(() => {
    let cancelled = false;
    if (!tenantAvailable) {
      setBackendPermissions({});
      setPermissionsLoading(false);
      return () => { cancelled = true; };
    }

    setPermissionsLoading(true);
    void checkPermissions(requiredBackendPermissions)
      .then(result => {
        if (!cancelled) setBackendPermissions(result);
      })
      .finally(() => {
        if (!cancelled) setPermissionsLoading(false);
      });

    return () => { cancelled = true; };
  }, [tenantAvailable, checkPermissions, requiredBackendPermissions]);

  const backendAllowsItem = (item: SaaSMenuItem): boolean => {
    const permission = backendPermissionForItem(item);
    if (!permission) return true;
    if (tenantLoading) return false;
    if (!tenantAvailable) return true;
    if (permissionsLoading) return false;
    return backendPermissions[permission] === true;
  };

  const visibleSections = useMemo(() => SAAS_FIXED_MENU.map(section => ({
    ...section,
    items: section.items.filter(item =>
      roleCanSeeMenuItem(role, item)
      && hasTabAccess(role, item.adminTab)
      && backendAllowsItem(item)
    ),
  })).filter(section => section.items.length > 0), [role, hasTabAccess, tenantAvailable, tenantLoading, permissionsLoading, backendPermissions]);

  const currentVisibleSection = visibleSections.find(section => section.id === activeSection.id) ?? visibleSections[0];

  if (!currentVisibleSection) return null;

  return (
    <nav className="space-y-1" aria-label="Áreas do sistema">
      {visibleSections.map(section => {
        const selected = section.id === currentVisibleSection.id;
        const firstItem = section.items[0];
        return (
          <div key={section.id} className="space-y-1">
            <button
              type="button"
              onClick={() => onNavigate(firstItem.adminTab, firstItem.path)}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${selected ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
            >
              {section.label}
            </button>

            {selected && section.items.length > 1 && (
              <div className="ml-3 space-y-1 border-l border-stone-200 pl-2" aria-label={`Opções de ${section.label}`}>
                {section.items.map(item => {
                  const itemSelected = item.adminTab === activeTab || (item.adminTab === 'settings' && activeTab === 'design');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.adminTab, item.path)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${itemSelected ? 'bg-stone-100 text-stone-950' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
