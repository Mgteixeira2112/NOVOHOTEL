import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Sliders, 
  Calendar as CalendarIcon, 
  Check, 
  Copy, 
  MessageSquare, 
  Mail, 
  FileText, 
  Eye, 
  Building2, 
  BedDouble, 
  User, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Reserva, Hospede, Quarto, HotelConfig } from '../../types';
import { formatCurrency, formatDateBR, formatDateTimeBR, formatPhone, generateWhatsAppLink } from '../../utils/formatters';

interface CalendarReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reserva[];
  rooms: Quarto[];
  guests: Hospede[];
  hotelConfig: HotelConfig;
  currentUser?: { nome: string; cargo_titulo?: string };
}

export const CalendarReportModal: React.FC<CalendarReportModalProps> = ({
  isOpen,
  onClose,
  reservations,
  rooms,
  guests,
  hotelConfig,
  currentUser = { nome: 'Alice Guimarães', cargo_titulo: 'Gerente Geral' },
}) => {
  // Preset de Períodos
  const [periodPreset, setPeriodPreset] = useState<'current_fortnight' | 'august_full' | 'next_7_days' | 'next_14_days' | 'september_full' | 'custom'>('current_fortnight');
  const [startDate, setStartDate] = useState('2026-08-15');
  const [endDate, setEndDate] = useState('2026-08-31');

  // Filtros de Acomodações
  const [floorFilter, setFloorFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(rooms.map((r) => r.id));

  // Filtro de Status
  const [includedStatuses, setIncludedStatuses] = useState<string[]>([
    'confirmada',
    'checkin_realizado',
    'checkout_concluido'
  ]);

  // Opções de Formato e Exibição do Relatório
  const [reportType, setReportType] = useState<'timeline' | 'table' | 'mixed'>('timeline');
  const [pageOrientation, setPageOrientation] = useState<'landscape' | 'portrait'>('landscape');
  
  // Itens de Personalização
  const [customTitle, setCustomTitle] = useState('Mapa de Ocupação & Calendário de Reservas');
  const [customNotes, setCustomNotes] = useState('Relatório oficial de ocupação emitido pelo PMS. Conferir preparações de governança e chegadas VIP.');
  const [showGuestNames, setShowGuestNames] = useState(true);
  const [showReservationCodes, setShowReservationCodes] = useState(true);
  const [showFinancials, setShowFinancials] = useState(true);
  const [showKpiHeader, setShowKpiHeader] = useState(true);
  const [showDailyOccupancyFooter, setShowDailyOccupancyFooter] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showSignatureBlock, setShowSignatureBlock] = useState(true);

  // Estados de Envio
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState(hotelConfig.email || 'gerencia@itajubaflathotel.com.br');
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  // Atualizador de Períodos Pré-definidos
  const handleSelectPreset = (preset: typeof periodPreset) => {
    setPeriodPreset(preset);
    if (preset === 'current_fortnight') {
      setStartDate('2026-08-15');
      setEndDate('2026-08-31');
    } else if (preset === 'august_full') {
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    } else if (preset === 'next_7_days') {
      setStartDate('2026-08-21');
      setEndDate('2026-08-28');
    } else if (preset === 'next_14_days') {
      setStartDate('2026-08-21');
      setEndDate('2026-09-04');
    } else if (preset === 'september_full') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    }
  };

  // Gerar Lista de Dias no Período Selecionado
  const dateList = useMemo(() => {
    const dates: string[] = [];
    if (!startDate || !endDate) return dates;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return dates;
    }

    const current = new Date(start);
    // Limite preventivo de 45 dias para performance do relatório
    let count = 0;
    while (current <= end && count < 45) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
      count++;
    }

    return dates;
  }, [startDate, endDate]);

  // Quartos Filtrados
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (floorFilter !== 'all' && String(r.andar) !== floorFilter) {
        return false;
      }
      return selectedRoomIds.includes(r.id);
    });
  }, [rooms, floorFilter, selectedRoomIds]);

  // Reservas Filtradas no Período e Critérios
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (!includedStatuses.includes(r.status)) return false;
      if (!selectedRoomIds.includes(r.quarto_id)) return false;

      // Verifica se a reserva cruza o período selecionado
      const overlaps = r.checkin <= endDate && r.checkout >= startDate;
      return overlaps;
    });
  }, [reservations, includedStatuses, selectedRoomIds, startDate, endDate]);

  // Cálculos de KPIs do Período
  const stats = useMemo(() => {
    const totalRoomNightsPossible = filteredRooms.length * Math.max(1, dateList.length);
    
    let occupiedRoomNights = 0;
    let totalRevenue = 0;
    let checkinCount = 0;
    let checkoutCount = 0;

    dateList.forEach((dateStr) => {
      filteredRooms.forEach((rm) => {
        const isOccupied = filteredReservations.some(
          (r) => r.quarto_id === rm.id && dateStr >= r.checkin && dateStr < r.checkout
        );
        if (isOccupied) occupiedRoomNights++;
      });
    });

    filteredReservations.forEach((r) => {
      totalRevenue += r.valor_total || 0;
      if (r.checkin >= startDate && r.checkin <= endDate) checkinCount++;
      if (r.checkout >= startDate && r.checkout <= endDate) checkoutCount++;
    });

    const occupancyRate = totalRoomNightsPossible > 0 
      ? Math.round((occupiedRoomNights / totalRoomNightsPossible) * 100) 
      : 0;

    return {
      occupancyRate,
      occupiedRoomNights,
      totalRoomNightsPossible,
      totalRevenue,
      checkinCount,
      checkoutCount,
      totalReservas: filteredReservations.length,
      totalRoomsCount: filteredRooms.length
    };
  }, [filteredRooms, dateList, filteredReservations, startDate, endDate]);

  if (!isOpen) return null;

  // Gerador de Resumo para WhatsApp
  const generateWhatsAppSummary = () => {
    return (
`🏨 *${hotelConfig.nome.toUpperCase()}*
📊 *RELATÓRIO DE OCUPAÇÃO & RESERVAS*
────────────────────────
📅 *Período:* ${formatDateBR(startDate)} a ${formatDateBR(endDate)} (${dateList.length} dias)
🏢 *Acomodações Monitoradas:* ${filteredRooms.length} quartos
📈 *Taxa de Ocupação Média:* *${stats.occupancyRate}%*
🛏️ *Diárias Ocupadas:* ${stats.occupiedRoomNights} de ${stats.totalRoomNightsPossible} disponíveis
🔑 *Check-ins no Período:* ${stats.checkinCount} | *Check-outs:* ${stats.checkoutCount}
💰 *Faturamento Estimado:* ${formatCurrency(stats.totalRevenue)}
────────────────────────
📋 *RESERVAS EM DESTAQUE:*
${filteredReservations.slice(0, 8).map((r) => {
  const g = guests.find((guest) => guest.id === r.hospede_id);
  const rm = rooms.find((room) => room.id === r.quarto_id);
  return `• ${g?.nome.split(' ')[0]} - Qto ${rm?.numero} (${formatDateBR(r.checkin)} a ${formatDateBR(r.checkout)}) - ${r.status.toUpperCase()}`;
}).join('\n')}
────────────────────────
Emitido por: ${currentUser.nome} em ${new Date().toLocaleDateString('pt-BR')}`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateWhatsAppSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) => 
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const toggleAllRooms = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(rooms.map((r) => r.id));
    }
  };

  const toggleStatus = (st: string) => {
    setIncludedStatuses((prev) => 
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 bg-stone-950/80 backdrop-blur-sm overflow-hidden animate-fade-in">
      <div className="bg-white rounded-none sm:rounded-3xl border border-stone-200 shadow-2xl w-full h-full sm:h-[96vh] max-w-7xl overflow-hidden flex flex-col">
        
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR DE AÇÕES E COMANDOS DO RELATÓRIO (NÃO IMPRIME)             */}
        {/* ========================================================================= */}
        <div className="no-print p-4 bg-stone-900 text-stone-100 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
                  Relatórios & PMS • Impressão em PDF
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono text-[10px] font-bold border border-stone-700">
                  {dateList.length} dias selecionados
                </span>
              </div>
              <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-stone-100">
                Personalizador de Mapa de Reservas & Calendário
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Botão Mobile para Abrir/Fechar Filtros */}
            <button
              onClick={() => setShowMobileSettings(!showMobileSettings)}
              className="sm:hidden px-3 py-2 rounded-xl bg-stone-800 text-stone-200 text-xs font-bold flex items-center gap-1.5 border border-stone-700"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Opções</span>
            </button>

            {/* Imprimir / Salvar em PDF */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Imprimir documento ou Salvar como PDF em modo Paisagem"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Enviar resumo executivo via WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* E-mail */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-stone-700 cursor-pointer"
              title="Enviar relatório por E-mail"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden md:inline">E-mail</span>
            </button>

            {/* Copiar Resumo */}
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-stone-700 cursor-pointer"
              title="Copiar texto estruturado"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden lg:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPO PRINCIPAL COM SIDEBAR DE PERSONALIZAÇÃO + PRÉ-VISUALIZAÇÃO AO VIVO  */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-stone-100">
          
          {/* ======================================================================= */}
          {/* PAINEL LATERAL DE PERSONALIZAÇÃO (NÃO IMPRIME)                          */}
          {/* ======================================================================= */}
          <div className={`no-print w-full lg:w-80 xl:w-96 bg-white border-r border-stone-200 overflow-y-auto p-4 sm:p-5 space-y-5 shrink-0 ${
            showMobileSettings ? 'block' : 'hidden lg:block'
          }`}>
            
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                Configurar Relatório
              </span>
              <button
                onClick={() => {
                  handleSelectPreset('current_fortnight');
                  setFloorFilter('all');
                  setSelectedRoomIds(rooms.map((r) => r.id));
                  setIncludedStatuses(['confirmada', 'checkin_realizado', 'checkout_concluido']);
                  setReportType('timeline');
                  setShowGuestNames(true);
                  setShowFinancials(true);
                }}
                className="text-[10px] text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1"
                title="Restaurar padrões"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            </div>

            {/* 1. SELEÇÃO DO PERÍODO & CALENDÁRIO */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                1. Período do Calendário
              </label>

              {/* Botões Rápidos */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('current_fortnight')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-left transition border ${
                    periodPreset === 'current_fortnight'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Quinzena Atual (15-31 Ago)
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('august_full')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-left transition border ${
                    periodPreset === 'august_full'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Mês Completo (Agosto)
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('next_7_days')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-left transition border ${
                    periodPreset === 'next_7_days'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Próximos 7 Dias
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('september_full')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-left transition border ${
                    periodPreset === 'september_full'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Setembro / 2026
                </button>
              </div>

              {/* Data Início e Fim */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Data Inicial:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPeriodPreset('custom');
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">Data Final:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPeriodPreset('custom');
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. FORMATO & TIPO DO RELATÓRIO */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-800">
                2. Formato & Visualização
              </label>

              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setReportType('timeline')}
                  className={`p-2 rounded-xl text-center font-bold border transition ${
                    reportType === 'timeline'
                      ? 'bg-stone-900 text-amber-400 border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5 mx-auto mb-1" />
                  <span>Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('mixed')}
                  className={`p-2 rounded-xl text-center font-bold border transition ${
                    reportType === 'mixed'
                      ? 'bg-stone-900 text-amber-400 border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 mx-auto mb-1" />
                  <span>Misto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('table')}
                  className={`p-2 rounded-xl text-center font-bold border transition ${
                    reportType === 'table'
                      ? 'bg-stone-900 text-amber-400 border-stone-900'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 mx-auto mb-1" />
                  <span>Tabela</span>
                </button>
              </div>

              {/* Orientação */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <span className="font-medium text-stone-700">Orientação no PDF:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPageOrientation('landscape')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pageOrientation === 'landscape' ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    Paisagem (Amplo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageOrientation('portrait')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pageOrientation === 'portrait' ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    Retrato
                  </button>
                </div>
              </div>
            </div>

            {/* 3. FILTRO DE QUARTOS & ANDAR */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800">
                  3. Acomodações ({selectedRoomIds.length}/{rooms.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAllRooms}
                  className="text-[10px] text-amber-700 font-bold hover:underline"
                >
                  {selectedRoomIds.length === rooms.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                </button>
              </div>

              {/* Filtro por Andar */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-stone-500">Andar:</span>
                {(['all', '1', '2', '3'] as const).map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setFloorFilter(fl)}
                    className={`px-2 py-0.5 rounded font-bold uppercase ${
                      floorFilter === fl ? 'bg-stone-800 text-amber-300' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {fl === 'all' ? 'Todos' : `${fl}º`}
                  </button>
                ))}
              </div>

              {/* Checkboxes de Quartos */}
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                {rooms.map((rm) => (
                  <label key={rm.id} className="flex items-center justify-between hover:bg-white p-1 rounded cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedRoomIds.includes(rm.id)}
                        onChange={() => toggleRoomSelection(rm.id)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-bold font-mono">#{rm.numero}</span>
                      <span className="text-stone-600 truncate max-w-[120px] text-[11px]">{rm.nome}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">{formatCurrency(rm.valor_diaria)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. STATUS INCLUÍDOS */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-800">
                4. Status das Reservas
              </label>

              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'confirmada', label: 'Confirmadas', color: 'bg-emerald-500' },
                  { id: 'checkin_realizado', label: 'Check-in Realizado (In-House)', color: 'bg-blue-600' },
                  { id: 'checkout_concluido', label: 'Check-out Concluído', color: 'bg-stone-500' },
                  { id: 'cancelada', label: 'Canceladas', color: 'bg-rose-500' }
                ].map((st) => (
                  <label key={st.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includedStatuses.includes(st.id)}
                      onChange={() => toggleStatus(st.id)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className={`w-2 h-2 rounded-full ${st.color}`} />
                    <span className="text-stone-700 text-xs">{st.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. ELEMENTOS VISUAIS & TEXTOS CUSTOMIZADOS */}
            <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
              <label className="block font-bold text-stone-800">
                5. Opções de Conteúdo & Impressão
              </label>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showKpiHeader}
                    onChange={(e) => setShowKpiHeader(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Indicadores de Ocupação & KPIs no topo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGuestNames}
                    onChange={(e) => setShowGuestNames(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Nome do Hóspede nos blocos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReservationCodes}
                    onChange={(e) => setShowReservationCodes(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Código da Reserva</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFinancials}
                    onChange={(e) => setShowFinancials(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Valores Financeiros e Diárias</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showDailyOccupancyFooter}
                    onChange={(e) => setShowDailyOccupancyFooter(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Linha de Ocupação Diária (%)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Legenda Explicativa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSignatureBlock}
                    onChange={(e) => setShowSignatureBlock(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span>Exibir Campo de Assinatura da Recepção / Gerência</span>
                </label>
              </div>

              {/* Título Customizado */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Título do Relatório:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Anotações para a Equipe */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Instruções / Anotações para a Equipe:
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

          </div>

          {/* ======================================================================= */}
          {/* ÁREA DE VISUALIZAÇÃO E IMPRESSÃO OFICIAL (#printable-calendar-report)  */}
          {/* ======================================================================= */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-stone-200/70" id="printable-calendar-report">
            <div className={`bg-white p-5 sm:p-8 rounded-2xl border border-stone-300 shadow-sm mx-auto space-y-5 text-stone-900 ${
              pageOrientation === 'landscape' ? 'max-w-[1250px]' : 'max-w-4xl'
            }`}>
              
              {/* 1. CABEÇALHO TIMBRADO OFICIAL DO HOTEL */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-stone-900 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-stone-950 text-amber-400 flex items-center justify-center font-serif-luxury font-black text-base">
                      {hotelConfig.nome.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-serif-luxury text-xl sm:text-2xl font-black text-stone-950 tracking-tight">
                        {hotelConfig.nome}
                      </h2>
                      <span className="text-[11px] text-stone-500 font-medium block">
                        {hotelConfig.razao_social || 'Itajubá Flat Hotel & Serviços Hoteleiros LTDA'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 space-y-0.5 pt-1">
                    <p>{hotelConfig.endereco}, {hotelConfig.bairro} • {hotelConfig.cidade} - {hotelConfig.estado}</p>
                    <p className="font-mono text-[11px]">
                      CNPJ: <strong>{hotelConfig.cnpj}</strong> • Tel: {hotelConfig.telefone} • {hotelConfig.email}
                    </p>
                  </div>
                </div>

                {/* Box de Identificação do Relatório */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-right sm:min-w-[240px] space-y-1 self-stretch sm:self-auto flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    {customTitle.toUpperCase()}
                  </span>
                  <div className="font-mono text-xs font-bold text-stone-900">
                    {formatDateBR(startDate)} a {formatDateBR(endDate)}
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    {dateList.length} dias analisados • {filteredRooms.length} acomodações
                  </span>
                  <div className="text-[9px] text-stone-500 border-t border-stone-200 pt-1 mt-1">
                    <span>Emissão: </span>
                    <strong className="font-mono text-stone-800">
                      {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                    <span className="block">Operador: <strong>{currentUser.nome}</strong></span>
                  </div>
                </div>
              </div>

              {/* 2. PAINEL DE INDICADORES & KPIS DO PERÍODO (SE ATIVADO) */}
              {showKpiHeader && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-stone-200/80">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Ocupação Média</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black font-mono text-amber-800">{stats.occupancyRate}%</span>
                      <span className="text-[10px] text-stone-500">do período</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-stone-200/80">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Diárias Reservadas</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-lg font-black font-mono text-stone-900">{stats.occupiedRoomNights}</span>
                      <span className="text-[10px] text-stone-500">/ {stats.totalRoomNightsPossible} disp.</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-stone-200/80">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Check-ins Previstos</span>
                    <div className="mt-0.5">
                      <span className="text-lg font-black font-mono text-blue-700">{stats.checkinCount}</span>
                      <span className="text-[10px] text-stone-500 ml-1">chegadas</span>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-stone-200/80">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">Check-outs Previstos</span>
                    <div className="mt-0.5">
                      <span className="text-lg font-black font-mono text-stone-700">{stats.checkoutCount}</span>
                      <span className="text-[10px] text-stone-500 ml-1">saídas</span>
                    </div>
                  </div>

                  {showFinancials ? (
                    <div className="p-2 bg-stone-900 text-stone-100 rounded-lg border border-stone-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">Faturamento Est.</span>
                      <div className="mt-0.5">
                        <span className="text-base font-black font-mono text-amber-300 truncate block">
                          {formatCurrency(stats.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-white rounded-lg border border-stone-200/80">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Total Reservas</span>
                      <div className="mt-0.5">
                        <span className="text-lg font-black font-mono text-stone-900">{stats.totalReservas}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. VISUALIZAÇÃO DA TIMELINE MATRICIAL (MAPA GRÁFICO DE CALENDÁRIO) */}
              {(reportType === 'timeline' || reportType === 'mixed') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                      Grade Matricial de Ocupação por Quarto
                    </h4>
                    <span className="text-[10px] text-stone-500">
                      {dateList.length} colunas diárias • Hoje: 21/08/2026
                    </span>
                  </div>

                  <div className="border border-stone-300 rounded-xl overflow-x-auto bg-white">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      
                      {/* Cabeçalho dos Dias */}
                      <thead className="bg-stone-100 border-b border-stone-300 text-stone-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-stone-300 min-w-[140px] sticky left-0 bg-stone-100 z-10">
                            Acomodação
                          </th>
                          {dateList.map((d) => {
                            const dayNum = d.split('-')[2];
                            const dateObj = new Date(`${d}T12:00:00`);
                            const weekDay = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dateObj.getDay()];
                            const isToday = d === '2026-08-21';

                            return (
                              <th
                                key={d}
                                className={`py-1.5 px-1 text-center border-r border-stone-300 min-w-[34px] ${
                                  isToday ? 'bg-amber-200 text-amber-950 font-black' : ''
                                }`}
                              >
                                <span className="block text-[11px] font-mono">{dayNum}</span>
                                <span className="block text-[8px] font-normal text-stone-500">{weekDay}</span>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* Linhas por Quarto */}
                      <tbody className="divide-y divide-stone-200 text-[11px]">
                        {filteredRooms.map((rm) => {
                          const roomRes = filteredReservations.filter((r) => r.quarto_id === rm.id);

                          return (
                            <tr key={rm.id} className="hover:bg-stone-50/70">
                              
                              {/* Identificação do Quarto */}
                              <td className="py-2 px-3 border-r border-stone-300 font-semibold sticky left-0 bg-white z-10">
                                <div className="flex items-center justify-between gap-1">
                                  <div>
                                    <span className="font-mono font-bold text-stone-900 block">
                                      #{rm.numero}
                                    </span>
                                    <span className="text-[10px] text-stone-500 truncate block max-w-[110px]">
                                      {rm.nome}
                                    </span>
                                  </div>
                                  {showFinancials && (
                                    <span className="text-[9px] font-mono text-stone-400">
                                      {formatCurrency(rm.valor_diaria)}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Células Diárias */}
                              {dateList.map((d) => {
                                const resForDay = roomRes.find((r) => d >= r.checkin && d < r.checkout);
                                const isToday = d === '2026-08-21';
                                const guest = resForDay ? guests.find((g) => g.id === resForDay.hospede_id) : null;
                                const isStart = resForDay && d === resForDay.checkin;

                                let bgClass = '';
                                if (resForDay) {
                                  if (resForDay.status === 'checkin_realizado') {
                                    bgClass = 'bg-blue-700 text-white';
                                  } else if (resForDay.status === 'confirmada') {
                                    bgClass = 'bg-emerald-700 text-white';
                                  } else if (resForDay.status === 'checkout_concluido') {
                                    bgClass = 'bg-stone-600 text-white';
                                  } else {
                                    bgClass = 'bg-rose-600 text-white';
                                  }
                                }

                                return (
                                  <td
                                    key={d}
                                    className={`p-0.5 text-center border-r border-stone-200 relative ${
                                      isToday ? 'bg-amber-50/50' : ''
                                    }`}
                                  >
                                    {resForDay ? (
                                      <div
                                        className={`w-full h-8 rounded flex flex-col items-center justify-center font-bold px-0.5 ${bgClass}`}
                                        title={`${guest?.nome} (${resForDay.codigo})`}
                                      >
                                        {isStart || dateList.indexOf(d) === 0 ? (
                                          <div className="leading-tight overflow-hidden text-center">
                                            {showGuestNames && (
                                              <span className="text-[8px] font-bold block truncate max-w-[32px]">
                                                {guest?.nome.split(' ')[0]}
                                              </span>
                                            )}
                                            {showReservationCodes && (
                                              <span className="text-[7px] font-mono opacity-90 block">
                                                {resForDay.codigo.split('-')[1] || resForDay.codigo}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full h-8 flex items-center justify-center text-stone-300 text-[9px]">
                                        ·
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                            </tr>
                          );
                        })}

                        {/* Linha de Ocupação Diária no Rodapé do Mapa */}
                        {showDailyOccupancyFooter && (
                          <tr className="bg-stone-100 font-bold border-t-2 border-stone-300 text-[10px]">
                            <td className="py-2 px-3 border-r border-stone-300 text-stone-800 uppercase sticky left-0 bg-stone-100 z-10">
                              Ocupação Diária (%)
                            </td>
                            {dateList.map((d) => {
                              const occupiedCount = filteredRooms.filter((rm) =>
                                filteredReservations.some(
                                  (r) => r.quarto_id === rm.id && d >= r.checkin && d < r.checkout
                                )
                              ).length;

                              const percent = filteredRooms.length > 0
                                ? Math.round((occupiedCount / filteredRooms.length) * 100)
                                : 0;

                              const isToday = d === '2026-08-21';

                              return (
                                <td
                                  key={d}
                                  className={`py-1.5 px-0.5 text-center border-r border-stone-300 font-mono text-[9px] ${
                                    isToday ? 'bg-amber-200 font-black text-amber-950' : ''
                                  } ${percent >= 80 ? 'text-emerald-800 font-bold' : 'text-stone-700'}`}
                                >
                                  <span>{percent}%</span>
                                  <span className="block text-[7px] text-stone-500 font-normal">
                                    {occupiedCount}/{filteredRooms.length}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        )}

                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. TABELA CRONOLÓGICA DE RESERVAS DO PERÍODO */}
              {(reportType === 'table' || reportType === 'mixed') && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-700" />
                      Listagem Sintética de Reservas Contempladas ({filteredReservations.length})
                    </h4>
                    <span className="text-[10px] text-stone-500">Valores em Reais (BRL)</span>
                  </div>

                  <div className="border border-stone-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] border-b border-stone-300">
                        <tr>
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Hóspede</th>
                          <th className="py-2 px-3">Acomodação</th>
                          <th className="py-2 px-3">Período / Noites</th>
                          {showFinancials && <th className="py-2 px-3 text-right">Valor Total</th>}
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">PIN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 text-stone-800">
                        {filteredReservations.map((res) => {
                          const guest = guests.find((g) => g.id === res.hospede_id);
                          const room = rooms.find((r) => r.id === res.quarto_id);
                          
                          const cin = new Date(res.checkin);
                          const cout = new Date(res.checkout);
                          const nights = Math.max(1, Math.ceil(Math.abs(cout.getTime() - cin.getTime()) / (1000 * 3600 * 24)));

                          return (
                            <tr key={res.id} className="hover:bg-stone-50/70">
                              <td className="py-2 px-3 font-mono font-bold text-stone-900 text-[11px]">
                                {res.codigo}
                              </td>
                              <td className="py-2 px-3">
                                <strong className="text-stone-900 block">{guest?.nome}</strong>
                                <span className="text-[10px] text-stone-500">{formatPhone(guest?.telefone || '')}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-stone-800 block">Qto #{room?.numero}</span>
                                <span className="text-[10px] text-stone-500">{room?.nome}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-mono text-stone-900 block text-[11px]">
                                  {formatDateBR(res.checkin)} a {formatDateBR(res.checkout)}
                                </span>
                                <span className="text-[10px] text-stone-500">{nights} noites • {res.quantidade_hospedes} hóspede(s)</span>
                              </td>
                              {showFinancials && (
                                <td className="py-2 px-3 text-right font-mono font-bold text-stone-950 text-[11px]">
                                  {formatCurrency(res.valor_total)}
                                </td>
                              )}
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
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
                              <td className="py-2 px-3 font-mono text-[11px] text-amber-800 font-bold">
                                {res.pin_fechadura}#
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. LEGENDA & INSTRUÇÕES DA GERÊNCIA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200 text-xs">
                
                {/* Legenda */}
                {showLegend && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-stone-700 block">
                      Legenda do Calendário
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-blue-700 shrink-0" />
                        <span>Check-in Realizado (In-House)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-700 shrink-0" />
                        <span>Reserva Confirmada</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-stone-600 shrink-0" />
                        <span>Check-out Concluído</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400 shrink-0" />
                        <span>Dia Atual / Hoje</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anotações Customizadas */}
                {customNotes && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-stone-700 block">
                      Observações da Gerência & Instruções
                    </span>
                    <p className="text-[11px] text-stone-600 italic leading-relaxed">
                      "{customNotes}"
                    </p>
                  </div>
                )}

              </div>

              {/* 6. QUADRO DE ASSINATURA & CARIMBO (SE ATIVADO) */}
              {showSignatureBlock && (
                <div className="pt-6 border-t border-stone-200">
                  <div className="grid grid-cols-2 gap-8 text-center text-xs text-stone-700">
                    <div className="space-y-1">
                      <div className="border-b border-stone-400 w-3/4 mx-auto pb-1"></div>
                      <strong className="block text-stone-900">{currentUser.nome}</strong>
                      <span className="text-[10px] text-stone-500">{currentUser.cargo_titulo || 'Gerência Geral'} • {hotelConfig.nome}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="border-b border-stone-400 w-3/4 mx-auto pb-1"></div>
                      <strong className="block text-stone-900">Coordenação de Recepção & Governança</strong>
                      <span className="text-[10px] text-stone-500">Visto e Conferência de Ocupação</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RODAPÉ INFERIOR DO MODAL (NÃO IMPRIME)                                    */}
        {/* ========================================================================= */}
        <div className="no-print p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Relatório customizável de ocupação, compatível com formato A4 (Paisagem ou Retrato).</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Voltar
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL WHATSAPP                                                        */}
      {/* ========================================================================= */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageSquare className="w-5 h-5" />
                <h4 className="font-bold text-stone-900 text-base">Enviar Resumo do Mapa via WhatsApp</h4>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-stone-600">
                Compartilhe com a diretoria ou equipe de recepção o resumo executivo do período selecionado ({formatDateBR(startDate)} a {formatDateBR(endDate)}):
              </p>

              <textarea
                rows={8}
                readOnly
                value={generateWhatsAppSummary()}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs text-stone-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateWhatsAppSummary());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={() => {
                  const link = generateWhatsAppLink('(35) 99123-4567', generateWhatsAppSummary());
                  window.open(link, '_blank');
                  setShowWhatsAppModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL E-MAIL                                                          */}
      {/* ========================================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-900">
                <Mail className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-stone-900 text-base">Enviar Relatório por E-mail</h4>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>

            {emailSentNotice ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h5 className="font-bold text-emerald-900 text-sm">E-mail Enviado!</h5>
                <p className="text-xs text-emerald-700">
                  O relatório de ocupação do período foi enviado com sucesso para <strong>{emailTo}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Destinatário (Gerência/Diretoria):</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="gerencia@hotel.com.br"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-bold block">📄 Relatório anexado:</span>
                  <span className="text-[11px] font-mono">
                    Mapa_Reservas_Calendario_{startDate}_a_{endDate}.pdf
                  </span>
                </div>
              </div>
            )}

            {!emailSentNotice && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold"
                >
                  Cancelar
                </button>

                <button
                  onClick={() => {
                    const subject = encodeURIComponent(`[${hotelConfig.nome}] ${customTitle} (${formatDateBR(startDate)} a ${formatDateBR(endDate)})`);
                    const body = encodeURIComponent(generateWhatsAppSummary());
                    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir App de E-mail</span>
                </button>

                <button
                  onClick={() => {
                    setEmailSentNotice(true);
                    setTimeout(() => {
                      setEmailSentNotice(false);
                      setShowEmailModal(false);
                    }, 2000);
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar E-mail com Relatório</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
