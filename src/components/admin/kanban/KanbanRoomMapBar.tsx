import React, { useState, useMemo } from 'react';
import { useHotel } from '../../../context/HotelContext';
import { useKanban } from '../../../context/KanbanContext';
import { useFrigobar } from '../../../context/FrigobarContext';
import { Quarto, RoomStatus, Reserva } from '../../../types';
import { RoomControlModal } from '../RoomControlModal';
import { 
  BedDouble, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Sparkles, 
  Wrench, 
  Lock, 
  Key, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Maximize2,
  Calendar,
  ShoppingBag,
  Battery,
  Star
} from 'lucide-react';
import { getTheme } from '../../../utils/themeHelper';

export const KanbanRoomMapBar: React.FC = () => {
  const { 
    rooms, 
    reservations, 
    guests, 
    hotelConfig 
  } = useHotel();

  const { cards } = useKanban();
  const { getRoomMinibarSummary } = useFrigobar();

  const theme = getTheme(hotelConfig?.tema_cor);

  // Estados locais
  const [isExpanded, setIsExpanded] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedFloor, setSelectedFloor] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompactMode, setIsCompactMode] = useState(true);

  // Estado do modal de controle total do quarto
  const [selectedRoom, setSelectedRoom] = useState<Quarto | null>(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);

  // Mapeamento de reservas ativas por quarto_id
  const activeReservationMap = useMemo(() => {
    const map = new Map<string, { reserva: Reserva; guestName: string; isVip: boolean }>();
    reservations.forEach((res) => {
      if (res.status === 'checkin_realizado' || res.status === 'confirmada') {
        const gst = guests.find((g) => g.id === res.hospede_id);
        map.set(res.quarto_id, {
          reserva: res,
          guestName: gst?.nome || 'Hóspede',
          isVip: Boolean(gst?.vip)
        });
      }
    });
    return map;
  }, [reservations, guests]);

  // Contagem de cartões Kanban ativos por quarto
  const cardCountByRoom = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      if (card.room_number) {
        counts.set(card.room_number, (counts.get(card.room_number) || 0) + 1);
      } else {
        const match = card.location.match(/\b(\d{1,4})\b/);
        if (match) {
          const num = match[1];
          counts.set(num, (counts.get(num) || 0) + 1);
        }
      }
    });
    return counts;
  }, [cards]);

  // Contadores de status
  const counts = useMemo(() => {
    const total = rooms.length;
    const ocupados = rooms.filter((r) => r.status === 'ocupado').length;
    const disponiveis = rooms.filter((r) => r.status === 'disponivel').length;
    const limpeza = rooms.filter((r) => r.status === 'limpeza' || r.status === 'vistoria').length;
    const manutencao = rooms.filter((r) => r.status === 'manutencao' || r.status === 'bloqueado').length;
    return { total, ocupados, disponiveis, limpeza, manutencao };
  }, [rooms]);

  // Andares únicos
  const floors = useMemo(() => {
    const setF = new Set<number>();
    rooms.forEach((r) => {
      if (r.andar !== undefined) setF.add(Number(r.andar));
    });
    return Array.from(setF).sort((a, b) => a - b);
  }, [rooms]);

  // Quartos filtrados
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Filtro de status
      if (statusFilter !== 'todos') {
        if (statusFilter === 'ocupado' && room.status !== 'ocupado') return false;
        if (statusFilter === 'disponivel' && room.status !== 'disponivel') return false;
        if (statusFilter === 'limpeza' && room.status !== 'limpeza' && room.status !== 'vistoria') return false;
        if (statusFilter === 'manutencao' && room.status !== 'manutencao' && room.status !== 'bloqueado') return false;
      }

      // Filtro de andar
      if (selectedFloor !== 'todos' && room.andar?.toString() !== selectedFloor) {
        return false;
      }

      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = room.numero.toLowerCase().includes(q);
        const matchName = room.nome.toLowerCase().includes(q);
        const activeRes = activeReservationMap.get(room.id);
        const matchGuest = activeRes?.guestName.toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchGuest) return false;
      }

      return true;
    }).sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
  }, [rooms, statusFilter, selectedFloor, searchQuery, activeReservationMap]);

  const handleOpenRoomModal = (room: Quarto) => {
    const idx = rooms.findIndex((r) => r.id === room.id);
    setSelectedRoomIndex(idx !== -1 ? idx : 0);
    setSelectedRoom(room);
  };

  const handleNavigateRoom = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedRoomIndex > 0) {
      const newIdx = selectedRoomIndex - 1;
      setSelectedRoomIndex(newIdx);
      setSelectedRoom(rooms[newIdx]);
    } else if (direction === 'next' && selectedRoomIndex < rooms.length - 1) {
      const newIdx = selectedRoomIndex + 1;
      setSelectedRoomIndex(newIdx);
      setSelectedRoom(rooms[newIdx]);
    }
  };

  // Helper de cores por status do quarto
  const getStatusBadgeConfig = (status: RoomStatus) => {
    switch (status) {
      case 'ocupado':
        return {
          label: 'Ocupado',
          borderClass: 'border-blue-300 bg-blue-50/70 text-blue-900',
          dotClass: 'bg-blue-600',
          badgeClass: 'bg-blue-100 text-blue-800'
        };
      case 'disponivel':
        return {
          label: 'Livre / Limpo',
          borderClass: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
          dotClass: 'bg-emerald-600',
          badgeClass: 'bg-emerald-100 text-emerald-800'
        };
      case 'limpeza':
        return {
          label: 'Em Limpeza',
          borderClass: 'border-amber-300 bg-amber-50/70 text-amber-900',
          dotClass: 'bg-amber-500 animate-pulse',
          badgeClass: 'bg-amber-100 text-amber-900'
        };
      case 'vistoria':
        return {
          label: 'Em Vistoria',
          borderClass: 'border-purple-300 bg-purple-50/70 text-purple-900',
          dotClass: 'bg-purple-600',
          badgeClass: 'bg-purple-100 text-purple-900'
        };
      case 'manutencao':
      case 'bloqueado':
        return {
          label: status === 'bloqueado' ? 'Bloqueado' : 'Manutenção',
          borderClass: 'border-rose-300 bg-rose-50/70 text-rose-900',
          dotClass: 'bg-rose-600',
          badgeClass: 'bg-rose-100 text-rose-800'
        };
      default:
        return {
          label: status,
          borderClass: 'border-stone-300 bg-stone-50 text-stone-800',
          dotClass: 'bg-stone-500',
          badgeClass: 'bg-stone-100 text-stone-700'
        };
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-3.5 sm:p-4 border border-stone-200 shadow-2xs space-y-3 mb-4 transition-all">
      {/* Barra de Título & Controles de Cabeçalho */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200/60 shadow-2xs">
            <BedDouble className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-stone-900 tracking-tight">
                Mapa Operacional de Quartos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-extrabold border border-stone-200">
                {counts.total} Acomodações
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-none mt-0.5">
              Telemetria e status em tempo real sincronizados com o PMS
            </p>
          </div>
        </div>

        {/* Contadores e Ações de Cabeçalho */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Métricas Rápidas Minimalistas */}
          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'todos' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ocupado')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'ocupado' ? 'bg-blue-600 text-white shadow-2xs' : 'text-blue-700 hover:bg-blue-100/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Ocupados ({counts.ocupados})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disponivel')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'disponivel' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-100/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Livres ({counts.disponiveis})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('limpeza')}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'limpeza' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700 hover:bg-amber-100/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Limpeza ({counts.limpeza})
            </button>
            {counts.manutencao > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('manutencao')}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'manutencao' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-100/60'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Manutenção ({counts.manutencao})
              </button>
            )}
          </div>

          {/* Alternar Modo Compacto / Detalhado */}
          <button
            type="button"
            onClick={() => setIsCompactMode(!isCompactMode)}
            className="p-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
            title={isCompactMode ? 'Mudar para Visualização Detalhada' : 'Mudar para Modo Compacto Minimalista'}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Botão de Expandir / Recolher */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={isExpanded ? 'Recolher Mapa' : 'Expandir Mapa de Quartos'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Conteúdo Expansível do Mapa de Quartos */}
      {isExpanded && (
        <div className="space-y-3 pt-1 border-t border-stone-100">
          {/* Barra de Filtros & Busca Rápida */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar quarto (ex: 101) ou hóspede..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Filtro por Andar */}
            {floors.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span className="font-bold text-[11px]">Andar:</span>
                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="px-2 py-1 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="todos">Todos os Andares</option>
                  {floors.map((f) => (
                    <option key={f} value={f.toString()}>
                      {f}º Andar
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Grade de Quartos Minimalista */}
          {filteredRooms.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
              Nenhum quarto corresponde aos filtros selecionados.
            </div>
          ) : isCompactMode ? (
            /* Modo 1: Chips Minimalistas Compactos (Otimizados para visualização instantânea sem poluição) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {filteredRooms.map((room) => {
                const statusCfg = getStatusBadgeConfig(room.status);
                const activeRes = activeReservationMap.get(room.id);
                const activeKanbanCount = cardCountByRoom.get(room.numero) || 0;
                const minibar = getRoomMinibarSummary(room.numero);

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleOpenRoomModal(room)}
                    className={`p-2 rounded-2xl border text-left transition-all duration-150 cursor-pointer select-none group relative shadow-2xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between ${statusCfg.borderClass}`}
                    title={`Clique para abrir o controle integral do Quarto ${room.numero}`}
                  >
                    {/* Linha Superior: Número do Quarto e Status Dot */}
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-black text-xs text-stone-900 tracking-tight">
                          {room.numero}
                        </span>
                        {activeRes?.isVip && (
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" title="Hóspede VIP" />
                        )}
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dotClass}`} />
                    </div>

                    {/* Linha Intermediária: Nome do Quarto ou Hóspede */}
                    <div className="my-1 min-w-0">
                      {activeRes ? (
                        <p className="text-[10px] font-bold text-stone-800 truncate" title={activeRes.guestName}>
                          {activeRes.guestName}
                        </p>
                      ) : (
                        <p className="text-[10px] text-stone-500 font-medium truncate" title={room.nome}>
                          {room.nome}
                        </p>
                      )}
                    </div>

                    {/* Linha Inferior: Micro-badges de telemetria */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5 text-[9px] font-bold w-full">
                      <span className={`px-1 py-0.2 rounded truncate ${statusCfg.badgeClass}`}>
                        {statusCfg.label}
                      </span>

                      <div className="flex items-center gap-1 text-stone-500 shrink-0">
                        {minibar.needsRestock && (
                          <ShoppingBag className="w-2.5 h-2.5 text-amber-600" title="Frigobar precisa de reposição" />
                        )}
                        {room.fechadura_pin && (
                          <Key className="w-2.5 h-2.5 text-stone-400" title={`PIN: ${room.fechadura_pin}`} />
                        )}
                        {activeKanbanCount > 0 && (
                          <span className="px-1 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black text-[8px] shadow-2xs" title={`${activeKanbanCount} chamado(s) no Kanban`}>
                            {activeKanbanCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Modo 2: Cards Detalhados com Indicadores Ampliados */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredRooms.map((room) => {
                const statusCfg = getStatusBadgeConfig(room.status);
                const activeRes = activeReservationMap.get(room.id);
                const activeKanbanCount = cardCountByRoom.get(room.numero) || 0;
                const minibar = getRoomMinibarSummary(room.numero);

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleOpenRoomModal(room)}
                    className={`p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer select-none group relative shadow-2xs hover:shadow-md hover:-translate-y-0.5 space-y-2 ${statusCfg.borderClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-900 text-amber-300 font-black text-xs shadow-2xs">
                          {room.numero}
                        </span>
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {room.nome}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${statusCfg.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Informações de Ocupação / Hóspede */}
                    <div className="text-xs text-stone-600 bg-white/60 p-2 rounded-xl border border-black/5 space-y-1">
                      {activeRes ? (
                        <>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-stone-900 truncate flex items-center gap-1">
                              <Users className="w-3 h-3 text-stone-500" />
                              {activeRes.guestName}
                            </span>
                            {activeRes.isVip && (
                              <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center justify-between">
                            <span>Reserva: #{activeRes.reserva.codigo_reserva}</span>
                            <span>Saída: {activeRes.reserva.checkout}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-stone-500 italic py-0.5">
                          Sem hóspede ativo no momento
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-600 pt-1">
                      <div className="flex items-center gap-2">
                        {room.fechadura_pin && (
                          <span className="flex items-center gap-0.5 text-stone-500">
                            <Key className="w-3 h-3" />
                            PIN: {room.fechadura_pin}
                          </span>
                        )}
                        {minibar.needsRestock && (
                          <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                            <ShoppingBag className="w-3 h-3 text-amber-600" />
                            Repor
                          </span>
                        )}
                      </div>

                      {activeKanbanCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] shadow-2xs">
                          {activeKanbanCount} chamado{activeKanbanCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-stone-400 group-hover:text-stone-700 flex items-center gap-0.5 text-[10px]">
                          Ver detalhes &rarr;
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Completo de Gestão e Detalhes do Quarto ao Clicar */}
      {selectedRoom && (
        <RoomControlModal
          room={selectedRoom}
          isOpen={Boolean(selectedRoom)}
          onClose={() => setSelectedRoom(null)}
          onNavigateRoom={handleNavigateRoom}
          hasPrevRoom={selectedRoomIndex > 0}
          hasNextRoom={selectedRoomIndex < rooms.length - 1}
        />
      )}
    </div>
  );
};
