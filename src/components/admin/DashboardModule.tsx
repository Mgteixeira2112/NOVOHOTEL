import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
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
  AlertCircle 
} from 'lucide-react';
import { RoomStatus, Quarto, Reserva } from '../../types';

// Componente de painel geral do administrador (Dashboard) com Room Rack e indicadores chave
export const DashboardModule: React.FC = () => {
  const { 
    rooms, 
    reservations, 
    guests, 
    payments, 
    setAdminActiveTab, 
    setRoomStatus, 
    updateReservationStatus,
    openBookingWithRoom 
  } = useHotel();

  const [selectedRoomModal, setSelectedRoomModal] = useState<Quarto | null>(null);

  const todayStr = '2026-08-21';

  // Cálculo das métricas operacionais e taxa de ocupação
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'ocupado').length;
  const availableRooms = rooms.filter((r) => r.status === 'disponivel').length;
  const cleaningRooms = rooms.filter((r) => r.status === 'limpeza').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'manutencao').length;
  const occupancyRate = Math.round((occupiedRooms / (totalRooms || 1)) * 100);

  // Check-ins e Check-outs previstos para o dia de hoje
  const checkinsToday = reservations.filter((r) => r.checkin === todayStr && r.status === 'confirmada');
  const checkoutsToday = reservations.filter((r) => r.checkout === todayStr && r.status === 'checkin_realizado');
  const activeInHouse = reservations.filter((r) => r.status === 'checkin_realizado');

  // Faturamento e receita total acumulada
  const totalRevenue = payments
    .filter((p) => p.status === 'aprovado')
    .reduce((acc, p) => acc + p.valor, 0);

  const recentReservations = [...reservations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      
      {/* Boas-vindas e Ações Rápidas de Balcão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Painel Geral de Controle
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Visão consolidada de ocupação, chegadas, saídas e faturamento em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminActiveTab('checkin_out')}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Desk de Recepção</span>
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

      {/* Grade de Indicadores Chave de Performance (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Taxa de Ocupação */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Taxa de Ocupação Hoje
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-stone-900">{occupancyRate}%</span>
              <span className="text-xs text-stone-500">({occupiedRooms} de {totalRooms})</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12% vs. semana anterior
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Check-ins Previstos */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Check-ins Previstos Hoje
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-stone-900">{checkinsToday.length}</span>
              <span className="text-xs text-stone-500">chegadas</span>
            </div>
            <button
              onClick={() => setAdminActiveTab('checkin_out')}
              className="text-[11px] text-amber-700 hover:underline font-semibold mt-1 block"
            >
              Ver fila de check-in →
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <LogIn className="w-6 h-6" />
          </div>
        </div>

        {/* Check-outs Previstos */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Check-outs Previstos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-stone-900">{checkoutsToday.length}</span>
              <span className="text-xs text-stone-500">partidas</span>
            </div>
            <span className="text-[11px] text-stone-500 font-semibold mt-1 block">
              {activeInHouse.length} hóspedes in-house
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
        </div>

        {/* Receita Total */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Receita Total Registrada
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-stone-900">{formatCurrency(totalRevenue)}</span>
            </div>
            <button
              onClick={() => setAdminActiveTab('financial')}
              className="text-[11px] text-amber-700 hover:underline font-semibold mt-1 block"
            >
              Relatório financeiro →
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Mapa Visual de Acomodações em Tempo Real (Room Rack) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              Mapa Operacional de Acomodações (Room Rack)
            </h3>
            <p className="text-xs text-stone-500">
              Clique em qualquer quarto para alterar status operacional ou emitir PIN da fechadura.
            </p>
          </div>

          {/* Legenda de Cores dos Status */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-stone-600">Disponível ({availableRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-stone-600">Ocupado ({occupiedRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-stone-600">Limpeza ({cleaningRooms})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-stone-600">Manutenção ({maintenanceRooms})</span>
            </div>
          </div>
        </div>

        {/* Grade de Quartos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {rooms.map((room) => {
            const activeRes = reservations.find((r) => r.quarto_id === room.id && r.status === 'checkin_realizado');
            const guest = activeRes ? guests.find((g) => g.id === activeRes.hospede_id) : null;

            let statusBg = 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500';
            let badgeColor = 'bg-emerald-600 text-white';
            let label = 'Disponível';

            if (room.status === 'ocupado') {
              statusBg = 'bg-blue-50 border-blue-300 text-blue-950 hover:border-blue-500';
              badgeColor = 'bg-blue-600 text-white';
              label = 'Ocupado';
            } else if (room.status === 'limpeza') {
              statusBg = 'bg-amber-50 border-amber-300 text-amber-950 hover:border-amber-500';
              badgeColor = 'bg-amber-600 text-white';
              label = 'Em Limpeza';
            } else if (room.status === 'manutencao') {
              statusBg = 'bg-rose-50 border-rose-300 text-rose-950 hover:border-rose-500';
              badgeColor = 'bg-rose-600 text-white';
              label = 'Manutenção';
            }

            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoomModal(room)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${statusBg}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-bold font-mono block leading-none">
                      {room.numero}
                    </span>
                    <span className="text-[11px] font-medium text-stone-600 truncate block max-w-[110px]">
                      {room.nome}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                    {label}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-200/50 text-[11px]">
                  {guest ? (
                    <div className="truncate font-semibold text-blue-900">
                      👤 {guest.nome}
                    </div>
                  ) : (
                    <div className="text-stone-500 flex items-center justify-between">
                      <span>{formatCurrency(room.valor_diaria)}/d</span>
                      <span>🔑 {room.fechadura_pin}#</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Layout de Duas Colunas: Fila Operacional de Hoje e Últimas Reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fila Operacional de Hoje (Check-ins e Check-outs) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-luxury text-lg font-bold text-stone-900">
              Operações de Hoje ({formatDateBR(todayStr)})
            </h3>
            <span className="text-xs text-stone-500">
              {checkinsToday.length + checkoutsToday.length} ações pendentes
            </span>
          </div>

          <div className="space-y-2.5">
            {checkinsToday.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);

              return (
                <div key={res.id} className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-900 block">{guest?.nome}</span>
                      <span className="text-stone-500">
                        Quarto {room?.numero} ({room?.nome}) • {res.quantidade_hospedes} pessoas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-700">{res.codigo}</span>
                    <button
                      onClick={() => updateReservationStatus(res.id, 'checkin_realizado', { checkinTime: new Date().toISOString() })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
                    >
                      Realizar Check-in
                    </button>
                  </div>
                </div>
              );
            })}

            {checkoutsToday.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);

              return (
                <div key={res.id} className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-900 block">{guest?.nome}</span>
                      <span className="text-stone-500">
                        Quarto {room?.numero} • Total: {formatCurrency(res.valor_total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateReservationStatus(res.id, 'checkout_concluido', { checkoutTime: new Date().toISOString() })}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
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

        {/* Painel de Últimas Reservas Registradas */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
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

          <div className="space-y-3">
            {recentReservations.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);

              return (
                <div key={res.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
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

      {/* Modal de Gestão Rápida de Status do Quarto e Senha PIN */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase">Acomodação Nº {selectedRoomModal.numero}</span>
                <h4 className="font-serif-luxury text-xl font-bold text-stone-900">{selectedRoomModal.nome}</h4>
              </div>
              <button onClick={() => setSelectedRoomModal(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600 mb-2">Alterar Status Operacional:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRoomStatus(selectedRoomModal.id, 'disponivel');
                    setSelectedRoomModal(null);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    selectedRoomModal.status === 'disponivel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  ✓ Disponível / Livre
                </button>

                <button
                  onClick={() => {
                    setRoomStatus(selectedRoomModal.id, 'ocupado');
                    setSelectedRoomModal(null);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    selectedRoomModal.status === 'ocupado' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  👤 Ocupado
                </button>

                <button
                  onClick={() => {
                    setRoomStatus(selectedRoomModal.id, 'limpeza');
                    setSelectedRoomModal(null);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    selectedRoomModal.status === 'limpeza' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  🧹 Em Limpeza / Governança
                </button>

                <button
                  onClick={() => {
                    setRoomStatus(selectedRoomModal.id, 'manutencao');
                    setSelectedRoomModal(null);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                    selectedRoomModal.status === 'manutencao' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  🔧 Em Manutenção
                </button>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1 text-stone-600">
              <div className="flex justify-between">
                <span>PIN Fechadura Digital:</span>
                <strong className="font-mono text-stone-900">{selectedRoomModal.fechadura_pin}#</strong>
              </div>
              <div className="flex justify-between">
                <span>Diária Padrão:</span>
                <strong className="font-mono text-stone-900">{formatCurrency(selectedRoomModal.valor_diaria)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Capacidade:</span>
                <span>Até {selectedRoomModal.capacidade} pessoas</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRoomModal(null)}
                className="px-4 py-2 bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
