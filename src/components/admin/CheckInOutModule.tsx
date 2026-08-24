import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDateBR, formatDateTimeBR, generateWhatsAppLink } from '../../utils/formatters';
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
  FileCheck,
  Printer,
  MessageSquare,
  Mail,
  FileText,
  Eye,
  Share2
} from 'lucide-react';
import { Reserva } from '../../types';
import { GuestBillModal } from './GuestBillModal';

// Componente de Desk de Recepção para gestão ágil de Check-in, Hóspedes In-House e Check-out
export const CheckInOutModule: React.FC = () => {
  const { 
    reservations, 
    rooms, 
    guests, 
    updateReservationStatus, 
    setRoomStatus, 
    addConsumoToReservation,
    hotelConfig,
    currentUser
  } = useHotel();

  const [activeTab, setActiveTab] = useState<'checkin' | 'checkout' | 'in_house'>('checkin');
  const [checkoutModalReserva, setCheckoutModalReserva] = useState<Reserva | null>(null);
  const [selectedFolioReserva, setSelectedFolioReserva] = useState<Reserva | null>(null);

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
    setRoomStatus(res.quarto_id, 'limpeza');
    setCheckoutModalReserva(null);
  };

  // Helper para abrir WhatsApp rápido da conta
  const handleQuickWhatsAppFolio = (res: Reserva) => {
    const g = guests.find((guest) => guest.id === res.hospede_id);
    const rm = rooms.find((room) => room.id === res.quarto_id);
    const phone = g?.telefone || '(35) 99123-4567';
    const text = `🏨 *${hotelConfig.nome.toUpperCase()} - EXTRATO DE HOSPEDAGEM*\n\n` +
      `Olá, *${g?.nome || 'Hóspede'}*! Segue o resumo de sua estadia no Quarto ${rm?.numero || ''}:\n` +
      `• Período: ${formatDateBR(res.checkin)} a ${formatDateBR(res.checkout)}\n` +
      `• Hospedagem: ${formatCurrency(res.valor_diarias)}\n` +
      `• Taxa de Serviço (5%): ${formatCurrency(res.valor_taxas)}\n` +
      `• Consumos Frigobar / Extras: ${formatCurrency(res.valor_consumo || 0)}\n` +
      `💰 *Total da Conta: ${formatCurrency(res.valor_total)}*\n\n` +
      `Chave PIX do Hotel (CNPJ): ${hotelConfig.cnpj}\n` +
      `Agradecemos pela estadia! Esperamos recebê-lo novamente.`;
    window.open(generateWhatsAppLink(phone, text), '_blank');
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
            Controle de estadias em tempo real, emissão de faturas/PDF, envio de extratos por WhatsApp e fechamento de contas.
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

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedFolioReserva(res)}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1"
                      title="Ver Fólio / Extrato"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Fólio</span>
                    </button>

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
                        <span className="text-stone-500">Consumos Extras / Frigobar:</span>
                        <span className="font-mono text-amber-800 font-bold">{formatCurrency(res.valor_consumo || 0)}</span>
                      </div>
                      <div className="flex justify-between border-t border-stone-200 pt-1 font-bold">
                        <span>Total Conta:</span>
                        <span className="font-mono text-stone-900">{formatCurrency(res.valor_total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex flex-col gap-2">
                    {/* Botões de Extrato e Compartilhamento */}
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <button
                        onClick={() => setSelectedFolioReserva(res)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium flex items-center gap-1 transition"
                        title="Ver extrato completo e imprimir em PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-stone-600" />
                        <span>Extrato / PDF</span>
                      </button>

                      <button
                        onClick={() => handleQuickWhatsAppFolio(res)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1 transition"
                        title="Enviar extrato resumido via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      <span className="text-xs font-mono text-stone-500 font-semibold">
                        PIN: {res.pin_fechadura}#
                      </span>
                    </div>

                    <button
                      onClick={() => setCheckoutModalReserva(res)}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Fechar Check-out da Conta</span>
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações Fatura / Extrato</th>
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
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">{formatCurrency(res.valor_total)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Estadia Concluída
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedFolioReserva(res)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold inline-flex items-center gap-1 transition"
                          title="Imprimir Extrato / PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir PDF</span>
                        </button>
                        <button
                          onClick={() => handleQuickWhatsAppFolio(res)}
                          className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center transition"
                          title="Reenviar via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE FECHAMENTO DE CONTA E CHECK-OUT (COMO NA IMAGEM ENVIADA PELO USUÁRIO) */}
      {checkoutModalReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-stone-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider block">
                  FECHAMENTO DE CONTA & CHECK-OUT
                </span>
                <h4 className="font-serif-luxury text-2xl font-bold text-stone-900 mt-0.5">
                  {guests.find((g) => g.id === checkoutModalReserva.hospede_id)?.nome}
                </h4>
              </div>
              <button 
                onClick={() => setCheckoutModalReserva(null)} 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Quadro de Valores da Estadia */}
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Hospedagem ({checkoutModalReserva.checkin} a {checkoutModalReserva.checkout}):</span>
                <span className="font-mono font-medium text-stone-900">{formatCurrency(checkoutModalReserva.valor_diarias)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Taxa de Serviço:</span>
                <span className="font-mono font-medium text-stone-900">{formatCurrency(checkoutModalReserva.valor_taxas)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Consumos Frigobar / Extras:</span>
                <span className="font-mono font-medium text-amber-800">{formatCurrency(checkoutModalReserva.valor_consumo || 0)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-stone-200 font-bold text-stone-900 text-base">
                <span>Total Final da Conta:</span>
                <span className="font-mono text-emerald-800 text-lg font-black">{formatCurrency(checkoutModalReserva.valor_total)}</span>
              </div>
            </div>

            {/* Opções de Apresentação e Envio da Conta para o Hóspede */}
            <div className="p-3.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 space-y-2">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                Apresentação & Envio da Conta ao Hóspede:
              </span>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Visualizar e Imprimir PDF */}
                <button
                  type="button"
                  onClick={() => {
                    const res = checkoutModalReserva;
                    setSelectedFolioReserva(res);
                  }}
                  className="p-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold flex flex-col items-center justify-center gap-1 shadow-xs transition hover:border-stone-400 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px]">Imprimir PDF</span>
                </button>

                {/* Enviar WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleQuickWhatsAppFolio(checkoutModalReserva)}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold flex flex-col items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px]">Via WhatsApp</span>
                </button>

                {/* Enviar E-mail */}
                <button
                  type="button"
                  onClick={() => {
                    const g = guests.find((guest) => guest.id === checkoutModalReserva.hospede_id);
                    const email = g?.email || 'hospede@email.com';
                    const subject = encodeURIComponent(`[${hotelConfig.nome}] Extrato de Conta - ${checkoutModalReserva.codigo}`);
                    const body = encodeURIComponent(`Olá, ${g?.nome}!\n\nSegue o extrato detalhado de sua hospedagem no ${hotelConfig.nome}.\nTotal da conta: ${formatCurrency(checkoutModalReserva.valor_total)}\n\nAgradecemos sua preferência!`);
                    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
                  }}
                  className="p-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold flex flex-col items-center justify-center gap-1 shadow-xs transition hover:border-stone-400 cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px]">Via E-mail</span>
                </button>
              </div>
            </div>

            {/* Aviso de Governança */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/90 text-amber-900 text-xs">
              <strong>Atenção:</strong> Ao confirmar o Check-out, o quarto passará automaticamente para o status <strong>"Em Limpeza"</strong> para a equipe de governança.
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setCheckoutModalReserva(null)}
                className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => handleCompleteCheckout(checkoutModalReserva)}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                Confirmar Saída & Liberar Quarto
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL COMPLETO DE FÓLIO DE HOSPEDAGEM COM IMPRESSÃO EM PDF & ENVIOS */}
      {selectedFolioReserva && (
        <GuestBillModal
          isOpen={!!selectedFolioReserva}
          onClose={() => setSelectedFolioReserva(null)}
          reserva={selectedFolioReserva}
          guest={guests.find((g) => g.id === selectedFolioReserva.hospede_id)}
          room={rooms.find((r) => r.id === selectedFolioReserva.quarto_id)}
          hotelConfig={hotelConfig}
          currentUser={currentUser}
          onConfirmCheckout={(res) => {
            handleCompleteCheckout(res);
            setSelectedFolioReserva(null);
          }}
        />
      )}

    </div>
  );
};
