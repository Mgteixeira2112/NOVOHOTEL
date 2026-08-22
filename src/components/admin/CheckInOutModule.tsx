import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../../utils/formatters';
import { 
  LogIn, 
  LogOut, 
  Key, 
  CheckCircle2, 
  Clock, 
  Users, 
  DollarSign, 
  Sparkles, 
  AlertCircle, 
  FileCheck 
} from 'lucide-react';
import { Reserva } from '../../types';

// Componente de Desk de Recepção para gestão ágil de Check-in, Hóspedes In-House e Check-out
export const CheckInOutModule: React.FC = () => {
  const { 
    reservations, 
    rooms, 
    guests, 
    updateReservationStatus, 
    setRoomStatus, 
    addConsumoToReservation 
  } = useHotel();

  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout' | 'in_house'>('checkin');
  const [checkoutModalReserva, setCheckoutModalReserva] = useState<Reserva | null>(null);

  const todayStr = '2026-08-21';

  // Lista de check-ins pendentes (reservas confirmadas aguardando entrada)
  const pendingCheckins = reservations.filter((r) => r.status === 'confirmada');
  // Lista de hóspedes atualmente hospedados (In-House)
  const inHouseGuests = reservations.filter((r) => r.status === 'checkin_realizado');
  // Histórico de check-outs concluídos
  const completedCheckouts = reservations.filter((r) => r.status === 'checkout_concluido');

  const handlePerformCheckin = (res: Reserva) => {
    updateReservationStatus(res.id, 'checkin_realizado', {
      checkinTime: new Date().toISOString(),
    });
  };

  const handleCompleteCheckout = (res: Reserva) => {
    updateReservationStatus(res.id, 'checkout_concluido', {
      checkoutTime: new Date().toISOString(),
    });
    setCheckoutModalReserva(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Título do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Desk de Recepção: Check-in & Check-out
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Controle de estadias em tempo real, emissão de chaves/PINs e faturamento no fechamento da conta.
          </p>
        </div>

        {/* Botões de Alternância de Abas */}
        <div className="bg-stone-200 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'checkin' ? 'bg-blue-600 text-white shadow-sm' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Chegadas / Check-in ({pendingCheckins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('in_house')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'in_house' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Hóspedes In-House ({inHouseGuests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('checkout')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'checkout' ? 'bg-stone-900 text-amber-300 shadow-sm' : 'text-stone-700 hover:text-stone-950'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Histórico Saídas ({completedCheckouts.length})</span>
          </button>
        </div>
      </div>

      {/* 1. ABA DE CHECK-INS PENDENTES */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingCheckins.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-stone-400 font-mono">
                          {res.codigo}
                        </span>
                        <h4 className="font-bold text-stone-900 text-base">{guest?.nome}</h4>
                        <span className="text-xs text-stone-500">{guest?.telefone} • CPF: {guest?.documento}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold">
                        Chegada
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Acomodação:</span>
                        <strong className="text-stone-900">Quarto {room?.numero} ({room?.nome})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Período:</span>
                        <span>{formatDateBR(res.checkin)} a {formatDateBR(res.checkout)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Total Pago:</span>
                        <strong className="font-mono text-stone-900">{formatCurrency(res.valor_total)}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between text-amber-900">
                      <span className="flex items-center gap-1 font-semibold">
                        <Key className="w-3.5 h-3.5 text-amber-700" />
                        PIN Fechadura Digital:
                      </span>
                      <strong className="font-mono text-sm">{res.pin_fechadura}#</strong>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">
                      {res.observacoes ? `Obs: ${res.observacoes}` : 'Sem observações'}
                    </span>

                    <button
                      onClick={() => handlePerformCheckin(res)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Efetuar Check-in</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pendingCheckins.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6 text-stone-500 text-xs">
              Nenhum check-in pendente no momento.
            </div>
          )}
        </div>
      )}

      {/* 2. ABA DE HÓSPEDES IN-HOUSE (PRONTOS PARA CHECK-OUT) */}
      {activeTab === 'in_house' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inHouseGuests.map((res) => {
              const guest = guests.find((g) => g.id === res.hospede_id);
              const room = rooms.find((r) => r.id === res.quarto_id);

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl p-5 border-2 border-emerald-500/40 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          Hóspede In-House
                        </span>
                        <h4 className="font-bold text-stone-900 text-base mt-1">{guest?.nome}</h4>
                        <span className="text-xs text-stone-500">Quarto {room?.numero} • {room?.nome}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-stone-500">{res.codigo}</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Entrada:</span>
                        <span>{formatDateBR(res.checkin)} ({res.checkin_horario ? formatDateTimeBR(res.checkin_horario) : '14h'})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Saída Prevista:</span>
                        <strong className="text-stone-900">{formatDateBR(res.checkout)} (12h)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Consumos Extras:</span>
                        <span className="font-mono text-amber-800 font-bold">{formatCurrency(res.valor_consumo || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-stone-200 pt-1 font-bold">
                        <span>Total Conta:</span>
                        <span className="font-mono text-stone-900">{formatCurrency(res.valor_total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-600">
                      PIN: {res.pin_fechadura}#
                    </span>

                    <button
                      onClick={() => setCheckoutModalReserva(res)}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Fechar Check-out</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {inHouseGuests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6 text-stone-500 text-xs">
              Nenhum hóspede hospedado no momento.
            </div>
          )}
        </div>
      )}

      {/* 3. ABA DE HISTÓRICO DE CHECK-OUTS CONCLUÍDOS */}
      {activeTab === 'checkout' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 text-[11px] font-bold uppercase text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Hóspede</th>
                  <th className="py-3 px-4">Quarto</th>
                  <th className="py-3 px-4">Período Estadia</th>
                  <th className="py-3 px-4">Total Faturado</th>
                  <th className="py-3 px-4">Status Quarto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {completedCheckouts.map((res) => {
                  const guest = guests.find((g) => g.id === res.hospede_id);
                  const room = rooms.find((r) => r.id === res.quarto_id);

                  return (
                    <tr key={res.id} className="hover:bg-stone-50">
                      <td className="py-3 px-4 font-mono font-bold">{res.codigo}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{guest?.nome}</td>
                      <td className="py-3 px-4">#{room?.numero} - {room?.nome}</td>
                      <td className="py-3 px-4">{formatDateBR(res.checkin)} a {formatDateBR(res.checkout)}</td>
                      <td className="py-3 px-4 font-mono font-bold">{formatCurrency(res.valor_total)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] font-bold">
                          Estadia Concluída
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE FECHAMENTO DE CONTA E CHECK-OUT */}
      {checkoutModalReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-stone-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-orange-700 uppercase">Fechamento de Conta & Check-out</span>
                <h4 className="font-serif-luxury text-xl font-bold text-stone-900">
                  {guests.find((g) => g.id === checkoutModalReserva.hospede_id)?.nome}
                </h4>
              </div>
              <button onClick={() => setCheckoutModalReserva(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Hospedagem ({checkoutModalReserva.checkin} a {checkoutModalReserva.checkout}):</span>
                <span className="font-mono">{formatCurrency(checkoutModalReserva.valor_diarias)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Taxa de Serviço:</span>
                <span className="font-mono">{formatCurrency(checkoutModalReserva.valor_taxas)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Consumos Frigobar / Extras:</span>
                <span className="font-mono">{formatCurrency(checkoutModalReserva.valor_consumo || 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200 font-bold text-stone-900 text-sm">
                <span>Total Final da Conta:</span>
                <span className="font-mono text-emerald-800">{formatCurrency(checkoutModalReserva.valor_total)}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
              <strong>Atenção:</strong> Ao confirmar o Check-out, o quarto passará automaticamente para o status <strong>"Em Limpeza"</strong> para a equipe de governança.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCheckoutModalReserva(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold"
              >
                Voltar
              </button>
              <button
                onClick={() => handleCompleteCheckout(checkoutModalReserva)}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md"
              >
                Confirmar Saída & Liberar Quarto
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
