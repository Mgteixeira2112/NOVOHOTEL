import React, { useState, useMemo } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDateBR, formatDateTimeBR, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  Plus, 
  Filter, 
  X, 
  Eye, 
  CheckCircle2, 
  Ban, 
  Phone, 
  DollarSign, 
  PlusCircle, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Key, 
  Utensils,
  Printer,
  Mail,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { Reserva, ReservationStatus } from '../../types';
import { GuestBillModal } from './GuestBillModal';
import { CalendarReportModal } from './CalendarReportModal';

// Componente de Gestão de Reservas, Mapa de Ocupação em Timeline e Ficha de Consumo
export const ReservationsModule: React.FC = () => {
  const { 
    reservations, 
    rooms, 
    guests, 
    payments, 
    updateReservationStatus, 
    cancelReservation, 
    addConsumoToReservation,
    openBookingWithRoom,
    hotelConfig,
    currentUser,
    simulateMessageDispatch
  } = useHotel();

  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Configurações do Período da Linha do Tempo (Diário / Quinzenal / Mensal)
  const [timelinePeriod, setTimelinePeriod] = useState<'daily' | 'biweekly' | 'monthly'>('biweekly');
  const [selectedMonth, setSelectedMonth] = useState<'2026-08' | '2026-09'>('2026-08');
  const [biweeklyPhase, setBiweeklyPhase] = useState<'first' | 'second'>('second');
  const [dailyStartDay, setDailyStartDay] = useState(18); // Foco na semana atual

  // Estado do Modal de Detalhes da Reserva
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [folioReserva, setFolioReserva] = useState<Reserva | null>(null);
  const [showCalendarReportModal, setShowCalendarReportModal] = useState(false);
  const [extraItemName, setExtraItemName] = useState('');
  const [extraItemPrice, setExtraItemPrice] = useState(35);
  const [extraItemQty, setExtraItemQty] = useState(1);

  // Estado do Modal de Simulação de Disparo de WhatsApp
  const [messagePreview, setMessagePreview] = useState<{ text: string; phone: string } | null>(null);

  // Geração dinâmica dos dias da timeline garantindo SEMPRE linha única contínua
  const timelineDays = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    if (timelinePeriod === 'daily') {
      const start = Math.min(Math.max(1, dailyStartDay), daysInMonth - 6);
      return Array.from({ length: 7 }, (_, i) => {
        const day = start + i;
        return `${selectedMonth}-${day < 10 ? '0' + day : day}`;
      });
    } else if (timelinePeriod === 'biweekly') {
      if (biweeklyPhase === 'first') {
        return Array.from({ length: 15 }, (_, i) => {
          const day = i + 1;
          return `${selectedMonth}-${day < 10 ? '0' + day : day}`;
        });
      } else {
        const length = daysInMonth - 15;
        return Array.from({ length }, (_, i) => {
          const day = i + 16;
          return `${selectedMonth}-${day < 10 ? '0' + day : day}`;
        });
      }
    } else {
      // 'monthly' - todos os dias do mês (1 a 30 ou 31)
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return `${selectedMonth}-${day < 10 ? '0' + day : day}`;
      });
    }
  }, [timelinePeriod, selectedMonth, biweeklyPhase, dailyStartDay]);

  const filteredReservations = reservations.filter((r) => {
    const guest = guests.find((g) => g.id === r.hospede_id);
    const room = rooms.find((rm) => rm.id === r.quarto_id);
    const matchesSearch = 
      r.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room?.numero || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'todos' ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddExtraConsumption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReserva || !extraItemName) return;

    addConsumoToReservation(selectedReserva.id, {
      item: extraItemName,
      quantidade: Number(extraItemQty),
      valor_unitario: Number(extraItemPrice),
      data: new Date().toISOString(),
    });

    // Atualiza estado local do modal de detalhes
    const updated = reservations.find((r) => r.id === selectedReserva.id);
    if (updated) setSelectedReserva(updated);

    setExtraItemName('');
    setExtraItemQty(1);
  };

  const handleSendWhatsAppVoucher = (res: Reserva) => {
    const result = simulateMessageDispatch('auto-1', res.id);
    if (result.success) {
      setMessagePreview({
        text: result.messageText,
        phone: result.recipient,
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Cabeçalho e Controles de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-stone-900">
            Controle de Reservas & Calendário
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Linha do tempo por acomodação, conciliação de datas, consumo adicional e voucher.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Alternador de Modo de Visualização (Timeline vs Tabela) */}
          <div className="bg-stone-200 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'calendar' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Mapa / Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela ({reservations.length})</span>
            </button>
          </div>

          {/* Botão de Relatório & Impressão PDF */}
          <button
            onClick={() => setShowCalendarReportModal(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm border border-stone-800 transition cursor-pointer"
            title="Imprimir Mapa de Reservas e Calendário em PDF com relatório personalizável"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Relatório & PDF</span>
          </button>

          <button
            onClick={() => openBookingWithRoom()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, hóspede ou quarto..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-stone-500 uppercase whitespace-nowrap">Status:</span>
          {['todos', 'confirmada', 'checkin_realizado', 'checkout_concluido', 'cancelada'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-stone-900 text-amber-300'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 1. VISUALIZAÇÃO MATRICIAL EM LINHA DO TEMPO (CALENDÁRIO) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          
          {/* Barra de Controles da Linha do Tempo */}
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-xl px-2 py-1 shadow-sm">
                <button
                  onClick={() => setSelectedMonth('2026-08')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMonth === '2026-08'
                      ? 'bg-stone-900 text-amber-300'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Agosto / 2026
                </button>
                <button
                  onClick={() => setSelectedMonth('2026-09')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedMonth === '2026-09'
                      ? 'bg-stone-900 text-amber-300'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  Setembro / 2026
                </button>
              </div>

              {/* Seletores de Tipo de Visualização Temporal: Diário, Quinzenal, Mensal */}
              <div className="bg-stone-200 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setTimelinePeriod('daily')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timelinePeriod === 'daily'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Diário (7 Dias)
                </button>
                <button
                  onClick={() => setTimelinePeriod('biweekly')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timelinePeriod === 'biweekly'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Quinzenal (15 Dias)
                </button>
                <button
                  onClick={() => setTimelinePeriod('monthly')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timelinePeriod === 'monthly'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Mensal Completo (31 Dias)
                </button>
              </div>

              {/* Sub-controles para Diário e Quinzenal */}
              {timelinePeriod === 'daily' && (
                <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-2 py-1">
                  <button
                    onClick={() => setDailyStartDay((prev) => Math.max(1, prev - 7))}
                    className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                    title="7 dias anteriores"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-stone-700 px-1">
                    {formatDateBR(timelineDays[0])} a {formatDateBR(timelineDays[timelineDays.length - 1])}
                  </span>
                  <button
                    onClick={() => setDailyStartDay((prev) => Math.min(24, prev + 7))}
                    className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                    title="Próximos 7 dias"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {timelinePeriod === 'biweekly' && (
                <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    onClick={() => setBiweeklyPhase('first')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition ${
                      biweeklyPhase === 'first' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    1ª Quinzena (01-15)
                  </button>
                  <button
                    onClick={() => setBiweeklyPhase('second')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition ${
                      biweeklyPhase === 'second' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    2ª Quinzena (16-31)
                  </button>
                </div>
              )}

              {/* Botão de Hoje */}
              <button
                onClick={() => {
                  setSelectedMonth('2026-08');
                  setBiweeklyPhase('second');
                  setDailyStartDay(18);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition cursor-pointer border border-amber-300"
                title="Ir para o dia de hoje (21/08/2026)"
              >
                Hoje (21/Ago)
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowCalendarReportModal(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs border border-stone-800"
                title="Personalizar período, filtros e imprimir em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Imprimir / Relatório PDF</span>
              </button>

              <div className="flex items-center gap-2.5 text-[11px] text-stone-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600" /> In-House
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Confirmada
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-stone-500" /> Finalizada
                </span>
              </div>
            </div>

          </div>

          {/* TABELA DE TIMELINE EM LINHA ÚNICA NÃO QUEBRÁVEL */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left border-spacing-0 select-none min-w-max">
              
              {/* Cabeçalho dos Dias (Sempre em linha única horizontal) */}
              <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="sticky left-0 bg-stone-100 z-20 min-w-[210px] w-56 p-2.5 border-r border-b border-stone-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between">
                      <span>Quarto / Acomodação</span>
                      <span className="text-[9px] font-mono text-stone-400 font-normal">Diária</span>
                    </div>
                  </th>

                  {timelineDays.map((d) => {
                    const dayNum = d.split('-')[2];
                    const dateObj = new Date(`${d}T12:00:00`);
                    const weekDay = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dateObj.getDay()];
                    const isToday = d === '2026-08-21';

                    return (
                      <th
                        key={d}
                        className={`min-w-[44px] w-11 max-w-[50px] p-1 text-center border-r border-b border-stone-200 whitespace-nowrap ${
                          isToday ? 'bg-amber-200/90 text-amber-950 font-black ring-1 ring-amber-400' : ''
                        }`}
                      >
                        <span className="block text-[11px] font-mono leading-none">{dayNum}</span>
                        <span className="block text-[8px] font-normal text-stone-500 uppercase mt-0.5">{weekDay}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Linhas por Quarto */}
              <tbody className="divide-y divide-stone-100 text-xs">
                {rooms.map((room) => {
                  const roomRes = reservations.filter((r) => r.quarto_id === room.id && r.status !== 'cancelada');

                  return (
                    <tr key={room.id} className="hover:bg-stone-50/60 transition group">
                      
                      {/* Célula Fixa da Acomodação no Lado Esquerdo */}
                      <td className="sticky left-0 bg-white group-hover:bg-stone-50/95 z-10 min-w-[210px] w-56 p-2 border-r border-stone-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-between gap-1">
                          <div className="truncate">
                            <span className="font-mono font-bold text-stone-900 text-xs block">
                              #{room.numero}
                            </span>
                            <span className="text-[11px] text-stone-600 truncate block max-w-[135px]" title={room.nome}>
                              {room.nome}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {formatCurrency(room.valor_diaria)}
                          </span>
                        </div>
                      </td>

                      {/* Células de Cada Dia do Período */}
                      {timelineDays.map((d) => {
                        const resForDay = roomRes.find((r) => d >= r.checkin && d < r.checkout);
                        const isToday = d === '2026-08-21';
                        const guest = resForDay ? guests.find((g) => g.id === resForDay.hospede_id) : null;
                        const isStart = resForDay && d === resForDay.checkin;

                        let cellBg = '';
                        if (resForDay) {
                          cellBg = resForDay.status === 'checkin_realizado' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : resForDay.status === 'confirmada'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-stone-500 hover:bg-stone-600 text-white';
                        }

                        return (
                          <td
                            key={d}
                            onClick={() => resForDay && setSelectedReserva(resForDay)}
                            className={`min-w-[44px] w-11 max-w-[50px] p-0.5 border-r border-stone-100 text-center relative h-12 transition ${
                              isToday ? 'bg-amber-50/50' : ''
                            } ${resForDay ? 'cursor-pointer' : ''}`}
                          >
                            {resForDay && (
                              <div
                                className={`w-full h-full min-h-[38px] rounded flex flex-col items-center justify-center p-0.5 font-bold shadow-xs transition ${cellBg}`}
                                title={`${resForDay.codigo} - ${guest?.nome} (${formatDateBR(resForDay.checkin)} a ${formatDateBR(resForDay.checkout)}) - Clique para abrir detalhes`}
                              >
                                {isStart || timelineDays.indexOf(d) === 0 ? (
                                  <div className="leading-tight overflow-hidden text-center w-full">
                                    <span className="truncate text-[9px] font-bold block">
                                      {guest?.nome.split(' ')[0]}
                                    </span>
                                    <span className="text-[7px] opacity-85 font-mono block">
                                      {resForDay.codigo.split('-')[1] || resForDay.codigo}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}

                    </tr>
                  );
                })}
              </tbody>

              {/* Linha de Resumo de Ocupação Diária no Rodapé do Mapa */}
              <tfoot className="bg-stone-100/90 text-stone-700 text-[10px] font-bold border-t border-stone-300">
                <tr>
                  <th className="sticky left-0 bg-stone-100 z-20 min-w-[210px] w-56 p-2 border-r border-stone-300 text-stone-600 uppercase shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                    Ocupação Diária (%)
                  </th>
                  {timelineDays.map((d) => {
                    const occupiedCount = rooms.filter((rm) =>
                      reservations.some(
                        (r) => r.quarto_id === rm.id && r.status !== 'cancelada' && d >= r.checkin && d < r.checkout
                      )
                    ).length;
                    const percent = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;
                    const isToday = d === '2026-08-21';

                    return (
                      <td
                        key={d}
                        className={`min-w-[44px] w-11 max-w-[50px] p-1 text-center border-r border-stone-200 font-mono text-[9px] ${
                          isToday ? 'bg-amber-200/80 font-black' : ''
                        }`}
                        title={`${occupiedCount} de ${rooms.length} quartos ocupados em ${formatDateBR(d)}`}
                      >
                        <span className={percent >= 80 ? 'text-blue-700 font-black' : percent >= 50 ? 'text-emerald-700 font-bold' : 'text-stone-500'}>
                          {percent}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>

            </table>
          </div>
        </div>
      )}

      {/* 2. VISUALIZAÇÃO EM TABELA DETALHADA */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-100 text-[11px] font-bold uppercase text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Hóspede</th>
                  <th className="py-3 px-4">Acomodação</th>
                  <th className="py-3 px-4">Período</th>
                  <th className="py-3 px-4">Valor Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">PIN Fechadura</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredReservations.map((res) => {
                  const guest = guests.find((g) => g.id === res.hospede_id);
                  const room = rooms.find((r) => r.id === res.quarto_id);

                  return (
                    <tr key={res.id} className="hover:bg-stone-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {res.codigo}
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-stone-900 block">{guest?.nome || '---'}</strong>
                        <span className="text-[11px] text-stone-500">{guest?.telefone}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800 block">#{room?.numero} - {room?.nome}</span>
                        <span className="text-[11px] text-stone-500">{res.quantidade_hospedes} pessoas</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-stone-900 block">{formatDateBR(res.checkin)} a {formatDateBR(res.checkout)}</span>
                        <span className="text-[11px] text-stone-500">{res.checkin_horario ? 'Check-in feito' : 'Previsto 14h'}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {formatCurrency(res.valor_total)}
                        {res.valor_consumo ? (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            (+{formatCurrency(res.valor_consumo)} consumo)
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          res.status === 'checkin_realizado'
                            ? 'bg-blue-100 text-blue-800'
                            : res.status === 'confirmada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'checkout_concluido'
                            ? 'bg-stone-200 text-stone-700'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {res.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-stone-700">
                        🔑 {res.pin_fechadura || '---'}#
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendWhatsAppVoucher(res)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            title="Disparar Voucher no WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedReserva(res)}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalhes</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL / GAVETA DE DETALHES DA RESERVA E LANÇAMENTO DE CONSUMO */}
      {selectedReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase">
                  Ficha da Reserva • {selectedReserva.codigo}
                </span>
                <h3 className="font-serif-luxury text-2xl font-bold text-stone-900">
                  {guests.find((g) => g.id === selectedReserva.hospede_id)?.nome}
                </h3>
              </div>
              <button onClick={() => setSelectedReserva(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto flex-1 pr-1">
              
              {/* Status e Botões de Ação Rápida */}
              <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-200 gap-3">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-bold block">Status Atual</span>
                  <span className="text-sm font-bold text-stone-900 capitalize">{selectedReserva.status.replace('_', ' ')}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedReserva.status === 'confirmada' && (
                    <button
                      onClick={() => {
                        updateReservationStatus(selectedReserva.id, 'checkin_realizado', { checkinTime: new Date().toISOString() });
                        setSelectedReserva({ ...selectedReserva, status: 'checkin_realizado' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    >
                      Efetuar Check-in
                    </button>
                  )}

                  {selectedReserva.status === 'checkin_realizado' && (
                    <button
                      onClick={() => {
                        updateReservationStatus(selectedReserva.id, 'checkout_concluido', { checkoutTime: new Date().toISOString() });
                        setSelectedReserva({ ...selectedReserva, status: 'checkout_concluido' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                    >
                      Fechar Check-out
                    </button>
                  )}

                  {selectedReserva.status !== 'cancelada' && selectedReserva.status !== 'checkout_concluido' && (
                    <button
                      onClick={() => {
                        if (confirm('Deseja realmente cancelar esta reserva?')) {
                          cancelReservation(selectedReserva.id, 'Cancelada pela recepção');
                          setSelectedReserva(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs"
                    >
                      Cancelar Reserva
                    </button>
                  )}
                </div>
              </div>

              {/* Detalhes Gerais da Estadia */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-stone-50">
                  <span className="text-stone-500 block">Quarto</span>
                  <strong className="text-stone-900">{rooms.find((r) => r.id === selectedReserva.quarto_id)?.nome}</strong>
                </div>
                <div className="p-3 rounded-lg bg-stone-50">
                  <span className="text-stone-500 block">Check-in</span>
                  <strong className="text-stone-900">{formatDateBR(selectedReserva.checkin)}</strong>
                </div>
                <div className="p-3 rounded-lg bg-stone-50">
                  <span className="text-stone-500 block">Check-out</span>
                  <strong className="text-stone-900">{formatDateBR(selectedReserva.checkout)}</strong>
                </div>
                <div className="p-3 rounded-lg bg-stone-50">
                  <span className="text-stone-500 block">Fechadura PIN</span>
                  <strong className="text-stone-900 font-mono">🔑 {selectedReserva.pin_fechadura}#</strong>
                </div>
              </div>

              {/* Seção de Consumo Adicional & Frigobar (Recurso operacional do PMS) */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    Consumo Adicional & Frigobar
                  </h4>
                  <span className="text-xs font-bold text-amber-800 font-mono">
                    Total: {formatCurrency(selectedReserva.valor_consumo || 0)}
                  </span>
                </div>

                {/* Lista de Itens Consumidos */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedReserva.consumo_itens && selectedReserva.consumo_itens.length > 0 ? (
                    selectedReserva.consumo_itens.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-stone-50 rounded">
                        <span>{item.quantidade}x {item.item}</span>
                        <span className="font-mono font-bold text-stone-900">{formatCurrency(item.quantidade * item.valor_unitario)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-stone-400 italic py-2">Nenhum consumo adicional lançado.</div>
                  )}
                </div>

                {/* Formulário de Adicionar Consumo */}
                <form onSubmit={handleAddExtraConsumption} className="flex gap-2 pt-2 border-t border-stone-100">
                  <input
                    type="text"
                    required
                    value={extraItemName}
                    onChange={(e) => setExtraItemName(e.target.value)}
                    placeholder="Item (ex: Água com gás, Massagem Spa...)"
                    className="flex-1 p-2 rounded-lg border border-stone-200 text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    value={extraItemQty}
                    onChange={(e) => setExtraItemQty(Number(e.target.value))}
                    className="w-16 p-2 rounded-lg border border-stone-200 text-xs text-center"
                    placeholder="Qtd"
                  />
                  <input
                    type="number"
                    min={1}
                    value={extraItemPrice}
                    onChange={(e) => setExtraItemPrice(Number(e.target.value))}
                    className="w-24 p-2 rounded-lg border border-stone-200 text-xs font-mono"
                    placeholder="R$"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-stone-900 text-amber-300 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar</span>
                  </button>
                </form>
              </div>

              {/* Resumo Financeiro Geral */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Diárias ({selectedReserva.valor_diarias ? formatCurrency(selectedReserva.valor_diarias) : '---'}):</span>
                  <span>{formatCurrency(selectedReserva.valor_diarias)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Serviço:</span>
                  <span>{formatCurrency(selectedReserva.valor_taxas)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consumo Extra:</span>
                  <span>{formatCurrency(selectedReserva.valor_consumo || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-200 font-bold text-stone-900 text-sm">
                  <span>Total Geral da Conta:</span>
                  <span className="font-mono text-amber-900">{formatCurrency(selectedReserva.valor_total)}</span>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFolioReserva(selectedReserva)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Imprimir Extrato da Conta em PDF ou enviar ao Hóspede"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Extrato / PDF</span>
                </button>

                <button
                  onClick={() => handleSendWhatsAppVoucher(selectedReserva)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Voucher WhatsApp</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedReserva(null)}
                className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE FÓLIO / EXTRATO DE HOSPEDAGEM */}
      {folioReserva && (
        <GuestBillModal
          isOpen={!!folioReserva}
          onClose={() => setFolioReserva(null)}
          reserva={folioReserva}
          guest={guests.find((g) => g.id === folioReserva.hospede_id)}
          room={rooms.find((r) => r.id === folioReserva.quarto_id)}
          hotelConfig={hotelConfig}
          currentUser={currentUser}
          onConfirmCheckout={(res) => {
            updateReservationStatus(res.id, 'checkout_concluido', {
              checkoutTime: new Date().toISOString()
            });
            setFolioReserva(null);
            setSelectedReserva(null);
          }}
        />
      )}

      {/* MODAL PERSONALIZÁVEL DE RELATÓRIO E MAPA DE RESERVAS EM PDF */}
      {showCalendarReportModal && (
        <CalendarReportModal
          isOpen={showCalendarReportModal}
          onClose={() => setShowCalendarReportModal(false)}
          reservations={reservations}
          rooms={rooms}
          guests={guests}
          hotelConfig={hotelConfig}
          currentUser={currentUser}
        />
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE DISPARO DE MENSAGEM WHATSAPP */}
      {messagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <MessageSquare className="w-5 h-5" />
                <span>Simulador de Disparo de WhatsApp</span>
              </div>
              <button onClick={() => setMessagePreview(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-950">
              <span>Destinatário: <strong>{messagePreview.phone}</strong></span>
            </div>

            <div className="bg-stone-900 text-stone-100 p-4 rounded-xl text-xs font-sans whitespace-pre-line leading-relaxed border border-stone-800">
              {messagePreview.text}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={generateWhatsAppLink(messagePreview.phone, messagePreview.text)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold text-xs shadow-md"
              >
                Abrir WhatsApp Real
              </a>
              <button
                onClick={() => setMessagePreview(null)}
                className="px-4 py-2.5 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs"
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
