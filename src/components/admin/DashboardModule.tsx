import React, { useState, useMemo } from 'react';
import { useHotel } from '../../context/HotelContext';
import { useFrigobar } from '../../context/FrigobarContext';
import { formatCurrency, formatDateBR } from '../../utils/formatters';
import { 
  Building, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Eye, 
  Key, 
  LogIn, 
  LogOut, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Wrench, 
  AlertCircle,
  ShoppingBag,
  RefreshCw,
  SlidersHorizontal,
  Search,
  Check,
  BedDouble,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  BatteryCharging,
  ChevronRight,
  Filter
} from 'lucide-react';
import { RoomStatus, Quarto, Reserva } from '../../types';
import { RoomControlModal } from './RoomControlModal';
import { getOperationalTodayStr } from '../../utils/dateHelper';
import { AdminPageHeader } from '../common/AdminPageHeader';
import { EmptyState } from '../common/UIStates';

type FilterStatus = 'todos' | 'disponivel' | 'ocupado' | 'limpeza' | 'vistoria' | 'manutencao';
type FilterFrigobar = 'todos' | 'ok' | 'precisa_repor';

export const DashboardModule: React.FC = () => {
  const { 
    rooms, 
    roomTypes,
    reservations, 
    guests, 
    payments, 
    setAdminActiveTab, 
    setRoomStatus, 
    updateRoom,
    updateReservationStatus,
    openBookingWithRoom,
    currentUser
  } = useHotel();

  const { 
    getRoomMinibarSummary, 
    quickRestockRoom, 
    reabastecerTodosQuartos,
    products
  } = useFrigobar();

  // Estado do Modal de Controle Integral do Quarto
  const [selectedRoomForControl, setSelectedRoomForControl] = useState<Quarto | null>(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);

  // Filtros do Mapa Operacional
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todos');
  const [frigobarFilter, setFrigobarFilter] = useState<FilterFrigobar>('todos');
  const [andarFilter, setAndarFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Feedback de ações rápidas
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Data operacional do dia (America/Sao_Paulo)
  const todayStr = getOperationalTodayStr();

  // Métricas Operacionais
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'ocupado').length;
  const availableRooms = rooms.filter((r) => r.status === 'disponivel').length;
  const cleaningRooms = rooms.filter((r) => r.status === 'limpeza').length;
  const vistoriaRooms = rooms.filter((r) => r.status === 'vistoria').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'manutencao').length;
  const occupancyRate = Math.round((occupiedRooms / (totalRooms || 1)) * 100);

  // Métricas de Frigobar Integradas
  const minibarSummaries = useMemo(() => {
    return rooms.map((r) => ({
      room: r,
      summary: getRoomMinibarSummary(r.numero)
    }));
  }, [rooms, getRoomMinibarSummary]);

  const fullyStockedMinibars = minibarSummaries.filter((m) => m.summary.isFullyStocked).length;
  const minibarsNeedingRestock = minibarSummaries.filter((m) => m.summary.needsRestock).length;
  const totalMissingItemsInHotel = minibarSummaries.reduce((acc, m) => acc + m.summary.missingCount, 0);
  const minibarHealthRate = Math.round((fullyStockedMinibars / (totalRooms || 1)) * 100);

  // Check-ins e Check-outs do dia
  const checkinsToday = reservations.filter((r) => r.checkin === todayStr && r.status === 'confirmada');
  const checkoutsToday = reservations.filter((r) => r.checkout === todayStr && r.status === 'checkin_realizado');
  const activeInHouse = reservations.filter((r) => r.status === 'checkin_realizado');

  // Faturamento e receita
  const totalRevenue = payments
    .filter((p) => p.status === 'aprovado')
    .reduce((acc, p) => acc + p.valor, 0);

  // Lista de andares únicos
  const uniqueFloors = useMemo(() => {
    const floorList: number[] = Array.from(new Set(rooms.map((r) => Number(r.andar) || 1)));
    return floorList.sort((a: number, b: number) => a - b);
  }, [rooms]);

  // Filtragem dos quartos
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Filtro Status Operacional
      if (statusFilter !== 'todos' && room.status !== statusFilter) {
        return false;
      }

      // Filtro Frigobar
      if (frigobarFilter !== 'todos') {
        const summary = getRoomMinibarSummary(room.numero);
        if (frigobarFilter === 'ok' && !summary.isFullyStocked) return false;
        if (frigobarFilter === 'precisa_repor' && !summary.needsRestock) return false;
      }

      // Filtro Andar
      if (andarFilter !== 'todos' && room.andar.toString() !== andarFilter) {
        return false;
      }

      // Busca por texto (número ou hóspede)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const numMatch = room.numero.toLowerCase().includes(term);
        const nameMatch = room.nome.toLowerCase().includes(term);

        const activeRes = reservations.find((r) => r.quarto_id === room.id && r.status === 'checkin_realizado');
        const guest = activeRes ? guests.find((g) => g.id === activeRes.hospede_id) : null;
        const guestMatch = guest ? guest.nome.toLowerCase().includes(term) : false;

        return numMatch || nameMatch || guestMatch;
      }

      return true;
    });
  }, [rooms, statusFilter, frigobarFilter, andarFilter, searchTerm, reservations, guests, getRoomMinibarSummary]);

  // Abertura do Modal de Controle
  const handleOpenRoomControl = (room: Quarto) => {
    const idx = rooms.findIndex((r) => r.id === room.id);
    setSelectedRoomIndex(idx !== -1 ? idx : 0);
    setSelectedRoomForControl(room);
  };

  // Navegação entre quartos no modal
  const handleNavigateRoom = (direction: 'prev' | 'next') => {
    if (selectedRoomIndex === -1) return;
    let nextIdx = direction === 'next' ? selectedRoomIndex + 1 : selectedRoomIndex - 1;
    if (nextIdx >= 0 && nextIdx < rooms.length) {
      setSelectedRoomIndex(nextIdx);
      setSelectedRoomForControl(rooms[nextIdx]);
    }
  };

  // Reposição Rápida de 1 Quarto do Rack
  const handleQuickRestockRoom = (e: React.MouseEvent, roomNumero: string) => {
    e.stopPropagation();
    const res = quickRestockRoom(roomNumero, currentUser?.nome);
    setActionNotice(res.message);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Repor Todos os Frigobares do Hotel
  const handleRestockAllHotel = () => {
    const res = reabastecerTodosQuartos(currentUser?.nome);
    setActionNotice(`⚡ Todos os ${rooms.length} frigobares foram 100% abastecidos! (${res.totalReposto} itens repostos).`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Liberar Todos os Quartos Limpos para Disponíveis
  const handleReleaseAllClean = () => {
    let count = 0;
    rooms.forEach((r) => {
      if (r.status === 'limpeza' || r.status === 'vistoria' || r.status_governanca === 'limpo' || r.status_governanca === 'inspecionado') {
        if (r.status !== 'ocupado') {
          updateRoom(r.id, { status: 'disponivel', status_governanca: 'limpo' });
          count++;
        }
      }
    });
    setActionNotice(`🧹 ${count} quarto(s) inspecionados liberados para 'Disponível'.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* CABEÇALHO DO DASHBOARD & AÇÕES GERAIS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
              Painel Geral & Mapa Operacional
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              PMS Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Controle integrado de ocupação, governança, frigobares de quartos e fechaduras inteligentes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAdminActiveTab('frigobar')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Almoxarifado Frigobar</span>
            {minibarsNeedingRestock > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                {minibarsNeedingRestock}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminActiveTab('checkin_out')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Desk Recepção</span>
          </button>

          <button
            onClick={() => openBookingWithRoom()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva Balcão</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK DE AÇÃO RÁPIDA */}
      {actionNotice && (
        <div className="bg-stone-900 text-stone-100 px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-between border border-amber-500/40 shadow-lg animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" /> {actionNotice}
          </span>
          <button onClick={() => setActionNotice(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* GRADE DE INDICADORES CHAVE (KPIS) COM INTEGRAÇÃO DE FRIGOBAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Taxa de Ocupação */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Taxa de Ocupação
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-stone-900">{occupancyRate}%</span>
              <span className="text-[11px] text-stone-500">({occupiedRooms}/{totalRooms})</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" /> +12% vs. semana ant.
            </span>
          </div>
        </div>

        {/* Check-ins Previstos */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Check-ins Hoje
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-stone-900">{checkinsToday.length}</span>
              <span className="text-[11px] text-stone-500">chegadas</span>
            </div>
            <button
              onClick={() => setAdminActiveTab('checkin_out')}
              className="text-[10px] text-amber-700 hover:underline font-semibold mt-0.5 block"
            >
              Fila de recepção →
            </button>
          </div>
        </div>

        {/* Check-outs Previstos */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Check-outs Previstos
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-stone-900">{checkoutsToday.length}</span>
              <span className="text-[11px] text-stone-500">partidas</span>
            </div>
            <span className="text-[10px] text-stone-500 font-semibold mt-0.5 block">
              {activeInHouse.length} in-house
            </span>
          </div>
        </div>

        {/* KPI FRIGOBAR INTEGRADO */}
        <div className="bg-white p-4.5 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
              Frigobares Prontos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-stone-900">{minibarHealthRate}%</span>
              <span className="text-[11px] text-stone-500">({fullyStockedMinibars}/{totalRooms})</span>
            </div>
            {minibarsNeedingRestock > 0 ? (
              <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
                ⚠️ {minibarsNeedingRestock} quartos ({totalMissingItemsInHotel} un)
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
                ✓ 100% Abastecidos
              </span>
            )}
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Receita Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-stone-900">{formatCurrency(totalRevenue)}</span>
            </div>
            <button
              onClick={() => setAdminActiveTab('financial')}
              className="text-[10px] text-amber-700 hover:underline font-semibold mt-0.5 block"
            >
              Extrato financeiro →
            </button>
          </div>
        </div>

      </div>

      {/* MAPA OPERACIONAL DE ACOMODAÇÕES (ROOM RACK COM FRIGOBAR INTEGRADO) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* CABEÇALHO DO MAPA OPERACIONAL COM FILTROS AVANÇADOS */}
        <div className="space-y-4 pb-4 border-b border-stone-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                  Mapa Operacional de Acomodações & Frigobares (Room Rack)
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                  {filteredRooms.length} de {rooms.length} unidades
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Clique em qualquer quarto para abrir a <strong>Central de Controle Total</strong> (Status, Governança, Frigobar, PIN da Fechadura e Hóspede).
              </p>
            </div>

            {/* Ações em Lote */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRestockAllHotel}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition"
                title="Abastecer todos os quartos com 1 clique"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Repor Todos Frigobares</span>
              </button>

              <button
                onClick={handleReleaseAllClean}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition"
                title="Liberar todos os quartos limpos"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Liberar Quartos Limpos</span>
              </button>
            </div>
          </div>

          {/* BARRA DE FILTROS (STATUS + FRIGOBAR + ANDAR + BUSCA) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            
            {/* Filtros de Status Operacional */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'todos'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Todos ({totalRooms})
              </button>

              <button
                onClick={() => setStatusFilter('disponivel')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  statusFilter === 'disponivel'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Disponíveis ({availableRooms})
              </button>

              <button
                onClick={() => setStatusFilter('ocupado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  statusFilter === 'ocupado'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 border border-blue-200/80 hover:bg-blue-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Ocupados ({occupiedRooms})
              </button>

              <button
                onClick={() => setStatusFilter('limpeza')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  statusFilter === 'limpeza'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Limpeza ({cleaningRooms})
              </button>

              <button
                onClick={() => setStatusFilter('vistoria')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  statusFilter === 'vistoria'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100'
                }`}
              >
                <Sparkles className="w-3 h-3 text-teal-600" />
                Vistoriados ({vistoriaRooms})
              </button>

              <button
                onClick={() => setStatusFilter('manutencao')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  statusFilter === 'manutencao'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100'
                }`}
              >
                <Wrench className="w-3 h-3 text-rose-600" />
                Manutenção ({maintenanceRooms})
              </button>
            </div>

            {/* Filtros Secundários: Frigobar, Andar & Busca */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Filtro Frigobar */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setFrigobarFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    frigobarFilter === 'todos' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Frigobar: Todos
                </button>
                <button
                  onClick={() => setFrigobarFilter('ok')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    frigobarFilter === 'ok' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  ✓ 100% OK
                </button>
                <button
                  onClick={() => setFrigobarFilter('precisa_repor')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    frigobarFilter === 'precisa_repor' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  ⚠️ Repor ({minibarsNeedingRestock})
                </button>
              </div>

              {/* Filtro por Andar */}
              <select
                value={andarFilter}
                onChange={(e) => setAndarFilter(e.target.value)}
                className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-none"
              >
                <option value="todos">Todos Andares</option>
                {uniqueFloors.map((f) => (
                  <option key={f} value={f.toString()}>{f}º Andar</option>
                ))}
              </select>

              {/* Busca de Quarto/Hóspede */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nº ou Hóspede..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none w-32 sm:w-40"
                />
              </div>

            </div>

          </div>
        </div>

        {/* GRADE VISUAL DE CARDS DOS QUARTOS (ROOM RACK) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredRooms.map((room) => {
            const activeRes = reservations.find((r) => r.quarto_id === room.id && r.status === 'checkin_realizado');
            const guest = activeRes ? guests.find((g) => g.id === activeRes.hospede_id) : null;
            const minibar = getRoomMinibarSummary(room.numero);

            // Estilos visuais dinâmicos conforme status
            let cardBorder = 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/40';
            let statusPill = 'bg-emerald-600 text-white';
            let statusLabel = 'Disponível';

            if (room.status === 'ocupado') {
              cardBorder = 'border-blue-300 hover:border-blue-500 bg-blue-50/40';
              statusPill = 'bg-blue-600 text-white';
              statusLabel = 'Ocupado';
            } else if (room.status === 'limpeza') {
              cardBorder = 'border-amber-300 hover:border-amber-500 bg-amber-50/40';
              statusPill = 'bg-amber-600 text-white';
              statusLabel = 'Limpeza';
            } else if (room.status === 'vistoria') {
              cardBorder = 'border-teal-300 hover:border-teal-500 bg-teal-50/40';
              statusPill = 'bg-teal-600 text-white';
              statusLabel = 'Vistoriado';
            } else if (room.status === 'manutencao') {
              cardBorder = 'border-rose-300 hover:border-rose-500 bg-rose-50/40';
              statusPill = 'bg-rose-600 text-white';
              statusLabel = 'Manutenção';
            } else if (room.status === 'bloqueado') {
              cardBorder = 'border-stone-400 bg-stone-100';
              statusPill = 'bg-stone-700 text-white';
              statusLabel = 'Interditado';
            }

            return (
              <div
                key={room.id}
                onClick={() => handleOpenRoomControl(room)}
                className={`p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[160px] shadow-xs hover:shadow-md relative group ${cardBorder}`}
              >
                {/* TOPO DO CARD: NÚMERO, ANDAR E STATUS */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold font-mono text-stone-900 tracking-tight">
                          {room.numero}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">
                          {room.andar}º Andar
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-stone-600 truncate block max-w-[130px]">
                        {room.nome}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusPill}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* INFORMAÇÃO DE HÓSPEDE (SE OCUPADO) OU DIÁRIA */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200/70 text-xs">
                    {guest ? (
                      <div className="space-y-0.5">
                        <div className="truncate font-bold text-blue-950 flex items-center gap-1">
                          <span>👤</span>
                          <span className="truncate">{guest.nome}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 block">
                          Saída: {activeRes ? formatDateBR(activeRes.checkout) : 'Hoje'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-stone-500 text-[11px]">
                        <span>{formatCurrency(room.valor_diaria)}/d</span>
                        <span className="font-mono font-bold text-stone-700">🔑 {room.fechadura_pin || '1234'}#</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* STATUS DE FRIGOBAR INTEGRADO & BARRA DE PREENCHIMENTO */}
                <div className="mt-3 pt-2 border-t border-stone-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold flex items-center gap-1 text-stone-700">
                      <ShoppingBag className="w-3 h-3 text-blue-600" />
                      Frigobar:
                    </span>

                    {minibar.isFullyStocked ? (
                      <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                        ✓ 100% OK
                      </span>
                    ) : (
                      <span className="font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                        -{minibar.missingCount} reposição
                      </span>
                    )}
                  </div>

                  {/* Barra de Progresso de Abastecimento do Frigobar */}
                  <div className="w-full bg-stone-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        minibar.percentage === 100
                          ? 'bg-emerald-500'
                          : minibar.percentage > 50
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${minibar.percentage}%` }}
                    />
                  </div>
                </div>

                {/* BOTÃO DE AÇÃO RÁPIDA NO HOVER */}
                <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/90 backdrop-blur-xs text-white rounded-xl p-1.5 flex items-center justify-between shadow-lg text-[10px]">
                  <span className="font-bold pl-1 flex items-center gap-1 text-amber-400">
                    <SlidersHorizontal className="w-3 h-3" /> Abrir Controle
                  </span>

                  {minibar.needsRestock && (
                    <button
                      onClick={(e) => handleQuickRestockRoom(e, room.numero)}
                      className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1"
                      title="Repor Frigobar 100%"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Repor
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12 text-stone-400 space-y-2">
            <BedDouble className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs font-semibold">Nenhum quarto encontrado com os filtros selecionados.</p>
            <button
              onClick={() => {
                setStatusFilter('todos');
                setFrigobarFilter('todos');
                setAndarFilter('todos');
                setSearchTerm('');
              }}
              className="text-xs text-amber-700 hover:underline font-bold"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}

      </div>

      {/* FILA OPERACIONAL DE HOJE & ÚLTIMAS RESERVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fila Operacional de Hoje */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
                Operações de Hoje ({formatDateBR(todayStr)})
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                {checkinsToday.length + checkoutsToday.length} chegadas/partidas
              </span>
            </div>
            <button
              onClick={() => setAdminActiveTab('checkin_out')}
              className="text-xs text-amber-700 hover:underline font-bold"
            >
              Desk de Recepção →
            </button>
          </div>

          <div className="space-y-2.5">
            {checkinsToday.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);
              const minibar = room ? getRoomMinibarSummary(room.numero) : null;

              return (
                <div key={res.id} className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 block">{guest?.nome}</span>
                        {minibar && !minibar.isFullyStocked && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-black">
                            ⚠️ Frigobar c/ {minibar.missingCount} pendências
                          </span>
                        )}
                      </div>
                      <span className="text-stone-500">
                        Quarto {room?.numero} ({room?.nome}) • {res.quantidade_hospedes} pessoas • PIN: {room?.fechadura_pin}#
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-mono font-bold text-stone-700">{res.codigo}</span>
                    <button
                      onClick={() => updateReservationStatus(res.id, 'checkin_realizado', { checkinTime: new Date().toISOString() })}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      Check-in
                    </button>
                  </div>
                </div>
              );
            })}

            {checkoutsToday.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);
              const minibar = room ? getRoomMinibarSummary(room.numero) : null;

              return (
                <div key={res.id} className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 block">{guest?.nome}</span>
                        {minibar && minibar.needsRestock && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-black">
                            Auditar Frigobar
                          </span>
                        )}
                      </div>
                      <span className="text-stone-500">
                        Quarto {room?.numero} • Total: {formatCurrency(res.valor_total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        updateReservationStatus(res.id, 'checkout_concluido', { checkoutTime: new Date().toISOString() });
                        if (room) setRoomStatus(room.id, 'limpeza');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      Concluir Check-out
                    </button>
                  </div>
                </div>
              );
            })}

            {checkinsToday.length === 0 && checkoutsToday.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-xs">
                Nenhum check-in ou check-out pendente para o dia de hoje.
              </div>
            )}
          </div>
        </div>

        {/* Últimas Reservas Registradas */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              Últimas Reservas Registradas
            </h3>
            <button
              onClick={() => setAdminActiveTab('reservations')}
              className="text-xs text-amber-700 hover:underline font-bold"
            >
              Ver todas ({reservations.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {[...reservations]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((res) => {
                const guest = guests.find((g) => g.id === res.hospede_id);
                const room = rooms.find((r) => r.id === res.quarto_id);

                return (
                  <div key={res.id} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-stone-900">{guest?.nome}</strong>
                        <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 text-[10px] font-mono">
                          {res.codigo}
                        </span>
                      </div>
                      <span className="text-stone-500 block mt-0.5">
                        {room?.nome} • {formatDateBR(res.checkin)} a {formatDateBR(res.checkout)}
                      </span>
                    </div>

                    <span className="font-bold font-mono text-stone-900">
                      {formatCurrency(res.valor_total)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

      </div>

      {/* MODAL / HUB DE CONTROLE INTEGRAL DO QUARTO */}
      {selectedRoomForControl && (
        <RoomControlModal
          room={selectedRoomForControl}
          isOpen={!!selectedRoomForControl}
          onClose={() => setSelectedRoomForControl(null)}
          onNavigateRoom={handleNavigateRoom}
          hasPrevRoom={selectedRoomIndex > 0}
          hasNextRoom={selectedRoomIndex < rooms.length - 1}
          onOpenAuditModal={(roomNum) => {
            setSelectedRoomForControl(null);
            setAdminActiveTab('frigobar');
          }}
        />
      )}

    </div>
  );
};
