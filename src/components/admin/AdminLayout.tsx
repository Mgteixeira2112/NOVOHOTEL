import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { SaaSShell } from '../layout/SaaSShell';
import { SaaSFixedMenu } from '../navigation/SaaSFixedMenu';
import { DashboardModule } from './DashboardModule';
import { ExecutiveDashboardModule } from './ExecutiveDashboardModule';
import { DashboardAlertsWidget } from './DashboardAlertsWidget';
import { RoomsModule } from './RoomsModule';
import { ReservationsModule } from './ReservationsModule';
import { CheckInOutModule } from './CheckInOutModule';
import { GuestsModule } from './GuestsModule';
import { FrigobarModule } from './FrigobarModule';
import { FinancialModule } from './FinancialModule';
import { AutomationModule } from './AutomationModule';
import { SettingsModule } from './SettingsModule';
import { UsersOperationalAccessModule } from './UsersOperationalAccessModule';
import { KanbanWorkspaceModule } from './KanbanWorkspaceModule';
import { KanbanLocalAutomationBridge } from './KanbanLocalAutomationBridge';
import { WorkspaceEditorModule } from './WorkspaceEditorModule';
import { PDVPage } from './PDVPage';
import { KDSPage } from './KDSPage';
import { HotelOSCommandCenter } from './HotelOSCommandCenter';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { AdminTab } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

type ExtendedAdminTab = AdminTab | 'workspace_editor';

export const AdminLayout: React.FC = () => {
  const { hotelConfig, adminActiveTab, setAdminActiveTab, currentUser, hasTabAccess } = useHotel();
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);
  const activeTab = adminActiveTab as ExtendedAdminTab;
  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const managementOnly = activeTab === 'command_center' || activeTab === 'workspace_editor';
  const hasPermission = managementOnly
    ? (userRole === 'admin' || userRole === 'gerente')
    : activeTab === 'management_bi'
      ? ['admin', 'gerente', 'financeiro'].includes(userRole)
      : hasTabAccess(userRole, activeTab as AdminTab);

  const navigateTo = (tab: AdminTab, path: string) => {
    setAdminActiveTab(tab);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const returnToDashboard = () => navigateTo('dashboard', '/app');
  const renderNavigation = () => (
    <SaaSFixedMenu
      activeTab={activeTab}
      role={userRole}
      hasTabAccess={hasTabAccess}
      onNavigate={navigateTo}
    />
  );

  return (
    <>
      <KanbanLocalAutomationBridge />
      <SaaSShell renderNavigation={renderNavigation}>
        <div className={fontClass}>
          {!hasPermission ? (
            <div className="bg-white p-10 rounded-3xl border text-center max-w-xl mx-auto">
              <ShieldAlert className="w-8 h-8 mx-auto text-amber-600" />
              <h3 className="mt-3 font-bold">Acesso Restrito ao Módulo</h3>
              <button
                onClick={returnToDashboard}
                className={`mt-4 px-4 py-2 rounded-xl ${theme.buttonClass} text-xs font-bold inline-flex items-center gap-2`}
              >
                Retornar ao Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardModule />}
              {activeTab === 'management_bi' && <><ExecutiveDashboardModule /><DashboardAlertsWidget /></>}
              {activeTab === 'command_center' && <HotelOSCommandCenter />}
              {activeTab === 'workspace_editor' && <WorkspaceEditorModule />}
              {activeTab === 'kanban' && <KanbanWorkspaceModule />}
              {activeTab === 'reservations' && <ReservationsModule />}
              {activeTab === 'checkin_out' && <CheckInOutModule />}
              {activeTab === 'rooms' && <RoomsModule />}
              {activeTab === 'guests' && <GuestsModule />}
              {activeTab === 'financial' && <FinancialModule />}
              {activeTab === 'frigobar' && <FrigobarModule />}
              {activeTab === 'automation' && <AutomationModule />}
              {activeTab === 'users' && <UsersOperationalAccessModule />}
              {activeTab === 'pdv' && <PDVPage />}
              {activeTab === 'kds' && <KDSPage />}
              {(activeTab === 'settings' || activeTab === 'design') && <SettingsModule />}
            </>
          )}
        </div>
      </SaaSShell>
    </>
  );
};
