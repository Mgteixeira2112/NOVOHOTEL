import React, { useState } from 'react';
import { useKanban } from '../../context/KanbanContext';
import { useHotel } from '../../context/HotelContext';
import { 
  KanbanBoardView 
} from './kanban/KanbanBoardView';
import { 
  KanbanKdsMonitorView 
} from './kanban/KanbanKdsMonitorView';
import { 
  KanbanSlaMetricsView 
} from './kanban/KanbanSlaMetricsView';
import { 
  KanbanCardDetailModal 
} from './kanban/KanbanCardDetailModal';
import { 
  KanbanCreateCardModal 
} from './kanban/KanbanCreateCardModal';
import { 
  KanbanColumnEditorModal 
} from './kanban/KanbanColumnEditorModal';
import { 
  ConciergeBell, 
  Sparkles, 
  UtensilsCrossed, 
  Wrench, 
  Layers, 
  Plus, 
  Volume2, 
  VolumeX, 
  Tv, 
  BarChart3, 
  LayoutDashboard, 
  Zap, 
  Search, 
  Filter, 
  RotateCcw, 
  ShieldCheck,
  UserCheck,
  Building2,
  Flame,
  Clock,
  User,
  Settings2,
  Music,
  CheckCircle,
  X,
  RefreshCw,
  Database,
  ArrowRightLeft,
  DollarSign,
  Package,
  Boxes
} from 'lucide-react';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

export const KanbanModule: React.FC = () => {
  const { 
    boards, 
    visibleBoards,
    visibleCards,
    activeBoardId, 
    setActiveBoardId, 
    activeBoard, 
    cards, 
    soundEnabled, 
    setSoundEnabled, 
    viewMode, 
    setViewMode, 
    isAdmin,
    userDepartment,
    userScopeMode,
    setUserScopeMode,
    searchQuery, 
    setSearchQuery, 
    priorityFilter, 
    setPriorityFilter, 
    assigneeFilter, 
    setAssigneeFilter, 
    slaFilter, 
    setSlaFilter, 
    setIsCreateCardModalOpen, 
    setIsCreateColumnModalOpen, 
    liveEvent, 
    clearLiveEvent, 
    syncAllFromPMS,
    isSyncing,
    lastSyncTime,
    realtimeStatus,
    simulateIncomingEvent, 
    playTestSound,
    resetToDefaults 
  } = useKanban();

  const { hotelConfig, currentUser, users } = useHotel();
  const theme = getTheme(hotelConfig?.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig?.tipografia);

  const [isSimulateMenuOpen, setIsSimulateMenuOpen] = useState(false);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);

  // Mapeamento dos ícones departamentais
  const getDepartmentIcon = (iconName: string) => {
    switch (iconName) {
      case 'ConciergeBell':
        return ConciergeBell;
      case 'Sparkles':
        return Sparkles;
      case 'UtensilsCrossed':
        return UtensilsCrossed;
      case 'Wrench':
        return Wrench;
      case 'Package':
      case 'Boxes':
        return Package;
      case 'DollarSign':
        return DollarSign;
      default:
        return Layers;
    }
  };

  const userRole = currentUser?.tipo_usuario || 'recepcionista';
  const canManageStructure = userRole === 'admin' || userRole === 'gerente';

  // Contagem de cartões ativos por quadro (respeitando o escopo visível do usuário)
  const getActiveCardsCount = (boardId: string) => {
    const b = boards.find((x) => x.id === boardId);
    return visibleCards.filter((c) => {
      if (c.board_id !== boardId) return false;
      const col = b?.columns.find((cl) => cl.id === c.column_id);
      return !col?.is_final && !c.completed_at;
    }).length;
  };

  // Nome formatado do departamento do usuário
  const getDepartmentDisplayName = (dept: string) => {
    switch (dept) {
      case 'recepcao': return 'Recepção & Concierge';
      case 'governanca': return 'Governança & Limpeza';
      case 'cozinha': return 'Cozinha & Room Service';
      case 'manutencao': return 'Manutenção & Engenharia';
      case 'financeiro': return 'Financeiro';
      case 'almoxarifado': return 'Almoxarifado & Frigobar';
      default: return dept.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Notificação em Tempo Real (Live Event Banner) */}
      {liveEvent && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-slideDown shadow-lg ${
          liveEvent.type === 'urgent'
            ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-300'
            : liveEvent.type === 'personal'
            ? `bg-indigo-900 text-white border-indigo-700 ring-2 ring-indigo-300`
            : `bg-stone-900 ${theme.textAccentClass} border-stone-800 ring-1 ${theme.primaryBorder}`
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black animate-pulse flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm block text-white">
                  {liveEvent.message}
                </span>
                {liveEvent.designationLabel && (
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-black uppercase tracking-wider">
                    {liveEvent.designationLabel}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-300 opacity-90 block mt-0.5">
                Sincronizado às {liveEvent.timestamp} • Áudio diferenciado emitido
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={clearLiveEvent}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white transition cursor-pointer flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header: Título, Modos de Visualização & Ações Globais */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl sm:text-2xl font-black ${fontClass} text-stone-900 tracking-tight`}>
                Operação Kanban em Tempo Real
              </h1>
              
              {/* Badge de Perfil e Escopo */}
              {isAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center gap-1 border border-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Admin: Todos os Setores
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[10px] font-black flex items-center gap-1 border border-sky-300">
                  <Building2 className="w-3.5 h-3.5 text-sky-700" />
                  Setor: {getDepartmentDisplayName(userDepartment)}
                </span>
              )}

              {realtimeStatus === 'SUBSCRIBED' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200" title="Conexão Realtime ativa com Supabase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Realtime Ativo
                </span>
              ) : realtimeStatus === 'CONNECTING' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold flex items-center gap-1 border border-amber-200" title="Estabelecendo conexão Realtime">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Conectando...
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold flex items-center gap-1 border border-rose-200" title="Tentando reconectar ao Realtime">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Offline
                </span>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              {isAdmin 
                ? 'Painel administrativo geral: monitoramento simultâneo de todos os setores, pedidos e colaboradores.'
                : `Visualização restrita ao colaborador ${currentUser?.nome || 'Operacional'}: pedidos direcionados a você e ao seu departamento.`}
            </p>
          </div>

          {/* Botões de Ação Superior */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Seletor de Escopo de Tarefas */}
            <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 border border-stone-200 text-xs">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setUserScopeMode('all')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                    userScopeMode === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Exibir todas as tarefas de todos os setores e colaboradores"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Todos</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setUserScopeMode('my_department')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  userScopeMode === 'my_department'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Exibir chamados direcionados ao meu setor"
              >
                <Building2 className="w-3 h-3 text-blue-600" />
                <span>Meu Setor</span>
              </button>

              <button
                type="button"
                onClick={() => setUserScopeMode('my_cards')}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                  userScopeMode === 'my_cards'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Exibir apenas tarefas atribuídas diretamente a mim"
              >
                <UserCheck className="w-3 h-3 text-emerald-600" />
                <span>Minhas</span>
              </button>
            </div>

            {/* Seletor de Modo de Exibição com destaque do tema */}
            <div className="bg-stone-100 p-1 rounded-2xl flex items-center gap-1 border border-stone-200">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'board'
                    ? `bg-stone-900 ${theme.textAccentClass} shadow-xs`
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Quadros</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kds_monitor')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'kds_monitor'
                    ? `bg-stone-900 ${theme.textAccentClass} shadow-xs`
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Painel TV / KDS</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('metrics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'metrics'
                    ? `bg-stone-900 ${theme.textAccentClass} shadow-xs`
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Métricas SLA</span>
              </button>
            </div>

            {/* Botão de Central de Sons Diferenciados */}
            <button
              type="button"
              onClick={() => setIsSoundModalOpen(true)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? `${theme.bgSubtleClass} ${theme.primaryBorder} ${theme.primaryText}`
                  : 'bg-stone-100 border-stone-200 text-stone-400'
              }`}
              title="Testar e Gerenciar Sons Diferenciados"
            >
              <Music className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Sons por Designação</span>
            </button>

            {/* Botão de Sincronização 100% PMS */}
            <button
              type="button"
              onClick={() => syncAllFromPMS()}
              disabled={isSyncing}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                isSyncing
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
              title="Sincronizar todos os quartos, reservas, pedidos e pagamentos do PMS com os Quadros Kanban"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sincronizar PMS 100%</span>
              <span className="md:hidden">Sync PMS</span>
            </button>

            {/* Alternador de Áudio Rápido */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-stone-100 border-stone-200 text-stone-700'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
              title="Ligar/Desligar Áudio Geral"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Menu Suspenso: Simular Chamado em Tempo Real */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSimulateMenuOpen(!isSimulateMenuOpen)}
                className={`px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 ${theme.textAccentClass} font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer ring-1 ${theme.primaryBorder}`}
              >
                <Zap className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                <span>Simular Chamado</span>
              </button>

              {isSimulateMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-40 space-y-1 animate-fadeIn">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1 block">
                    Disparos em Tempo Real:
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      simulateIncomingEvent('room_service_order');
                      setIsSimulateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-800 text-xs font-bold flex flex-col transition cursor-pointer"
                  >
                    <span>🍽️ Filé Mignon Suíte 301</span>
                    <span className="text-[10px] text-stone-500 font-normal">App do Hóspede → Cozinha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      simulateIncomingEvent('reception_to_maintenance');
                      setIsSimulateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-800 text-xs font-bold flex flex-col transition cursor-pointer"
                  >
                    <span>⚡ Ar Condicionado Q. 302</span>
                    <span className="text-[10px] text-stone-500 font-normal">Recepção → Manutenção</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      simulateIncomingEvent('housekeeping_turnover');
                      setIsSimulateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-800 text-xs font-bold flex flex-col transition cursor-pointer"
                  >
                    <span>🧹 Check-out Quarto 204</span>
                    <span className="text-[10px] text-stone-500 font-normal">Recepção → Governança Limpeza</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      simulateIncomingEvent('guest_extra_pillow');
                      setIsSimulateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-800 text-xs font-bold flex flex-col transition cursor-pointer"
                  >
                    <span>🛏️ Enxoval Extra Chalé 01</span>
                    <span className="text-[10px] text-stone-500 font-normal">WhatsApp → Governança</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      simulateIncomingEvent('minibar_restock_needed');
                      setIsSimulateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-800 text-xs font-bold flex flex-col transition cursor-pointer"
                  >
                    <span>📦 Reposição Frigobar Q. 205</span>
                    <span className="text-[10px] text-stone-500 font-normal">Consumo Hóspede → Almoxarifado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      simulateIncomingEvent('almoxarifado_low_stock');
                      setIsSimulateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-stone-800 text-xs font-bold flex flex-col transition cursor-pointer"
                  >
                    <span>⚠️ Estoque Crítico Heineken</span>
                    <span className="text-[10px] text-stone-500 font-normal">Almoxarifado Central → Compras</span>
                  </button>
                </div>
              )}
            </div>

            {/* Botão Novo Chamado com Tema Dinâmico */}
            <button
              type="button"
              onClick={() => setIsCreateCardModalOpen(true)}
              className={`px-4 py-2 rounded-xl ${theme.buttonClass} text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer`}
            >
              <Plus className="w-4 h-4" />
              <span>Novo Chamado</span>
            </button>
          </div>

        </div>

        {/* Barra de Status da Sincronização 100% PMS */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 font-black text-stone-800">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Sincronização 100% PMS:
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Recepção
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Governança
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Cozinha
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Manutenção
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Financeiro
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>Última sincronização: <strong className="text-stone-700">{lastSyncTime}</strong></span>
          </div>
        </div>

        {/* Abas dos Quadros Departamentais Visíveis para o Perfil */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {visibleBoards.map((board) => {
              const Icon = getDepartmentIcon(board.icon_name);
              const isActive = activeBoardId === board.id;
              const cardCount = getActiveCardsCount(board.id);

              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => {
                    setActiveBoardId(board.id);
                    if (viewMode === 'metrics') setViewMode('board');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? `bg-stone-900 ${theme.textAccentClass} shadow-sm ring-1 ${theme.primaryBorder}`
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? theme.textAccentClass : 'text-stone-500'}`} />
                  <span>{board.title}</span>

                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? `${theme.primary} text-stone-950` : 'bg-stone-200 text-stone-700'
                  }`}>
                    {cardCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Botão de Ajuste de Colunas deste Quadro (Admin / Gerente) */}
          {canManageStructure && (
            <button
              type="button"
              onClick={() => setIsCreateColumnModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
              title="Personalizar Colunas deste Quadro"
            >
              <Settings2 className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Configurar Colunas</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      {viewMode === 'board' && (
        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Campo de Busca */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por quarto, hóspede ou chamado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 ${theme.ringClass}`}
            />
          </div>

          {/* Filtros em Linha */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
            
            {/* Filtro Prioridade */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="critica">🔥 Urgente / Crítico</option>
              <option value="atencao">⚠️ Atenção</option>
              <option value="normal">✅ Normal</option>
            </select>

            {/* Filtro SLA */}
            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="all">Todos os SLAs</option>
              <option value="overdue">🚨 SLA Estourado</option>
              <option value="warning">⏰ Perto do Limite</option>
              <option value="normal">⏱️ No Prazo</option>
            </select>

            {/* Filtro Responsável */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white"
            >
              <option value="all">Todos os Colaboradores</option>
              <option value="unassigned">Sem Responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>

            {/* Botão de Reset */}
            {(searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all' || slaFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPriorityFilter('all');
                  setAssigneeFilter('all');
                  setSlaFilter('all');
                }}
                className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold transition cursor-pointer"
                title="Limpar todos os filtros"
              >
                Limpar
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja restaurar os dados de demonstração do Kanban?')) {
                  resetToDefaults();
                }
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              title="Restaurar dados padrão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Renderização Condicional da View Selecionada */}
      {viewMode === 'board' && <KanbanBoardView board={activeBoard} />}
      {viewMode === 'kds_monitor' && <KanbanKdsMonitorView board={activeBoard} />}
      {viewMode === 'metrics' && <KanbanSlaMetricsView />}

      {/* Modal de Demonstração e Teste de Sons Diferenciados */}
      {isSoundModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl ${theme.bgSubtleClass} flex items-center justify-center`}>
                  <Music className={`w-5 h-5 ${theme.textAccentClass}`} />
                </div>
                <div>
                  <h3 className={`text-base font-black ${fontClass} text-stone-900`}>
                    Sons Diferenciados por Designação
                  </h3>
                  <p className="text-xs text-stone-500">
                    Testar os sintetizadores de áudio do sistema operacional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSoundModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              
              {/* Som 1: Pessoal */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-xs text-indigo-900 block flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    1. Tarefa Designada Diretamente a Você
                  </span>
                  <span className="text-[11px] text-indigo-700/80 block">
                    Arpejo ascendente de sino de cristal (F5-A5-C6-E6)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playTestSound('personal')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* Som 2: Setor */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-xs text-amber-900 block flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    2. Novo Pedido / Chamado do seu Setor
                  </span>
                  <span className="text-[11px] text-amber-700/80 block">
                    Sino clássico de balcão de hotelaria "Ding-Dong" (Sol 5 - Mi 5)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playTestSound('department')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* Som 3: Urgente */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-xs text-rose-900 block flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" />
                    3. Alerta Crítico / SLA Quase Estourando
                  </span>
                  <span className="text-[11px] text-rose-700/80 block">
                    Bip duplo agudo pulsante de alta prioridade
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playTestSound('urgent')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* Som 4: Delegação */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-xs text-stone-900 block flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-stone-600" />
                    4. Chamado Transferido de Outro Setor
                  </span>
                  <span className="text-[11px] text-stone-600 block">
                    Harmônico de passagem e transição interdepartamental
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playTestSound('delegation')}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>

              {/* Som 5: Conclusão */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-3">
                <div>
                  <span className="font-extrabold text-xs text-emerald-900 block flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    5. Tarefa Finalizada / Quarto Liberado
                  </span>
                  <span className="text-[11px] text-emerald-700/80 block">
                    Acorde maior de confirmação de sucesso
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => playTestSound('success')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>

            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSoundModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs cursor-pointer hover:bg-stone-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais Globais do Kanban */}
      <KanbanCardDetailModal />
      <KanbanCreateCardModal />
      <KanbanColumnEditorModal />

    </div>
  );
};

