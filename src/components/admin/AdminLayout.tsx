import React, { useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { AdminHeader } from '../navigation/AdminHeader';
import { DashboardModule } from './DashboardModule';
import { ExecutiveDashboardModule } from './ExecutiveDashboardModule';
import { DashboardAlertsWidget } from './DashboardAlertsWidget';
import { RoomsModule } from './RoomsModule';
import { ReservationsModule } from './ReservationsModule';
import { CheckInOutModule } from './CheckInOutModule';
import { GuestsModule } from './GuestsModule';
import { FrigobarModule } from './FrigobarModule';
import { AutomationModule } from './AutomationModule';
import { SettingsModule } from './SettingsModule';
import { UsersOperationalAccessModule } from './UsersOperationalAccessModule';
import { KanbanWorkspaceModule } from './KanbanWorkspaceModule';
import { KanbanLocalAutomationBridge } from './KanbanLocalAutomationBridge';
import { WorkspaceEditorModule } from './WorkspaceEditorModule';
import { PDVPage } from './PDVPage';
import { KDSPage } from './KDSPage';
import { HotelOSCommandCenter } from './HotelOSCommandCenter';
import { WidgetDrivenWorkspace } from '../../workspace-engine/WidgetDrivenWorkspace';
import { getWorkspaceDefinition } from '../../workspace-engine/registry';
import { LayoutDashboard, BarChart3, BedDouble, CalendarDays, LogIn, Users, DollarSign, ShoppingBag, Bot, Palette, UserCheck, ShieldAlert, Lock, ArrowRight, Columns3, CreditCard, ChefHat, Sparkles, Layers, UtensilsCrossed, Briefcase, Sliders, LayoutTemplate } from 'lucide-react';
import { AdminTab } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

type NavContextId = 'operacao' | 'vendas' | 'gestao' | 'sistema';
type ExtendedAdminTab = AdminTab | 'workspace_editor';
interface NavItemConfig { id: ExtendedAdminTab; context: NavContextId; label: string; shortLabel?: string; icon: React.FC<{ className?: string }>; badge?: number; description?: string; }

export const AdminLayout: React.FC = () => {
  const { hotelConfig, adminActiveTab, setAdminActiveTab, reservations, users, currentUser, hasTabAccess } = useHotel();
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);
  const checkinsTodayCount = reservations.filter((r) => r.status === 'confirmada').length;
  const activeUsersCount = users.filter(u => u.ativo).length;
  const pendingKanbanCount = 0;
  const activeTab = adminActiveTab as ExtendedAdminTab;
  const financialWorkspace = useMemo(() => getWorkspaceDefinition('workspace-financeiro', hotelConfig?.id), [hotelConfig?.id]);

  const navItems: NavItemConfig[] = useMemo(() => [
    { id: 'dashboard', context: 'operacao', label: 'Dashboard Operacional', icon: LayoutDashboard },
    { id: 'reservations', context: 'operacao', label: 'Mapa de Reservas', icon: CalendarDays },
    { id: 'checkin_out', context: 'operacao', label: 'Check-in / Out', icon: LogIn, badge: checkinsTodayCount },
    { id: 'rooms', context: 'operacao', label: 'Quartos & Tarifas', icon: BedDouble },
    { id: 'guests', context: 'operacao', label: 'Hóspedes & CRM', icon: Users },
    { id: 'kanban', context: 'operacao', label: 'Kanban Operacional', icon: Columns3, badge: pendingKanbanCount },
    { id: 'pdv', context: 'vendas', label: 'PDV & Caixa', icon: CreditCard },
    { id: 'kds', context: 'vendas', label: 'KDS • Cozinha', icon: ChefHat },
    { id: 'frigobar', context: 'vendas', label: 'Frigobar & Estoque', icon: ShoppingBag },
    { id: 'financial', context: 'gestao', label: 'Financeiro & Folio', icon: DollarSign },
    { id: 'management_bi', context: 'gestao', label: 'BI & KPIs Gerenciais', icon: BarChart3 },
    { id: 'users', context: 'gestao', label: 'Equipe & Acessos', icon: UserCheck, badge: activeUsersCount },
    { id: 'automation', context: 'sistema', label: 'Automações & Fechaduras', icon: Bot },
    { id: 'settings', context: 'sistema', label: 'Configurações & Design', icon: Palette },
    { id: 'workspace_editor', context: 'sistema', label: 'Editor de Workspaces', icon: LayoutTemplate, description: 'Composição visual dos ambientes operacionais' },
    { id: 'command_center', context: 'sistema', label: 'Central Hotel OS', icon: Sparkles },
  ], [checkinsTodayCount, activeUsersCount]);

  const contexts: { id: NavContextId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'operacao', label: 'Operação', icon: Layers }, { id: 'vendas', label: 'Vendas & Consumo', icon: UtensilsCrossed }, { id: 'gestao', label: 'Gestão & BI', icon: Briefcase }, { id: 'sistema', label: 'Sistema & Auditoria', icon: Sliders },
  ];
  const currentTab = navItems.find(item => item.id === activeTab || (item.id === 'settings' && activeTab === 'design')) || navItems[0];
  const [activeContext, setActiveContext] = useState<NavContextId>(currentTab.context);
  React.useEffect(() => { if (currentTab.context !== activeContext) setActiveContext(currentTab.context); }, [activeTab]);
  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const managementOnly = activeTab === 'command_center' || activeTab === 'workspace_editor';
  const hasPermission = managementOnly ? (userRole === 'admin' || userRole === 'gerente') : activeTab === 'management_bi' ? ['admin','gerente','financeiro'].includes(userRole) : hasTabAccess(userRole, activeTab as AdminTab);
  const contextItems = navItems.filter(item => item.context === activeContext);
  const changeTab = (id: ExtendedAdminTab) => setAdminActiveTab(id as AdminTab);

  return <div className={`min-h-screen bg-stone-100/90 flex flex-col text-stone-900 ${fontClass}`}>
    <KanbanLocalAutomationBridge /><AdminHeader />
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs mb-6 space-y-2">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2 px-1 overflow-x-auto gap-1"><div className="flex items-center gap-1.5 min-w-max">{contexts.map(ctx => { const Icon = ctx.icon; const selected = activeContext === ctx.id; return <button key={ctx.id} onClick={() => { setActiveContext(ctx.id); const first = navItems.find(n => n.context === ctx.id); if (first && currentTab.context !== ctx.id) changeTab(first.id); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${selected ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'}`}><Icon className={`w-3.5 h-3.5 ${selected ? 'text-amber-400' : 'text-stone-400'}`} />{ctx.label}</button>; })}</div><div className="hidden lg:flex text-[11px] text-stone-400 pr-2">Módulo: <strong className="ml-1 text-stone-700">{currentTab.label}</strong></div></div>
        <div className="overflow-x-auto"><nav className="flex items-center gap-1.5 min-w-max">{contextItems.map(item => { const Icon = item.icon; const isActive = activeTab === item.id || (item.id === 'settings' && activeTab === 'design'); const allowed = item.id === 'workspace_editor' || item.id === 'command_center' ? ['admin','gerente'].includes(userRole) : item.id === 'management_bi' ? ['admin','gerente','financeiro'].includes(userRole) : hasTabAccess(userRole, item.id as AdminTab); return <button key={item.id} onClick={() => changeTab(item.id)} className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${isActive ? `bg-stone-900 ${theme.textAccentClass}` : allowed ? 'text-stone-600 hover:bg-stone-100' : 'text-stone-400 opacity-60'}`}><Icon className="w-4 h-4" />{item.label}{!allowed && <Lock className="w-3 h-3" />}</button>; })}</nav></div>
      </div>
      <main>{!hasPermission ? <div className="bg-white p-10 rounded-3xl border text-center max-w-xl mx-auto"><ShieldAlert className="w-8 h-8 mx-auto text-amber-600" /><h3 className="mt-3 font-bold">Acesso Restrito ao Módulo</h3><button onClick={() => changeTab('dashboard')} className={`mt-4 px-4 py-2 rounded-xl ${theme.buttonClass} text-xs font-bold inline-flex items-center gap-2`}>Retornar ao Dashboard <ArrowRight className="w-3.5 h-3.5" /></button></div> : <>{activeTab === 'dashboard' && <DashboardModule />}{activeTab === 'management_bi' && <><ExecutiveDashboardModule /><DashboardAlertsWidget /></>}{activeTab === 'command_center' && <HotelOSCommandCenter />}{activeTab === 'workspace_editor' && <WorkspaceEditorModule />}{activeTab === 'kanban' && <KanbanWorkspaceModule />}{activeTab === 'reservations' && <ReservationsModule />}{activeTab === 'checkin_out' && <CheckInOutModule />}{activeTab === 'rooms' && <RoomsModule />}{activeTab === 'guests' && <GuestsModule />}{activeTab === 'financial' && financialWorkspace && <WidgetDrivenWorkspace definition={financialWorkspace} />}{activeTab === 'frigobar' && <FrigobarModule />}{activeTab === 'automation' && <AutomationModule />}{activeTab === 'users' && <UsersOperationalAccessModule />}{activeTab === 'pdv' && <PDVPage />}{activeTab === 'kds' && <KDSPage />}{(activeTab === 'settings' || activeTab === 'design') && <SettingsModule />}</>}</main>
    </div>
  </div>;
};
