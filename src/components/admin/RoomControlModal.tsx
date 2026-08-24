import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { useFrigobar } from '../../context/FrigobarContext';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Quarto, 
  RoomStatus, 
  HousekeepingStatus, 
  Reserva, 
  Hospede 
} from '../../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Wrench, 
  Lock, 
  Key, 
  ShoppingBag, 
  Users, 
  BedDouble, 
  Phone, 
  MessageSquare, 
  RefreshCw, 
  Plus, 
  Minus, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  BatteryCharging, 
  Wifi, 
  Send, 
  Copy, 
  Check, 
  ArrowRight,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Printer,
  Mail,
  FileText
} from 'lucide-react';
import { GuestBillModal } from './GuestBillModal';

interface RoomControlModalProps {
  room: Quarto;
  isOpen: boolean;
  onClose: () => void;
  onNavigateRoom?: (direction: 'prev' | 'next') => void;
  hasPrevRoom?: boolean;
  hasNextRoom?: boolean;
  onOpenAuditModal?: (roomNumero: string) => void;
}

type TabType = 'geral' | 'frigobar' | 'fechadura' | 'hospede' | 'detalhes';

export const RoomControlModal: React.FC<RoomControlModalProps> = ({
  room,
  isOpen,
  onClose,
  onNavigateRoom,
  hasPrevRoom = false,
  hasNextRoom = false,
  onOpenAuditModal
}) => {
  const { 
    rooms, 
    roomTypes, 
    reservations, 
    guests, 
    setRoomStatus, 
    updateRoom, 
    updateReservationStatus,
    openBookingWithRoom,
    currentUser,
    hotelConfig,
    setAdminActiveTab
  } = useHotel();

  const { 
    getRoomMinibarSummary, 
    quickRestockRoom, 
    quickConsumeItem,
    getGuestPreference,
    saveGuestPreference
  } = useFrigobar();

  const [activeTab, setActiveTab] = useState<TabType>('geral');
  const [copiedPin, setCopiedPin] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Edição de Fechadura PIN
  const [customPin, setCustomPin] = useState(room.fechadura_pin || '1234');
  const [isEditingPin, setIsEditingPin] = useState(false);

  // Manutenção e Governança
  const [motivoManutencao, setMotivoManutencao] = useState(room.status_manutencao_motivo || '');
  const [notasInternas, setNotasInternas] = useState(room.notas_internas || '');

  // Lançador de consumo rápido no modal
  const [consumoQuantities, setConsumoQuantities] = useState<Record<string, number>>({});
  const [showFolioModal, setShowFolioModal] = useState(false);

  if (!isOpen) return null;

  const roomType = roomTypes.find((t) => t.id === room.tipo_quarto_id);
  const activeReservation = reservations.find(
    (r) => r.quarto_id === room.id && r.status === 'checkin_realizado'
  );
  const guest = activeReservation ? guests.find((g) => g.id === activeReservation.hospede_id) : null;
  const guestPref = guest ? getGuestPreference(guest.id) : undefined;

  // Próxima reserva agendada se o quarto estiver livre
  const upcomingReservations = reservations
    .filter((r) => r.quarto_id === room.id && (r.status === 'confirmada' || r.status === 'pendente'))
    .sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime());

  // Resumo de Frigobar
  const minibarSummary = getRoomMinibarSummary(room.numero);

  // Copiar PIN
  const handleCopyPin = () => {
    if (room.fechadura_pin) {
      navigator.clipboard.writeText(`${room.fechadura_pin}#`);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  // Gerar Novo PIN
  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    updateRoom(room.id, { fechadura_pin: randomPin });
    setCustomPin(randomPin);
    setFeedbackMessage(`Novo PIN ${randomPin}# gerado e ativado com sucesso.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Salvar PIN Customizado
  const handleSaveCustomPin = () => {
    if (customPin.length >= 4) {
      updateRoom(room.id, { fechadura_pin: customPin });
      setIsEditingPin(false);
      setFeedbackMessage(`PIN ${customPin}# salvo na fechadura.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Enviar PIN via WhatsApp
  const handleSendPinWhatsapp = () => {
    if (!guest) return;
    const phoneClean = guest.telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá, ${guest.nome}! 👋\n\n` +
      `Seu acesso ao *Itajubá Flat Hotel* para a acomodação *Quarto ${room.numero} (${room.nome})* está liberado!\n\n` +
      `🔑 *Senha da Fechadura Digital:* ${room.fechadura_pin || '1234'}#\n` +
      `📶 *Wi-Fi:* ItajubaFlat_Hospedes (Senha: flat2026)\n\n` +
      `Desejamos uma excelente estadia! Qualquer dúvida, estamos à disposição 24h na recepção.`
    );
    window.open(`https://wa.me/55${phoneClean}?text=${msg}`, '_blank');
  };

  // Abertura Remota
  const handleRemoteUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsUnlocking(false);
      setUnlockSuccess(true);
      setTimeout(() => setUnlockSuccess(false), 3000);
    }, 1200);
  };

  // Alterar Status Operacional
  const handleSetStatus = (newStatus: RoomStatus) => {
    const updateData: Partial<Quarto> = { status: newStatus };
    if (newStatus === 'disponivel') {
      updateData.status_governanca = 'limpo';
    } else if (newStatus === 'limpeza') {
      updateData.status_governanca = 'em_limpeza';
    } else if (newStatus === 'vistoria') {
      updateData.status_governanca = 'inspecionado';
    }
    updateRoom(room.id, updateData);
    setFeedbackMessage(`Status do quarto alterado para: ${newStatus.toUpperCase()}`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  // Alterar Status de Governança
  const handleSetHousekeeping = (hkStatus: HousekeepingStatus) => {
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const updateData: Partial<Quarto> = {
      status_governanca: hkStatus,
      ultima_limpeza: `${new Date().toLocaleDateString('pt-BR')} às ${nowStr}`,
      responsavel_limpeza: currentUser?.nome || 'Governança'
    };

    if (hkStatus === 'limpo' || hkStatus === 'inspecionado') {
      if (room.status === 'limpeza') {
        updateData.status = hkStatus === 'inspecionado' ? 'vistoria' : 'disponivel';
      }
    } else if (hkStatus === 'em_limpeza' || hkStatus === 'sujo') {
      if (room.status === 'disponivel') {
        updateData.status = 'limpeza';
      }
    }

    updateRoom(room.id, updateData);
    setFeedbackMessage(`Governança atualizada para: ${hkStatus.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  // Salvar Notas
  const handleSaveNotes = () => {
    updateRoom(room.id, {
      status_manutencao_motivo: motivoManutencao,
      notas_internas: notasInternas
    });
    setFeedbackMessage('Notas e ocorrências do quarto salvas com sucesso.');
    setTimeout(() => setFeedbackMessage(null), 2500);
  };

  // Reposição Rápida de Frigobar (1-clique)
  const handleQuickRestock = () => {
    const res = quickRestockRoom(room.numero, currentUser?.nome);
    setFeedbackMessage(res.message);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Alterar contador de consumo
  const handleUpdateConsumoQty = (prodId: string, delta: number, maxStock: number) => {
    setConsumoQuantities((prev) => {
      const current = prev[prodId] || 0;
      const next = Math.max(0, Math.min(maxStock, current + delta));
      return { ...prev, [prodId]: next };
    });
  };

  // Lançar Consumos Selecionados
  const handleConfirmConsumo = () => {
    let totalLanded = 0;
    (Object.entries(consumoQuantities) as [string, number][]).forEach(([prodId, qty]) => {
      if (qty > 0) {
        quickConsumeItem(
          room.numero,
          prodId,
          qty,
          activeReservation?.id,
          guest?.id,
          currentUser?.nome
        );
        totalLanded += qty;
      }
    });

    setConsumoQuantities({});
    setFeedbackMessage(`Consumo de ${totalLanded} item(ns) lançado no Quarto ${room.numero} e debitado na reserva.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Total acumulado do consumo selecionado
  const totalConsumoCalculado = (Object.entries(consumoQuantities) as [string, number][]).reduce((acc, [prodId, qty]) => {
    const item = minibarSummary.itemsList.find((i) => i.product.id === prodId);
    return acc + (item ? item.product.preco_venda * qty : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABEÇALHO DO QUARTO & NAVEGAÇÃO */}
        <div className="bg-stone-900 text-stone-100 p-5 sm:p-6 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Navegadores de Quarto */}
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl">
              <button
                disabled={!hasPrevRoom}
                onClick={() => onNavigateRoom && onNavigateRoom('prev')}
                className="p-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-stone-300"
                title="Quarto Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!hasNextRoom}
                onClick={() => onNavigateRoom && onNavigateRoom('next')}
                className="p-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition text-stone-300"
                title="Próximo Quarto"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tracking-tight">
                  Quarto {room.numero}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {roomType?.nome || 'Apart-Hotel'} • {room.andar}º Andar
                </span>
              </div>
              <span className="text-xs text-stone-400 font-medium">
                {room.nome} • Diária Padrão: {formatCurrency(room.valor_diaria)} • Até {room.capacidade} hóspedes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {room.status === 'disponivel' && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Disponível
                </span>
              )}
              {room.status === 'ocupado' && (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Ocupado (In-House)
                </span>
              )}
              {room.status === 'limpeza' && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                  Em Limpeza
                </span>
              )}
              {room.status === 'vistoria' && (
                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Vistoria / Inspecionado
                </span>
              )}
              {room.status === 'manutencao' && (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-rose-400" />
                  Em Manutenção
                </span>
              )}
              {room.status === 'bloqueado' && (
                <span className="px-3 py-1 rounded-full bg-stone-700 text-stone-300 text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Interditado
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERTA SE HOUVER */}
        {feedbackMessage && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {feedbackMessage}
            </span>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-200 hover:text-white">✕</button>
          </div>
        )}

        {/* ABAS DO CENTRO DE CONTROLE DO QUARTO */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('geral')}
            className={`py-3 px-3.5 font-bold text-xs border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'geral'
                ? 'border-amber-600 text-amber-900 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BedDouble className="w-4 h-4 text-amber-600" />
            <span>Status & Governança</span>
          </button>

          <button
            onClick={() => setActiveTab('frigobar')}
            className={`py-3 px-3.5 font-bold text-xs border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'frigobar'
                ? 'border-amber-600 text-amber-900 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Frigobar Integrado</span>
            {minibarSummary.needsRestock ? (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                {minibarSummary.missingCount} pendentes
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                100% OK
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('fechadura')}
            className={`py-3 px-3.5 font-bold text-xs border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'fechadura'
                ? 'border-amber-600 text-amber-900 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Key className="w-4 h-4 text-emerald-600" />
            <span>Fechadura & Acessos</span>
            <span className="font-mono text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-bold">
              {room.fechadura_pin || '1234'}#
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hospede')}
            className={`py-3 px-3.5 font-bold text-xs border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'hospede'
                ? 'border-amber-600 text-amber-900 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>{guest ? `Hóspede: ${guest.nome.split(' ')[0]}` : 'Hóspede / Reservas'}</span>
            {guest && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('detalhes')}
            className={`py-3 px-3.5 font-bold text-xs border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'detalhes'
                ? 'border-amber-600 text-amber-900 bg-white shadow-sm rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Info className="w-4 h-4 text-stone-600" />
            <span>Ficha & Equipamentos</span>
          </button>
        </div>

        {/* CORPO PRINCIPAL COM CONTEÚDO DA ABA SELECIONADA */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* ABA 1: STATUS GERAL & GOVERNANÇA                                          */}
          {/* ========================================================================= */}
          {activeTab === 'geral' && (
            <div className="space-y-6">
              
              {/* Seleção Rápida de Status Operacional */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-amber-600" />
                      Status Operacional da Acomodação
                    </h4>
                    <p className="text-xs text-stone-500">
                      Defina a disponibilidade para recepção e motor de reservas.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-stone-400">
                    Status Atual: <strong className="text-stone-900 uppercase">{room.status}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  
                  {/* Disponível */}
                  <button
                    onClick={() => handleSetStatus('disponivel')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                      room.status === 'disponivel'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm ring-2 ring-emerald-400/30'
                        : 'border-stone-200 hover:border-emerald-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      {room.status === 'disponivel' && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Disponível</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Pronto p/ venda</span>
                    </div>
                  </button>

                  {/* Ocupado */}
                  <button
                    onClick={() => handleSetStatus('ocupado')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                      room.status === 'ocupado'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-sm ring-2 ring-blue-400/30'
                        : 'border-stone-200 hover:border-blue-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      {room.status === 'ocupado' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Ocupado</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Hóspede in-house</span>
                    </div>
                  </button>

                  {/* Em Limpeza */}
                  <button
                    onClick={() => handleSetStatus('limpeza')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                      room.status === 'limpeza'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm ring-2 ring-amber-400/30'
                        : 'border-stone-200 hover:border-amber-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      {room.status === 'limpeza' && <Check className="w-4 h-4 text-amber-600 font-bold" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Em Limpeza</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Governança ativa</span>
                    </div>
                  </button>

                  {/* Vistoria / Inspecionado */}
                  <button
                    onClick={() => handleSetStatus('vistoria')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                      room.status === 'vistoria'
                        ? 'border-teal-500 bg-teal-50 text-teal-950 shadow-sm ring-2 ring-teal-400/30'
                        : 'border-stone-200 hover:border-teal-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      {room.status === 'vistoria' && <Check className="w-4 h-4 text-teal-600 font-bold" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Vistoriado</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Inspecionado OK</span>
                    </div>
                  </button>

                  {/* Em Manutenção */}
                  <button
                    onClick={() => handleSetStatus('manutencao')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                      room.status === 'manutencao'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 shadow-sm ring-2 ring-rose-400/30'
                        : 'border-stone-200 hover:border-rose-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Wrench className="w-4 h-4 text-rose-600" />
                      {room.status === 'manutencao' && <Check className="w-4 h-4 text-rose-600 font-bold" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Manutenção</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Reparo técnico</span>
                    </div>
                  </button>

                  {/* Bloqueado */}
                  <button
                    onClick={() => handleSetStatus('bloqueado')}
                    className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 ${
                      room.status === 'bloqueado'
                        ? 'border-stone-700 bg-stone-100 text-stone-950 shadow-sm'
                        : 'border-stone-200 hover:border-stone-400 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Lock className="w-4 h-4 text-stone-600" />
                      {room.status === 'bloqueado' && <Check className="w-4 h-4 text-stone-700 font-bold" />}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">Interditado</span>
                      <span className="text-[10px] text-stone-500 block leading-tight">Fora de venda</span>
                    </div>
                  </button>

                </div>
              </div>

              {/* Governança & Housekeeping Detalhado */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Status de Arrumação & Higienização (Governança)
                    </h5>
                    <span className="text-xs text-stone-500">
                      Última limpeza: <strong>{room.ultima_limpeza || 'Hoje às 08:30'}</strong> por <strong>{room.responsavel_limpeza || 'Maria Silva (Governança)'}</strong>
                    </span>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800">
                    Governança: <strong className="text-amber-800 uppercase">{(room.status_governanca || 'limpo').replace('_', ' ')}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => handleSetHousekeeping('limpo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      room.status_governanca === 'limpo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-emerald-50'
                    }`}
                  >
                    ✓ Limpo
                  </button>

                  <button
                    onClick={() => handleSetHousekeeping('sujo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      room.status_governanca === 'sujo'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-amber-50'
                    }`}
                  >
                    🧹 Sujo / Pendente
                  </button>

                  <button
                    onClick={() => handleSetHousekeeping('em_limpeza')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      room.status_governanca === 'em_limpeza'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-blue-50'
                    }`}
                  >
                    ⏳ Em Arrumação
                  </button>

                  <button
                    onClick={() => handleSetHousekeeping('inspecionado')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      room.status_governanca === 'inspecionado'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-teal-50'
                    }`}
                  >
                    ★ Inspecionado
                  </button>

                  <button
                    onClick={() => handleSetHousekeeping('nao_perturbe')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      room.status_governanca === 'nao_perturbe'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-purple-50'
                    }`}
                  >
                    🚫 Não Perturbe
                  </button>
                </div>
              </div>

              {/* Registro de Ocorrências & Manutenção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase">
                    Motivo / Chamado de Manutenção:
                  </label>
                  <input
                    type="text"
                    value={motivoManutencao}
                    onChange={(e) => setMotivoManutencao(e.target.value)}
                    placeholder="Ex: Ar condicionado sem gelar, trocar lâmpada..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase">
                    Notas Internas / Preferências do Quarto:
                  </label>
                  <input
                    type="text"
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    placeholder="Ex: Hóspede alérgico a penas, travesseiro extra..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveNotes}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Salvar Observações do Quarto
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: FRIGOBAR INTEGRADO AO QUARTO                                       */}
          {/* ========================================================================= */}
          {activeTab === 'frigobar' && (
            <div className="space-y-6">
              
              {/* Banner de Status do Frigobar */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-stone-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-stone-900 text-base">
                      Frigobar da Acomodação {room.numero}
                    </h4>
                    {minibarSummary.isFullyStocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                        100% ABASTECIDO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                        {minibarSummary.missingCount} ITENS FALTANTES
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Estoque alocado: {minibarSummary.totalItemsCurrent} de {minibarSummary.totalItemsTarget} itens ({minibarSummary.percentage}% preenchido) • Valor total de venda: {formatCurrency(minibarSummary.totalValueAtSell)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuickRestock}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Repor 100% Agora</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenAuditModal) {
                        onOpenAuditModal(room.numero);
                      } else {
                        setAdminActiveTab('frigobar');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-600" />
                    <span>Auditoria Completa</span>
                  </button>
                </div>
              </div>

              {/* Lançamento Rápido de Consumo no Quarto */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <h5 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                      Mix de Produtos do Frigobar ({minibarSummary.itemsList.length} itens cadastrados)
                    </h5>
                    <p className="text-xs text-stone-500">
                      Use os botões de (+) para registrar itens consumidos pelo hóspede e debitar no fólio da reserva.
                    </p>
                  </div>

                  {activeReservation && guest && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900">
                      Débito automático em: <strong>{guest.nome}</strong> ({activeReservation.codigo})
                    </span>
                  )}
                </div>

                {/* Grade de Itens do Frigobar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {minibarSummary.itemsList.map((item) => {
                    const selectedQty = consumoQuantities[item.product.id] || 0;

                    return (
                      <div
                        key={item.product.id}
                        className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                          selectedQty > 0
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                            : item.missing > 0
                            ? 'bg-stone-50/60 border-stone-200'
                            : 'bg-white border-stone-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                              {item.product.codigo}
                            </span>
                            <strong className="text-xs text-stone-900 block leading-tight">
                              {item.product.nome}
                            </strong>
                            <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                              {formatCurrency(item.product.preco_venda)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-stone-700 block">
                              {item.current} / {item.target} un
                            </span>
                            {item.missing > 0 ? (
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                                -{item.missing} faltam
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                Completo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper de Consumo */}
                        <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between">
                          <span className="text-[11px] text-stone-500 font-medium">
                            Lançar consumo:
                          </span>

                          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => handleUpdateConsumoQty(item.product.id, -1, item.current)}
                              disabled={selectedQty === 0}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 disabled:opacity-30 flex items-center justify-center text-stone-800 text-xs font-bold transition shadow-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="font-mono text-xs font-black text-stone-900 w-5 text-center">
                              {selectedQty}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleUpdateConsumoQty(item.product.id, 1, item.current)}
                              disabled={item.current === 0 || selectedQty >= item.current}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-amber-200 disabled:opacity-30 flex items-center justify-center text-stone-800 text-xs font-bold transition shadow-xs"
                            >
                              <Plus className="w-3 h-3 text-amber-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Barra de Confirmação de Consumo se houver itens selecionados */}
                {totalConsumoCalculado > 0 && (
                  <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
                    <div>
                      <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                        Subtotal de Consumo Selecionado
                      </span>
                      <span className="text-xl font-bold font-mono">
                        {formatCurrency(totalConsumoCalculado)}
                      </span>
                    </div>

                    <button
                      onClick={handleConfirmConsumo}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Confirmar & Debitar na Reserva</span>
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: FECHADURA DIGITAL & CONTROLE DE ACESSOS                            */}
          {/* ========================================================================= */}
          {activeTab === 'fechadura' && (
            <div className="space-y-6">
              
              {/* Display Principal do PIN da Fechadura */}
              <div className="p-6 rounded-3xl bg-stone-900 text-stone-100 border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center md:justify-start gap-1.5">
                    <Lock className="w-4 h-4" />
                    Fechadura Eletrônica Inteligente
                  </span>
                  <h4 className="text-xl font-bold font-serif-luxury">
                    Senha de Acesso Digital do Quarto {room.numero}
                  </h4>
                  <p className="text-xs text-stone-400 max-w-md">
                    Senha numérica criptografada vinculada à fechadura do quarto. O hóspede deve digitar o código seguido da tecla # no teclado físico.
                  </p>
                </div>

                {/* Display Numérico */}
                <div className="flex flex-col items-center gap-3">
                  <div className="px-6 py-4 rounded-2xl bg-stone-950 border border-amber-500/40 shadow-inner flex items-center gap-3">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-widest">
                      {room.fechadura_pin || '1234'}#
                    </span>
                    <button
                      onClick={handleCopyPin}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                      title="Copiar PIN"
                    >
                      {copiedPin ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      Bateria: {room.fechadura_bateria || 94}%
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-blue-400" />
                      Status: Online (Gateway Mesh)
                    </span>
                  </div>
                </div>
              </div>

              {/* Ações de Gestão de Senha & Abertura Remota */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Gerar Novo PIN */}
                <button
                  onClick={handleGenerateRandomPin}
                  className="p-4 rounded-2xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-stone-50 transition flex flex-col justify-between gap-3 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs text-stone-900 block font-bold">Gerar Novo PIN Aleatório</strong>
                    <span className="text-[11px] text-stone-500 block">Cria novo código de 4 dígitos</span>
                  </div>
                </button>

                {/* Enviar via WhatsApp */}
                <button
                  onClick={handleSendPinWhatsapp}
                  disabled={!guest}
                  className="p-4 rounded-2xl border border-stone-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 disabled:opacity-50 transition flex flex-col justify-between gap-3 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs text-stone-900 block font-bold">Enviar PIN via WhatsApp</strong>
                    <span className="text-[11px] text-stone-500 block">
                      {guest ? `Para ${guest.nome}` : 'Necessita hóspede ativo'}
                    </span>
                  </div>
                </button>

                {/* Abertura Remota Recepção */}
                <button
                  onClick={handleRemoteUnlock}
                  disabled={isUnlocking}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 text-left ${
                    unlockSuccess
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-stone-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-stone-900'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Key className={`w-4 h-4 ${isUnlocking ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <strong className="text-xs block font-bold">
                      {isUnlocking ? 'Transmitindo Sinal...' : unlockSuccess ? '✓ Fechadura Destravada!' : 'Abertura Remota (Recepção)'}
                    </strong>
                    <span className={`text-[11px] block ${unlockSuccess ? 'text-emerald-100' : 'text-stone-500'}`}>
                      Destravar trinco via comando Bluetooth/Wi-Fi
                    </span>
                  </div>
                </button>

              </div>

              {/* Personalizar Código Manualmente */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                    Definir Senha Personalizada
                  </h5>
                  <p className="text-xs text-stone-500">
                    Defina um PIN solicitado pelo hóspede (Ex: 4 últimos dígitos do celular).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={customPin}
                    onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, ''))}
                    className="w-24 px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-sm font-bold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="PIN"
                  />
                  <button
                    onClick={handleSaveCustomPin}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Gravar PIN
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: HÓSPEDE ATUAL & RESERVAS                                           */}
          {/* ========================================================================= */}
          {activeTab === 'hospede' && (
            <div className="space-y-6">
              
              {/* Se o quarto estiver ocupado por um hóspede ativo */}
              {guest && activeReservation ? (
                <div className="space-y-5">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-stone-50 border border-purple-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg font-mono shadow-sm">
                          {guest.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-base">{guest.nome}</h4>
                            {guest.vip && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-500">
                            Doc: {guest.documento} • Cel: {guest.telefone} • {guest.cidade || 'Itajubá'}/{guest.estado || 'MG'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setShowFolioModal(true)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                          title="Imprimir extrato de conta em PDF ou enviar via WhatsApp / E-mail"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Extrato / PDF</span>
                        </button>

                        <a
                          href={`https://wa.me/55${guest.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => {
                            updateReservationStatus(activeReservation.id, 'checkout_concluido', {
                              checkoutTime: new Date().toISOString()
                            });
                            setRoomStatus(room.id, 'limpeza');
                            setFeedbackMessage(`Check-out concluído para ${guest.nome}. Quarto direcionado para governança.`);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Concluir Check-out
                        </button>
                      </div>
                    </div>

                    {/* Resumo da Estadia */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-purple-200/60 text-xs">
                      <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Código da Reserva</span>
                        <strong className="font-mono text-stone-900">{activeReservation.codigo}</strong>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Período</span>
                        <strong className="text-stone-900">{formatDateBR(activeReservation.checkin)} a {formatDateBR(activeReservation.checkout)}</strong>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Total da Conta</span>
                        <strong className="font-mono text-stone-900">{formatCurrency(activeReservation.valor_total)}</strong>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-purple-100">
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Consumo Frigobar Lançado</span>
                        <strong className="font-mono text-purple-700">
                          {formatCurrency((activeReservation.consumo_itens || []).reduce((acc, c) => acc + (c.quantidade * c.valor_unitario), 0))}
                        </strong>
                      </div>
                    </div>

                    {/* Preferências de Frigobar no CRM */}
                    {guestPref && (
                      <div className="p-3 bg-white/90 rounded-xl border border-purple-200/80 text-xs space-y-1">
                        <span className="font-bold text-purple-950 block">
                          ⭐ Preferências de Frigobar & Atendimento (CRM):
                        </span>
                        <p className="text-stone-600">
                          {guestPref.notas_vip || 'Hóspede frequente. Aprecia refrigerante gelado e snacks salgados.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Se o quarto estiver livre / sem hóspede ativo */
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-600 flex items-center justify-center mx-auto">
                      <BedDouble className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-base">Quarto Livre para Alocação</h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                        Nenhum hóspede com check-in realizado neste quarto no momento. Você pode criar uma reserva direta de balcão agora.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        openBookingWithRoom(room.id);
                      }}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nova Reserva Balcão no Quarto {room.numero}</span>
                    </button>
                  </div>

                  {/* Próximas Reservas Agendadas */}
                  <div className="space-y-3">
                    <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                      Próximas Chegadas Programadas ({upcomingReservations.length})
                    </h5>

                    {upcomingReservations.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingReservations.slice(0, 3).map((res) => {
                          const g = guests.find((g) => g.id === res.hospede_id);
                          return (
                            <div key={res.id} className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
                              <div>
                                <strong className="text-stone-900 block">{g?.nome || 'Hóspede'}</strong>
                                <span className="text-stone-500">
                                  Check-in: {formatDateBR(res.checkin)} • {res.quantidade_hospedes} pessoas
                                </span>
                              </div>
                              <span className="font-mono font-bold text-stone-700 px-2 py-0.5 rounded bg-stone-100">
                                {res.codigo}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic">
                        Nenhuma reserva futura agendada para os próximos 7 dias neste quarto.
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 5: FICHA TÉCNICA & EQUIPAMENTOS                                       */}
          {/* ========================================================================= */}
          {activeTab === 'detalhes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Tipo / Categoria</span>
                  <strong className="text-stone-900 text-sm block mt-0.5">{roomType?.nome || 'Apart-Hotel'}</strong>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Andar / Bloco</span>
                  <strong className="text-stone-900 text-sm block mt-0.5">{room.andar}º Andar</strong>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Capacidade</span>
                  <strong className="text-stone-900 text-sm block mt-0.5">Até {room.capacidade} pessoas</strong>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Metragem</span>
                  <strong className="text-stone-900 text-sm block mt-0.5">{room.tamanho_m2 || 32} m²</strong>
                </div>
              </div>

              {/* Comodidades */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Comodidades & Mobília do Flat
                </h5>
                <div className="flex flex-wrap gap-2">
                  {(room.comodidades || ['Mini Cozinha', 'Frigobar', 'Ar Condicionado', 'Smart TV 43"', 'Micro-ondas', 'Wi-Fi 5G', 'Bancada de Trabalho']).map((c, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200/80">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Descrição da Unidade
                </h5>
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  {room.descricao || 'Apart-hotel mobiliado de alto padrão no centro de Itajubá, ideal para profissionais em viagem corporativa ou estadias confortáveis.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* RODAPÉ DO MODAL COM FECHAR & ATALHOS */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>PMS Itajubá Flat</span>
            <span>•</span>
            <span>Fechadura: <strong className="font-mono text-stone-900">{room.fechadura_pin}#</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>

      {/* MODAL DE FÓLIO / EXTRATO / PDF / WHATSAPP */}
      {showFolioModal && activeReservation && (
        <GuestBillModal
          isOpen={showFolioModal}
          onClose={() => setShowFolioModal(false)}
          reserva={activeReservation}
          guest={guest || undefined}
          room={room}
          hotelConfig={hotelConfig}
          currentUser={currentUser}
          onConfirmCheckout={(res) => {
            updateReservationStatus(res.id, 'checkout_concluido', {
              checkoutTime: new Date().toISOString()
            });
            setRoomStatus(room.id, 'limpeza');
            setFeedbackMessage(`Check-out concluído para ${guest?.nome || 'Hóspede'}. Quarto direcionado para governança.`);
            setShowFolioModal(false);
          }}
        />
      )}

    </div>
  );
};
