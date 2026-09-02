import React, { useMemo } from 'react';
import type { AdminTab, UserRole } from '../../types';
import { SAAS_FIXED_MENU, menuSectionForTab, roleCanSeeMenuItem } from '../../navigation/saasFixedMenu';

interface SaaSFixedMenuProps {
  activeTab: string;
  role: UserRole;
  hasTabAccess: (role: UserRole, tab: AdminTab) => boolean;
  onNavigate: (tab: AdminTab, path: string) => void;
}

export const SaaSFixedMenu: React.FC<SaaSFixedMenuProps> = ({ activeTab, role, hasTabAccess, onNavigate }) => {
  const activeSection = menuSectionForTab(activeTab) ?? SAAS_FIXED_MENU[0];

  const visibleSections = useMemo(() => SAAS_FIXED_MENU.map(section => ({
    ...section,
    items: section.items.filter(item => roleCanSeeMenuItem(role, item) && hasTabAccess(role, item.adminTab)),
  })).filter(section => section.items.length > 0), [role, hasTabAccess]);

  const currentVisibleSection = visibleSections.find(section => section.id === activeSection.id) ?? visibleSections[0];

  if (!currentVisibleSection) return null;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs mb-6 space-y-2">
      <nav className="flex items-center gap-1.5 overflow-x-auto min-w-0" aria-label="Áreas do sistema">
        {visibleSections.map(section => {
          const selected = section.id === currentVisibleSection.id;
          const firstItem = section.items[0];
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onNavigate(firstItem.adminTab, firstItem.path)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${selected ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
            >
              {section.label}
            </button>
          );
        })}
      </nav>

      {currentVisibleSection.items.length > 1 && (
        <div className="border-t border-stone-100 pt-2 flex items-center gap-1.5 overflow-x-auto" aria-label={`Opções de ${currentVisibleSection.label}`}>
          {currentVisibleSection.items.map(item => {
            const selected = item.adminTab === activeTab || (item.adminTab === 'settings' && activeTab === 'design');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.adminTab, item.path)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${selected ? 'bg-stone-100 text-stone-950' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
