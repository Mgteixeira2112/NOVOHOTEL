import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { AdminHeader } from '../navigation/AdminHeader';
import { DashboardModule } from './DashboardModule';
import { ExecutiveDashboardModule } from './ExecutiveDashboardModule';
import { RoomsModule } from './RoomsModule';
import { ReservationsModule } from './ReservationsModule';
import { CheckInOutModule } from './CheckInOutModule';
import { GuestsModule } from './GuestsModule';
import { FinancialModule } from './FinancialModule';
import { FrigobarModule } from './FrigobarModule';
import { AutomationModule } from './AutomationModule';
import { SettingsModule } from './SettingsModule';
import { UsersModule } from './UsersModule';
import { KanbanModule } from './KanbanModule';
import { PDVPage } from './PDVPage';
import { KDSPage } from './KDSPage';
import { HotelOSCommandCenter } from './HotelOSCommandCenter';
import { useKanban } from '../../context/KanbanContext';
import { LayoutDashboard, BarChart3, BedDouble, CalendarDays, LogIn, Users, DollarSign, ShoppingBag, Bot, Palette, UserCheck, ShieldAlert, Lock, ArrowRight, Columns3, CreditCard, ChefHat, Sparkles } from 'lucide-react';
import { AdminTab } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

export const AdminLayout: React.FC = () => {
  const { hotelConfig, adminActiveTab, setAdminActiveTab, reservations, users, currentUser, hasTabAccess } = useHotel();
  const { cards } = useKanban();
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);
  const checkinsTodayCount = reservations.filter((r) => r.status === 'confirmada').length;
  const activeUsersCount = users.filter(u => u.ativo).length;
  const pendingKanbanCount = cards.filter(c => !c.completed_at).length;

  const navItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'management_bi', label: 'BI Gerencial', icon: BarChart3 },
    { id: 'command_center' as AdminTab, label: 'Central Hotel OS', icon: Sparkles },
    { id: 'kanban', label: 'Operação Kanban', icon: Columns3, badge: pendingKanbanCount },
    { id: 'reservations', label: 'Mapa de Reservas', icon: CalendarDays },
    { id: 'checkin_out', label: 'Desk Check-in / Out', icon: LogIn, badge: checkinsTodayCount },
    { id: 'rooms', label: 'Quartos & Tarifas', icon: BedDouble },
    { id: 'guests', label: 'Hóspedes & CRM', icon: Users },
    { id: 'financial', label: 'Financeiro & PIX', icon: DollarSign },
    { id: 'frigobar', label: 'Frigobar & Estoque', icon: ShoppingBag },
    { id: 'automation', label: 'Automações & Fechaduras', icon: Bot },
    { id: 'users', label: 'Equipe & Acessos', icon: UserCheck, badge: activeUsersCount },
    { id: 'pdv', label: 'PDV & Caixa', icon: CreditCard },
    { id: 'kds', label: 'KDS • Cozinha', icon: ChefHat },
    { id: 'settings', label: 'Personalização & Configurações', icon: Palette },
  ];

  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const isCommandCenter = adminActiveTab === ('command_center' as AdminTab);
  const isManagementBI = adminActiveTab === ('management_bi' as AdminTab);
  const hasPermission = isCommandCenter ? (userRole === 'admin' || userRole === 'gerente') : isManagementBI ? ['admin','gerente','financeiro'].includes(userRole) : hasTabAccess(userRole, adminActiveTab as AdminTab);
  const currentTabConfig = navItems.find((item) => item.id === adminActiveTab);

  return (
    <div className={`min-h-screen bg-stone-100/90 flex flex-col text-stone-900 ${fontClass}`}>
      <AdminHeader />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-xs mb-6 overflow-x-auto">
          <nav className="flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminActiveTab === item.id || (item.id === 'settings' && adminActiveTab === 'design');
              const isAllowed = item.id === ('command_center' as AdminTab) ? (userRole === 'admin' || userRole === 'gerente') : item.id === ('management_bi' as AdminTab) ? ['admin','gerente','financeiro'].includes(userRole) : hasTabAccess(userRole, item.id);
              return (
                <button key={item.id} onClick={() => setAdminActiveTab(item.id)} className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer relative ${isActive ? `bg-stone-900 ${theme.textAccentClass} shadow-xs ring-1 ${theme.primaryBorder}` : isAllowed ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80' : 'text-stone-400 hover:text-stone-600 opacity-60'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? theme.textAccentClass : isAllowed ? 'text-stone-400' : 'text-stone-300'}`} />
                  <span>{item.label}</span>
                  {!isAllowed && <Lock className="w-3 h-3 text-stone-400 ml-0.5" />}
                  {item.badge !== undefined && item.badge > 0 && isAllowed && <span className={`px-2 py-0.2 text-[10px] rounded-full font-black ${isActive ? `${theme.primary} text-stone-950` : 'bg-stone-200 text-stone-700'}`}>{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>
        <main className="transition-all duration-200">
          {!hasPermission ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200"><ShieldAlert className="w-7 h-7" /></div>
              <div className="space-y-1"><h3 className="font-bold text-lg text-stone-900">Acesso Restrito ao Módulo</h3><p className="text-xs text-stone-500 leading-relaxed">Seu perfil de <strong>{userRole.toUpperCase()}</strong> não possui autorização para gerenciar a aba <strong>{currentTabConfig?.label}</strong>.</p></div>
              <div className="pt-2 flex items-center justify-center gap-3"><button onClick={() => setAdminActiveTab('dashboard')} className={`px-4 py-2 rounded-xl ${theme.buttonClass} text-xs font-bold transition flex items-center gap-2 cursor-pointer`}><span>Retornar ao Dashboard Geral</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
            </div>
          ) : (
            <>
              {adminActiveTab === 'dashboard' && <DashboardModule />}
              {adminActiveTab === ('management_bi' as AdminTab) && <ExecutiveDashboardModule />}
              {adminActiveTab === ('command_center' as AdminTab) && <HotelOSCommandCenter />}
              {adminActiveTab === 'kanban' && <KanbanModule />}
              {adminActiveTab === 'reservations' && <ReservationsModule />}
              {adminActiveTab === 'checkin_out' && <CheckInOutModule />}
              {adminActiveTab === 'rooms' && <RoomsModule />}
              {adminActiveTab === 'guests' && <GuestsModule />}
              {adminActiveTab === 'financial' && <FinancialModule />}
              {adminActiveTab === 'frigobar' && <FrigobarModule />}
              {adminActiveTab === 'automation' && <AutomationModule />}
              {adminActiveTab === 'users' && <UsersModule />}
              {adminActiveTab === 'pdv' && <PDVPage />}
              {adminActiveTab === 'kds' && <KDSPage />}
              {(adminActiveTab === 'settings' || adminActiveTab === 'design') && <SettingsModule />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};