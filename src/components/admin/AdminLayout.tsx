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
import { 
  LayoutDashboard, 
  BarChart3, 
  BedDouble, 
  CalendarDays, 
  LogIn, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  Bot, 
  Palette, 
  UserCheck, 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  Columns3, 
  CreditCard, 
  ChefHat, 
  Sparkles,
  Layers,
  UtensilsCrossed,
  Briefcase,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { AdminTab } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

type NavContextId = 'operacao' | 'vendas' | 'gestao' | 'sistema';

interface NavItemConfig {
  id: AdminTab;
  context: NavContextId;
  label: string;
  shortLabel?: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
  description?: string;
}

export const AdminLayout: React.FC = () => {
  const { 
    hotelConfig, 
    adminActiveTab, 
    setAdminActiveTab, 
    reservations, 
    users, 
    currentUser, 
    hasTabAccess 
  } = useHotel();
  const { cards } = useKanban();
  
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const checkinsTodayCount = reservations.filter((r) => r.status === 'confirmada').length;
  const activeUsersCount = users.filter(u => u.ativo).length;
  const pendingKanbanCount = cards.filter(c => !c.completed_at).length;

  const navItems: NavItemConfig[] = useMemo(() => [
    // 1. Operação
    { id: 'dashboard', context: 'operacao', label: 'Dashboard Operacional', shortLabel: 'Dashboard', icon: LayoutDashboard, description: 'Visão geral do dia a dia e mapa de quartos' },
    { id: 'reservations', context: 'operacao', label: 'Mapa de Reservas', shortLabel: 'Reservas', icon: CalendarDays, description: 'Grade cronológica de ocupação' },
    { id: 'checkin_out', context: 'operacao', label: 'Check-in / Out', shortLabel: 'Front Desk', icon: LogIn, badge: checkinsTodayCount, description: 'Recepção e chegadas do dia' },
    { id: 'rooms', context: 'operacao', label: 'Quartos & Tarifas', shortLabel: 'Quartos', icon: BedDouble, description: 'Inventário e categorias de UH' },
    { id: 'guests', context: 'operacao', label: 'Hóspedes & CRM', shortLabel: 'Hóspedes', icon: Users, description: 'Fichas cadastrais e histórico' },
    { id: 'kanban', context: 'operacao', label: 'Kanban Operacional', shortLabel: 'Kanban', icon: Columns3, badge: pendingKanbanCount, description: 'Fluxo de tarefas e governança' },

    // 2. Vendas e Consumo
    { id: 'pdv', context: 'vendas', label: 'PDV & Caixa', shortLabel: 'PDV', icon: CreditCard, description: 'Ponto de venda e lançamentos' },
    { id: 'kds', context: 'vendas', label: 'KDS • Cozinha', shortLabel: 'KDS Cozinha', icon: ChefHat, description: 'Fila de pedidos e preparo' },
    { id: 'frigobar', context: 'vendas', label: 'Frigobar & Estoque', shortLabel: 'Frigobar', icon: ShoppingBag, description: 'Auditoria e reposição de itens' },

    // 3. Gestão
    { id: 'financial', context: 'gestao', label: 'Financeiro & Folio', shortLabel: 'Financeiro', icon: DollarSign, description: 'Caixa, contas e extratos' },
    { id: 'management_bi', context: 'gestao', label: 'BI & KPIs Gerenciais', shortLabel: 'BI Gerencial', icon: BarChart3, description: 'ADR, RevPAR, Ocupação e Metas' },
    { id: 'users', context: 'gestao', label: 'Equipe & Acessos', shortLabel: 'Equipe', icon: UserCheck, badge: activeUsersCount, description: 'Usuários e permissões RBAC' },

    // 4. Sistema & Auditoria
    { id: 'automation', context: 'sistema', label: 'Automações & Fechaduras', shortLabel: 'Automações', icon: Bot, description: 'Regras de eventos e IoT' },
    { id: 'settings', context: 'sistema', label: 'Configurações & Design', shortLabel: 'Configurações', icon: Palette, description: 'Políticas, tema e cadastro do hotel' },
    { id: 'command_center' as AdminTab, context: 'sistema', label: 'Central Hotel OS', shortLabel: 'Central OS', icon: Sparkles, description: 'Painel técnico de governança e barramento de eventos' },
  ], [checkinsTodayCount, activeUsersCount, pendingKanbanCount]);

  const contexts: { id: NavContextId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'operacao', label: 'Operação', icon: Layers },
    { id: 'vendas', label: 'Vendas & Consumo', icon: UtensilsCrossed },
    { id: 'gestao', label: 'Gestão & BI', icon: Briefcase },
    { id: 'sistema', label: 'Sistema & Auditoria', icon: Sliders },
  ];

  // Encontra o contexto da aba atualmente ativa
  const currentTab = navItems.find((item) => item.id === adminActiveTab || (item.id === 'settings' && adminActiveTab === 'design')) || navItems[0];
  const [activeContext, setActiveContext] = useState<NavContextId>(currentTab.context);

  // Sincroniza o contexto quando a tab ativa muda externamente
  React.useEffect(() => {
    if (currentTab && currentTab.context !== activeContext) {
      setActiveContext(currentTab.context);
    }
  }, [adminActiveTab]);

  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const isCommandCenter = adminActiveTab === ('command_center' as AdminTab);
  const isManagementBI = adminActiveTab === ('management_bi' as AdminTab);
  const hasPermission = isCommandCenter 
    ? (userRole === 'admin' || userRole === 'gerente') 
    : isManagementBI 
    ? ['admin','gerente','financeiro'].includes(userRole) 
    : hasTabAccess(userRole, adminActiveTab as AdminTab);

  const contextItems = navItems.filter((item) => item.context === activeContext);

  return (
    <div className={`min-h-screen bg-stone-100/90 flex flex-col text-stone-900 ${fontClass}`}>
      <AdminHeader />
      
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra de Navegação Contextual Unificada */}
        <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs mb-6 space-y-2">
          {/* 1. Seleção de Contexto Primário (Operação / Vendas / Gestão / Sistema) */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2 px-1 overflow-x-auto gap-1">
            <div className="flex items-center gap-1.5 min-w-max">
              {contexts.map((ctx) => {
                const Icon = ctx.icon;
                const isSelected = activeContext === ctx.id;
                const countActiveInCtx = navItems
                  .filter((n) => n.context === ctx.id)
                  .reduce((acc, curr) => acc + (curr.badge || 0), 0);

                return (
                  <button
                    key={ctx.id}
                    onClick={() => {
                      setActiveContext(ctx.id);
                      // Se nenhuma tab desse contexto estiver aberta, seleciona a primeira
                      const firstInContext = navItems.find((n) => n.context === ctx.id);
                      if (firstInContext && currentTab.context !== ctx.id) {
                        setAdminActiveTab(firstInContext.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-stone-400'}`} />
                    <span>{ctx.label}</span>
                    {countActiveInCtx > 0 && (
                      <span
                        className={`px-1.5 py-0.2 text-[9px] rounded-full font-black ${
                          isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {countActiveInCtx}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-stone-400 font-medium pr-2">
              <span>Módulo:</span>
              <strong className="text-stone-700">{currentTab.label}</strong>
            </div>
          </div>

          {/* 2. Sub-abas do Contexto Selecionado */}
          <div className="overflow-x-auto pt-0.5">
            <nav className="flex items-center gap-1.5 min-w-max">
              {contextItems.map((item) => {
                const Icon = item.icon;
                const isActive = adminActiveTab === item.id || (item.id === 'settings' && adminActiveTab === 'design');
                const isAllowed = item.id === ('command_center' as AdminTab)
                  ? (userRole === 'admin' || userRole === 'gerente')
                  : item.id === ('management_bi' as AdminTab)
                  ? ['admin', 'gerente', 'financeiro'].includes(userRole)
                  : hasTabAccess(userRole, item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => setAdminActiveTab(item.id)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer relative ${
                      isActive
                        ? `bg-stone-900 ${theme.textAccentClass} shadow-xs ring-1 ${theme.primaryBorder}`
                        : isAllowed
                        ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/80'
                        : 'text-stone-400 hover:text-stone-600 opacity-60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? theme.textAccentClass : isAllowed ? 'text-stone-400' : 'text-stone-300'
                      }`}
                    />
                    <span>{item.label}</span>
                    {!isAllowed && <Lock className="w-3 h-3 text-stone-400 ml-0.5" />}
                    {item.badge !== undefined && item.badge > 0 && isAllowed && (
                      <span
                        className={`px-2 py-0.2 text-[10px] rounded-full font-black ${
                          isActive ? `${theme.primary} text-stone-950` : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo Principal com Controle de Acesso Seguro */}
        <main className="transition-all duration-200">
          {!hasPermission ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-stone-900">Acesso Restrito ao Módulo</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Seu perfil de <strong>{userRole.toUpperCase()}</strong> não possui autorização para gerenciar a aba{' '}
                  <strong>{currentTab?.label}</strong>.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setAdminActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-xl ${theme.buttonClass} text-xs font-bold transition flex items-center gap-2 cursor-pointer`}
                >
                  <span>Retornar ao Dashboard Geral</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {adminActiveTab === 'dashboard' && <DashboardModule />}
              {adminActiveTab === ('management_bi' as AdminTab) && (
                <>
                  <ExecutiveDashboardModule />
                  <DashboardAlertsWidget />
                </>
              )}
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
