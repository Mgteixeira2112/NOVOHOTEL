import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { 
  Building2, 
  Eye, 
  Bell, 
  Users, 
  ShieldCheck, 
  LogOut, 
  User, 
  Key, 
  ExternalLink,
  ChevronDown,
  Settings,
  Sparkles,
  Palette
} from 'lucide-react';
import { UserProfileModal } from '../admin/UserProfileModal';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Componente de cabeçalho superior do painel administrativo PMS com controle de sessão
export const AdminHeader: React.FC = () => {
  const { 
    hotelConfig, 
    setCurrentView, 
    currentUser, 
    users, 
    setCurrentUser,
    reservations,
    rooms,
    logout,
    setAdminActiveTab
  } = useHotel();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  };

  // Cálculo de check-ins ativos e taxa de ocupação para a data de referência
  const todayStr = '2026-08-21';
  const checkinsToday = reservations.filter((r) => r.checkin === todayStr && r.status === 'confirmada').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'ocupado').length;
  const totalRooms = rooms.length;
  const occupancyRate = Math.round((occupiedRooms / (totalRooms || 1)) * 100);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  const getRoleLabel = (tipo: string) => {
    switch (tipo) {
      case 'admin': return 'Administrador Geral';
      case 'gerente': return 'Gerência Operacional';
      case 'recepcionista': return 'Recepção / Front Desk';
      case 'governanca': return 'Governança & Limpeza';
      case 'financeiro': return 'Gestão Financeira';
      default: return tipo;
    }
  };

  return (
    <>
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Identidade visual e logo do hotel */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                {hotelConfig.logo_url ? (
                  <img
                    src={hotelConfig.logo_url}
                    alt={hotelConfig.nome}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover border border-stone-700"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-lg ${theme.badgeClass} flex items-center justify-center font-black shadow-sm border border-stone-700`}>
                    <span className={`${fontClass} text-xs tracking-tighter font-black`}>
                      {getInitials(hotelConfig.nome)}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block">
                  <span className={`${fontClass} text-sm font-bold ${theme.textAccentClass} block leading-none`}>
                    {hotelConfig.nome}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                    PMS • Portal Administrativo
                  </span>
                </div>
              </div>

              {/* Indicador de ocupação em tempo real */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ocupação: <strong className="text-white">{occupancyRate}%</strong> ({occupiedRooms}/{totalRooms})</span>
              </div>
            </div>

            {/* Ações rápidas e menu de sessão do usuário */}
            <div className="flex items-center gap-3">
              
              {/* Botão de alternância direta para o site público / Landing Page */}
              <button
                onClick={() => setCurrentView('landing')}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 border border-stone-700 transition cursor-pointer"
                title="Visualizar site como o cliente/hóspede vê"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver Site do Hotel</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>

              {/* Indicador de notificações de chegadas do dia */}
              <div 
                onClick={() => setAdminActiveTab('checkin_out')}
                className="relative p-2 text-stone-400 hover:text-white transition cursor-pointer"
                title={`${checkinsToday} check-ins previstos para hoje`}
              >
                <Bell className="w-4 h-4" />
                {checkinsToday > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-stone-900" />
                )}
              </div>

              {/* Perfil do Usuário Logado e Menu Suspenso */}
              <div className="relative pl-2 border-l border-stone-800">
                
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-stone-800 transition cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/50 bg-stone-800 flex-shrink-0">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={currentUser?.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="hidden sm:block">
                    <strong className="block text-xs text-stone-200 leading-tight">
                      {currentUser?.nome}
                    </strong>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      {currentUser?.cargo_titulo || getRoleLabel(currentUser?.tipo_usuario || 'admin')}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {/* Dropdown de opções do usuário logado */}
                {isMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in"
                    onMouseLeave={() => setIsMenuOpen(false)}
                  >
                    
                    {/* Cabeçalho do usuário */}
                    <div className="px-4 py-2 border-b border-stone-800 mb-1">
                      <strong className="block text-stone-100 font-bold truncate">{currentUser?.nome}</strong>
                      <span className="text-[11px] text-stone-400 truncate block">{currentUser?.email}</span>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                        {currentUser?.tipo_usuario}
                      </span>
                    </div>

                    {/* Links do Menu */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Meu Perfil & Senha</span>
                    </button>

                    {currentUser?.tipo_usuario === 'admin' && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setAdminActiveTab('users');
                        }}
                        className="w-full px-4 py-2 text-left text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>Gestão de Usuários & Permissões</span>
                      </button>
                    )}

                    {/* Alternador Rápido de Perfil para Demonstração */}
                    <div className="px-4 py-2 border-t border-stone-800 mt-1">
                      <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Trocar Usuário (Demo):
                      </span>
                      <select
                        value={currentUser?.id}
                        onChange={(e) => {
                          const u = users.find((usr) => usr.id === e.target.value);
                          if (u) {
                            setCurrentUser(u);
                            setIsMenuOpen(false);
                          }
                        }}
                        className="w-full p-1.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] text-stone-200 focus:outline-none cursor-pointer"
                      >
                        {users.filter(u => u.ativo).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome} ({u.tipo_usuario})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Botão de Sair / Logout */}
                    <div className="border-t border-stone-800 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition cursor-pointer font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair do Sistema (Logout)</span>
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Modal de Meu Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Modal de Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 text-stone-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-stone-100">Encerrar Sessão?</h3>
              <p className="text-xs text-stone-400 mt-1">
                Você precisará informar seu e-mail e senha corporativa novamente para acessar o painel administrativo.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                Permanecer Logado
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-900/50 cursor-pointer"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
