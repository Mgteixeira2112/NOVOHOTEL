import React from 'react';
import { useHotel } from '../../context/HotelContext';
import { AdminHeader } from '../navigation/AdminHeader';
import { DashboardModule } from './DashboardModule';
import { RoomsModule } from './RoomsModule';
import { ReservationsModule } from './ReservationsModule';
import { CheckInOutModule } from './CheckInOutModule';
import { GuestsModule } from './GuestsModule';
import { FinancialModule } from './FinancialModule';
import { FrigobarModule } from './FrigobarModule';
import { AutomationModule } from './AutomationModule';
import { WhiteLabelCustomizerModule } from './WhiteLabelCustomizerModule';
import { SettingsModule } from './SettingsModule';
import { UsersModule } from './UsersModule';
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarDays, 
  LogIn, 
  Users, 
  DollarSign, 
  ShoppingBag,
  Bot, 
  Palette,
  Settings, 
  UserCheck,
  ShieldAlert,
  Lock,
  ArrowRight
} from 'lucide-react';
import { AdminTab, UserRole } from '../../types';

// Layout principal do painel administrativo (PMS) com menu de navegação em abas e controle de permissões (RBAC)
export const AdminLayout: React.FC = () => {
  const { 
    adminActiveTab, 
    setAdminActiveTab, 
    setCurrentView, 
    reservations, 
    rooms, 
    users, 
    currentUser 
  } = useHotel();

  // Contagem de check-ins pendentes e hóspedes ativos no hotel
  const checkinsTodayCount = reservations.filter((r) => r.status === 'confirmada').length;
  const activeUsersCount = users.filter(u => u.ativo).length;

  // Itens do menu de navegação do painel com badges e restrições por perfil
  const navItems: { 
    id: AdminTab; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: number;
    allowedRoles?: UserRole[];
  }[] = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'reservations', label: 'Mapa de Reservas', icon: CalendarDays },
    { id: 'checkin_out', label: 'Desk Check-in / Out', icon: LogIn, badge: checkinsTodayCount },
    { id: 'rooms', label: 'Quartos & Tarifas', icon: BedDouble },
    { id: 'guests', label: 'Hóspedes & CRM', icon: Users },
    { id: 'financial', label: 'Financeiro & PIX', icon: DollarSign, allowedRoles: ['admin', 'gerente', 'financeiro'] },
    { id: 'frigobar', label: 'Frigobar & Estoque', icon: ShoppingBag, allowedRoles: ['admin', 'gerente', 'governanca', 'recepcionista', 'financeiro'] },
    { id: 'automation', label: 'Automações & Fechaduras', icon: Bot, allowedRoles: ['admin', 'gerente', 'recepcionista'] },
    { id: 'design', label: 'Personalizar Site (White-Label)', icon: Palette, allowedRoles: ['admin', 'gerente'] },
    { id: 'users', label: 'Equipe & Acessos', icon: UserCheck, badge: activeUsersCount, allowedRoles: ['admin', 'gerente'] },
    { id: 'settings', label: 'Configurações', icon: Settings, allowedRoles: ['admin', 'gerente'] },
  ];

  // Verificação de Permissão do Usuário Atual para a aba ativa
  const currentTabConfig = navItems.find((item) => item.id === adminActiveTab);
  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const hasPermission = !currentTabConfig?.allowedRoles || currentTabConfig.allowedRoles.includes(userRole);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans">
      
      {/* Cabeçalho superior do administrador com controle de sessão */}
      <AdminHeader />

      {/* Conteúdo principal do painel */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Barra de abas de navegação */}
        <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm mb-6 overflow-x-auto">
          <nav className="flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = adminActiveTab === item.id;
              const isAllowed = !item.allowedRoles || item.allowedRoles.includes(userRole);

              return (
                <button
                  key={item.id}
                  onClick={() => setAdminActiveTab(item.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-amber-300 shadow-sm'
                      : isAllowed
                      ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                      : 'text-stone-400 hover:text-stone-600 opacity-60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : isAllowed ? 'text-stone-400' : 'text-stone-300'}`} />
                  <span>{item.label}</span>

                  {!isAllowed && (
                    <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
                  )}

                  {item.badge !== undefined && item.badge > 0 && isAllowed && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      isActive ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exibição dinâmica do módulo selecionado ou aviso de permissão restrita */}
        <main className="transition-all duration-200">
          {!hasPermission ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                  Módulo Restrito para o seu Perfil
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  O seu perfil de acesso atual (<strong className="capitalize text-stone-800">{userRole}</strong>) não possui permissão para visualizar ou gerenciar a área de <strong className="text-stone-800">{currentTabConfig?.label}</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 text-left space-y-1">
                <span className="font-bold text-stone-800 block">Perfis com acesso permitido:</span>
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {currentTabConfig?.allowedRoles?.map((r) => (
                    <span key={r} className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 uppercase font-bold text-[10px]">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setAdminActiveTab('dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 mx-auto transition cursor-pointer"
                >
                  <span>Voltar para o Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {adminActiveTab === 'dashboard' && <DashboardModule />}
              {adminActiveTab === 'reservations' && <ReservationsModule />}
              {adminActiveTab === 'checkin_out' && <CheckInOutModule />}
              {adminActiveTab === 'rooms' && <RoomsModule />}
              {adminActiveTab === 'guests' && <GuestsModule />}
              {adminActiveTab === 'financial' && <FinancialModule />}
              {adminActiveTab === 'frigobar' && <FrigobarModule />}
              {adminActiveTab === 'automation' && <AutomationModule />}
              {adminActiveTab === 'design' && <WhiteLabelCustomizerModule />}
              {adminActiveTab === 'users' && <UsersModule />}
              {adminActiveTab === 'settings' && <SettingsModule />}
            </>
          )}
        </main>

      </div>

      {/* Barra inferior do painel */}
      <footer className="bg-white border-t border-stone-200 py-3 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{currentUser ? `Conectado como ${currentUser.nome} (${currentUser.tipo_usuario})` : 'Itajubá Flat PMS'} • Sistema de Gestão Hoteleira com RBAC</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="text-amber-700 font-bold hover:underline cursor-pointer"
            >
              Ir para o Site Público do Hotel →
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
