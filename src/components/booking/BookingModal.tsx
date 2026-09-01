import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency, formatDateBR, generateWhatsAppLink } from '../../utils/formatters';
import { calculateNights } from '../../utils/availability';
import confetti from 'canvas-confetti';
import { 
  X, 
  Calendar, 
  Users, 
  Check, 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  BedDouble, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Key, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  FileText, 
  MessageSquare 
} from 'lucide-react';
import { Quarto, TipoQuarto, AvailabilityResult, Reserva } from '../../types';
import { getTheme, getFontFamilyClass } from '../../utils/themeHelper';

// Componente Modal do Motor de Reservas Integrado (Passo a Passo / Wizard)
export const BookingModal: React.FC = () => {
  const { 
    bookingModalOpen, 
    setBookingModalOpen, 
    bookingSearchFilters, 
    setBookingSearchFilters,
    searchRooms,
    createReservation,
    hotelConfig,
    setCurrentView,
    setAdminActiveTab
  } = useHotel();

  const theme = getTheme(hotelConfig.tema_cor);
  const fontClass = getFontFamilyClass(hotelConfig.tipografia);

  // Etapas do Wizard: 1 = Datas/Hóspedes, 2 = Escolha de Quarto, 3 = Dados do Hóspede, 4 = Pagamento, 5 = Confirmação & Voucher
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Estado do Formulário de Datas e Capacidade
  const [checkin, setCheckin] = useState(bookingSearchFilters.checkin);
  const [checkout, setCheckout] = useState(bookingSearchFilters.checkout);
  const [adults, setAdults] = useState(bookingSearchFilters.guests || 2);
  const [childrenCount, setChildrenCount] = useState(0);

  // Resultados de Disponibilidade e Quarto Selecionado
  const [availableResults, setAvailableResults] = useState<AvailabilityResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AvailabilityResult | null>(null);

  // Dados Cadastrais do Hóspede Titular
  const [guestData, setGuestData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    cidade: '',
    estado: 'SP',
    observacoes: '',
  });

  // Dados do Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro'>('pix');
  const [installments, setInstallments] = useState(1);
  const [cardData, setCardData] = useState({
    numero: '•••• •••• •••• 4242',
    titular: '',
    validade: '12/29',
    cvv: '888',
  });

  // Reserva Criada (Etapa 5)
  const [createdReservation, setCreatedReservation] = useState<Reserva | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const totalGuests = adults + childrenCount;
  const nights = calculateNights(checkin, checkout);

  // Sincroniza com os filtros de busca ao abrir o modal
  useEffect(() => {
    if (bookingModalOpen) {
      setCheckin(bookingSearchFilters.checkin);
      setCheckout(bookingSearchFilters.checkout);
      setAdults(bookingSearchFilters.guests || 2);
      
      const results = searchRooms(bookingSearchFilters.checkin, bookingSearchFilters.checkout, bookingSearchFilters.guests || 2);
      setAvailableResults(results);

      // Se um quarto específico foi escolhido diretamente da vitrine
      if (bookingSearchFilters.selectedRoomId) {
        const found = results.find((r) => r.quarto.id === bookingSearchFilters.selectedRoomId);
        if (found) {
          setSelectedResult(found);
          setCurrentStep(2);
        } else {
          setCurrentStep(2);
        }
      } else {
        setCurrentStep(2);
      }
    }
  }, [bookingModalOpen, bookingSearchFilters]);

  // Executa busca de disponibilidade
  const handlePerformSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = searchRooms(checkin, checkout, totalGuests);
    setAvailableResults(results);
    setBookingSearchFilters({
      checkin,
      checkout,
      guests: totalGuests,
    });
    setSelectedResult(null);
    setCurrentStep(2);
  };

  // Enviar Reserva e Processar Pagamento
  const handleConfirmAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult) return;

    setLoadingPayment(true);
    // Confirma a reserva; o recebimento real é registrado posteriormente pelo Financial Engine.
    setTimeout(() => {
      try {
        const { reserva } = createReservation({
          quartoId: selectedResult.quarto.id,
          checkin,
          checkout,
          guestsCount: totalGuests,
          adultos: adults,
          criancas: childrenCount,
          hospede: {
            nome: guestData.nome,
            email: guestData.email,
            telefone: guestData.telefone,
            documento: guestData.documento,
            cidade: guestData.cidade,
            estado: guestData.estado,
          },
          pagamento: {
            metodo: paymentMethod,
            parcelas: installments,
          },
          observacoes: guestData.observacoes,
        });

        setCreatedReservation(reserva);
        setLoadingPayment(false);
        setCurrentStep(5);

        // Efeito de confetes comemorativos
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#d97706', '#10b981', '#3b82f6'],
          });
        } catch {
          // ignora se indisponível
        }
      } catch (err) {
        alert('Erro ao processar reserva: ' + err);
        setLoadingPayment(false);
      }
    }, 1200);
  };

  if (!bookingModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Barra Superior do Modal */}
        <div className="bg-stone-900 text-stone-100 p-4 sm:p-6 flex items-center justify-between border-b border-stone-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Motor de Reservas Integrado • {hotelConfig.nome}</span>
            </div>
            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white mt-0.5">
              {currentStep === 1 && 'Escolha as Datas e Hóspedes'}
              {currentStep === 2 && 'Selecione sua Acomodação'}
              {currentStep === 3 && 'Identificação do Hóspede Titular'}
              {currentStep === 4 && 'Forma de Pagamento & Confirmação'}
              {currentStep === 5 && 'Reserva Confirmada com Sucesso!'}
            </h2>
          </div>

          <button
            onClick={() => setBookingModalOpen(false)}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Barra de Progresso do Wizard */}
        <div className="bg-stone-100 px-4 sm:px-6 py-3 border-b border-stone-200 flex items-center justify-between overflow-x-auto text-xs font-semibold text-stone-600 flex-shrink-0">
          <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? `${theme.textAccentClass} font-bold` : 'text-stone-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? `${theme.primary} text-stone-950 font-bold` : 'bg-stone-300 text-stone-600'}`}>1</span>
            <span>Datas & Período</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          
          <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? `${theme.textAccentClass} font-bold` : 'text-stone-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? `${theme.primary} text-stone-950 font-bold` : 'bg-stone-300 text-stone-600'}`}>2</span>
            <span>Acomodação</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />

          <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? `${theme.textAccentClass} font-bold` : 'text-stone-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 3 ? `${theme.primary} text-stone-950 font-bold` : 'bg-stone-300 text-stone-600'}`}>3</span>
            <span>Hóspede</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />

          <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? `${theme.textAccentClass} font-bold` : 'text-stone-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 4 ? `${theme.primary} text-stone-950 font-bold` : 'bg-stone-300 text-stone-600'}`}>4</span>
            <span>Pagamento</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />

          <div className={`flex items-center gap-1.5 ${currentStep === 5 ? 'text-emerald-700 font-bold' : 'text-stone-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 5 ? 'bg-emerald-600 text-white font-bold' : 'bg-stone-300 text-stone-600'}`}>5</span>
            <span>Voucher</span>
          </div>
        </div>

        {/* Corpo com Rolagem do Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-50/50">
          
          {/* ETAPA 1: Formulário de Pesquisa (caso queira modificar as datas) */}
          {currentStep === 1 && (
            <form onSubmit={handlePerformSearch} className="space-y-6 max-w-xl mx-auto py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
                    <Calendar className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                    Data de Entrada (Check-in)
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center gap-1">
                    <Calendar className={`w-3.5 h-3.5 ${theme.textAccentClass}`} />
                    Data de Saída (Check-out)
                  </label>
                  <input
                    type="date"
                    required
                    min={checkin}
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white font-semibold text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Adultos
                  </label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Adulto' : 'Adultos'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Crianças (0 a 12 anos)
                  </label>
                  <select
                    value={childrenCount}
                    onChange={(e) => setChildrenCount(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white font-semibold"
                  >
                    {[0, 1, 2, 3].map((num) => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Criança' : 'Crianças'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${theme.bgSubtleClass} border ${theme.primaryBorder} text-stone-900 text-xs flex items-center gap-2`}>
                <Clock className={`w-4 h-4 ${theme.textAccentClass} flex-shrink-0`} />
                <span>
                  Período solicitado: <strong>{nights} {nights === 1 ? 'noite' : 'noites'}</strong> ({formatDateBR(checkin)} até {formatDateBR(checkout)}) para <strong>{totalGuests} {totalGuests === 1 ? 'hóspede' : 'hóspedes'}</strong>.
                </span>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl ${theme.buttonClass} font-bold text-base flex items-center justify-center gap-2 transition cursor-pointer`}
              >
                Buscar Quartos Disponíveis
              </button>
            </form>
          )}

          {/* ETAPA 2: Escolha de Quarto dentre as Opções Disponíveis */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              {/* Resumo da busca atual com botão para alteração */}
              <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 gap-2">
                <div className="flex items-center gap-3">
                  <span>📅 <strong>{formatDateBR(checkin)}</strong> até <strong>{formatDateBR(checkout)}</strong> ({nights} {nights === 1 ? 'noite' : 'noites'})</span>
                  <span>👥 <strong>{totalGuests}</strong> hóspedes</span>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  Alterar Datas
                </button>
              </div>

              {availableResults.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                    Nenhum quarto disponível para estas datas
                  </h3>
                  <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                    Todas as nossas acomodações para este número de hóspedes já possuem reservas ou bloqueios no período de {formatDateBR(checkin)} a {formatDateBR(checkout)}.
                  </p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2.5 rounded-xl bg-stone-900 text-amber-300 font-bold text-xs cursor-pointer"
                  >
                    Tentar outras datas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableResults.map((item) => {
                    const isSelected = selectedResult?.quarto.id === item.quarto.id;
                    const photo = item.quarto.fotos[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';

                    return (
                      <div
                        key={item.quarto.id}
                        onClick={() => setSelectedResult(item)}
                        className={`bg-white rounded-2xl border-2 transition-all p-4 flex flex-col justify-between cursor-pointer group shadow-sm ${
                          isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20'
                            : 'border-stone-200 hover:border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-stone-900">
                            <img src={photo} alt={item.quarto.nome} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-sm text-amber-300 text-[10px] font-bold uppercase">
                              {item.tipo.nome}
                            </span>
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded bg-stone-900/80 text-white text-[10px] font-bold">
                              Nº {item.quarto.numero}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-stone-900 text-base">{item.quarto.nome}</h4>
                            <span className="text-xs text-stone-500 whitespace-nowrap">{item.quarto.vista}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-600">
                            <span>👥 Até {item.quarto.capacidade} pessoas</span>
                            <span>📐 {item.quarto.tamanho_m2} m²</span>
                            <span>🛏️ {item.quarto.cama}</span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1">
                            {item.quarto.comodidades.slice(0, 3).map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px]">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-500 block">Total ({nights} noites + taxas)</span>
                            <span className="text-lg font-bold text-stone-900 font-mono">
                              {formatCurrency(item.valorTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResult(item);
                              setCurrentStep(3);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-stone-950 shadow-sm'
                                : 'bg-stone-900 text-amber-300 hover:bg-stone-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSelected ? 'Selecionado' : 'Escolher'}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {selectedResult && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Prosseguir para Dados do Hóspede</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ETAPA 3: Dados Cadastrais do Hóspede */}
          {currentStep === 3 && selectedResult && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCurrentStep(4);
              }}
              className="space-y-6"
            >
              {/* Cartão de resumo do quarto selecionado */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                <div>
                  <span className="font-bold block text-sm">{selectedResult.quarto.nome}</span>
                  <span>{formatDateBR(checkin)} até {formatDateBR(checkout)} ({nights} noites) • {totalGuests} hóspedes</span>
                </div>
                <span className="text-base font-bold font-mono text-stone-900">{formatCurrency(selectedResult.valorTotal)}</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
                <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  Dados do Hóspede Titular da Reserva
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestData.nome}
                      onChange={(e) => setGuestData({ ...guestData, nome: e.target.value })}
                      placeholder="Ex: Alice Guimarães Teixeira"
                      className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      CPF / Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestData.documento}
                      onChange={(e) => setGuestData({ ...guestData, documento: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      E-mail para Confirmação *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestData.email}
                      onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                      placeholder="alice@exemplo.com.br"
                      className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      WhatsApp / Celular com DDD *
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestData.telefone}
                      onChange={(e) => setGuestData({ ...guestData, telefone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full p-2.5 rounded-lg border border-stone-200 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Cidade de Origem
                    </label>
                    <input
                      type="text"
                      value={guestData.cidade}
                      onChange={(e) => setGuestData({ ...guestData, cidade: e.target.value })}
                      placeholder="Ex: São Paulo"
                      className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Observações ou Solicitações Especiais
                    </label>
                    <input
                      type="text"
                      value={guestData.observacoes}
                      onChange={(e) => setGuestData({ ...guestData, observacoes: e.target.value })}
                      placeholder="Ex: Cama de casal, chegada após 18h..."
                      className="w-full p-2.5 rounded-lg border border-stone-200 text-sm"
                    />
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar aos Quartos</span>
                </button>

                <button
                  type="submit"
                  className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Prosseguir para Pagamento</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}

          {/* ETAPA 4: Pagamento e Confirmação da Reserva */}
          {currentStep === 4 && selectedResult && (
            <form onSubmit={handleConfirmAndPay} className="space-y-6">
              
              {/* Detalhamento de Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 space-y-4">
                  <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    Forma de Pagamento
                  </h4>

                  {/* Seletor de Método de Pagamento */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition cursor-pointer ${
                        paymentMethod === 'pix' ? 'border-emerald-600 bg-emerald-50/40' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <QrCode className="w-5 h-5 text-emerald-600" />
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Instantâneo</span>
                      </div>
                      <span className="font-bold text-xs text-stone-900 mt-2">PIX Online</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cartao_credito')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition cursor-pointer ${
                        paymentMethod === 'cartao_credito' ? 'border-amber-600 bg-amber-50/40' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <CreditCard className="w-5 h-5 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Até 6x</span>
                      </div>
                      <span className="font-bold text-xs text-stone-900 mt-2">Cartão de Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('dinheiro')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition cursor-pointer ${
                        paymentMethod === 'dinheiro' ? 'border-blue-600 bg-blue-50/40' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Recepção</span>
                      </div>
                      <span className="font-bold text-xs text-stone-900 mt-2">Pagar no Check-in</span>
                    </button>
                  </div>

                  {/* Informações do Método Escolhido */}
                  {paymentMethod === 'pix' && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold">
                        <QrCode className="w-4 h-4 text-emerald-700" />
                        <span>Aprovação Automática em 5 Segundos</span>
                      </div>
                      <p className="text-emerald-800 text-[11px] leading-relaxed">
                        Ao clicar em "Finalizar Reserva", o sistema gerará o código PIX Copia-e-Cola e o QR Code. A confirmação é disparada imediatamente com seu voucher no WhatsApp e E-mail.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'cartao_credito' && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                          Parcelamento
                        </label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="w-full p-2.5 rounded-lg border border-stone-200 text-xs font-semibold"
                        >
                          <option value={1}>1x de {formatCurrency(selectedResult.valorTotal)} (Sem juros)</option>
                          <option value={2}>2x de {formatCurrency(selectedResult.valorTotal / 2)} (Sem juros)</option>
                          <option value={3}>3x de {formatCurrency(selectedResult.valorTotal / 3)} (Sem juros)</option>
                          <option value={6}>6x de {formatCurrency(selectedResult.valorTotal / 6)} (Sem juros)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">Número do Cartão (Simulação)</label>
                          <input
                            type="text"
                            value={cardData.numero}
                            onChange={(e) => setCardData({ ...cardData, numero: e.target.value })}
                            className="w-full p-2 rounded-lg border border-stone-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">Nome no Cartão</label>
                          <input
                            type="text"
                            placeholder="Como gravado no cartão"
                            value={cardData.titular || guestData.nome}
                            onChange={(e) => setCardData({ ...cardData, titular: e.target.value })}
                            className="w-full p-2 rounded-lg border border-stone-200 text-xs uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Cartão de Resumo da Reserva */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                      Resumo da Estadia
                    </h4>

                    <div className="text-xs space-y-1.5 pb-3 border-b border-stone-100">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Quarto:</span>
                        <strong className="text-stone-900">{selectedResult.quarto.nome}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Check-in:</span>
                        <span>{formatDateBR(checkin)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Check-out:</span>
                        <span>{formatDateBR(checkout)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Hóspede:</span>
                        <span>{guestData.nome}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 pt-1">
                      <div className="flex justify-between text-stone-600">
                        <span>Diárias ({nights}x {formatCurrency(selectedResult.quarto.valor_diaria)}):</span>
                        <span>{formatCurrency(selectedResult.valorDiarias)}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Taxa de Serviço ({hotelConfig.taxa_servico_percentual}%):</span>
                        <span>{formatCurrency(selectedResult.taxas)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-xs font-bold uppercase text-stone-700">Valor Total</span>
                      <span className="text-xl font-bold text-amber-700 font-mono">
                        {formatCurrency(selectedResult.valorTotal)}
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-400 leading-tight mb-2">
                      Ao confirmar, o bloqueio do período será gravado na base central.
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar aos Dados</span>
                </button>

                <button
                  type="submit"
                  disabled={loadingPayment}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Confirmando reserva...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Reserva & Emitir Voucher</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* ETAPA 5: Tela de Sucesso, Voucher e PIN da Fechadura Inteligente */}
          {currentStep === 5 && createdReservation && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              
              {/* Banner de Sucesso */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-6 text-center space-y-2 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif-luxury text-2xl sm:text-3xl font-bold">
                  Reserva Confirmada com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
                  Os dados foram sincronizados na base central do hotel e o período foi bloqueado no calendário.
                </p>
              </div>

              {/* Cartão do Voucher Digital */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-stone-300 p-6 shadow-md space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      Código Localizador
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-bold font-mono text-stone-900 tracking-wider">
                        {createdReservation.codigo}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdReservation.codigo);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500 cursor-pointer"
                        title="Copiar Código"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Caixa com o PIN da Fechadura Inteligente */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">Senha da Fechadura Digital</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono tracking-widest text-stone-900">
                          {createdReservation.pin_fechadura}#
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(createdReservation.pin_fechadura || '');
                            setCopiedPin(true);
                            setTimeout(() => setCopiedPin(false), 2000);
                          }}
                          className="p-1 rounded text-amber-700 hover:bg-amber-100 cursor-pointer"
                          title="Copiar PIN"
                        >
                          {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes da Estadia */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-stone-400 block font-semibold uppercase text-[10px]">Hóspede</span>
                    <span className="font-bold text-stone-900">{guestData.nome}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-semibold uppercase text-[10px]">Acomodação</span>
                    <span className="font-bold text-stone-900">{selectedResult?.quarto.nome}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-semibold uppercase text-[10px]">Check-in</span>
                    <span className="font-bold text-stone-900">{formatDateBR(createdReservation.checkin)} (14h)</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-semibold uppercase text-[10px]">Check-out</span>
                    <span className="font-bold text-stone-900">{formatDateBR(createdReservation.checkout)} (12h)</span>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 flex items-center justify-between">
                  <span>Valor Total Pago / Registrado:</span>
                  <strong className="text-stone-900 font-mono text-sm">{formatCurrency(createdReservation.valor_total)}</strong>
                </div>

              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a
                  href={generateWhatsAppLink(
                    guestData.telefone || hotelConfig.whatsapp,
                    `Olá ${guestData.nome}! Sua reserva no Itajubá Flat Hotel está confirmada.\n\nCódigo: ${createdReservation.codigo}\nCheck-in: ${formatDateBR(createdReservation.checkin)}\nSenha Fechadura: ${createdReservation.pin_fechadura}#`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Voucher pelo WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setBookingModalOpen(false);
                    setCurrentView('admin');
                    setAdminActiveTab('reservations');
                  }}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ver Reserva no Painel Administrativo</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
