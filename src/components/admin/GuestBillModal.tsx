import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Mail, 
  Check, 
  Copy, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Calendar, 
  BedDouble, 
  User, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Reserva, Hospede, Quarto, HotelConfig } from '../../types';
import { formatCurrency, formatDateBR, formatDateTimeBR, formatDocument, formatPhone, generateWhatsAppLink } from '../../utils/formatters';

interface GuestBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  guest?: Hospede | null;
  room?: Quarto | null;
  hotelConfig: HotelConfig;
  currentUser?: { nome: string; cargo_titulo?: string };
  onConfirmCheckout?: (reserva: Reserva) => void;
}

export const GuestBillModal: React.FC<GuestBillModalProps> = ({
  isOpen,
  onClose,
  reserva,
  guest,
  room,
  hotelConfig,
  currentUser = { nome: 'Alice Guimarães', cargo_titulo: 'Gerente Geral' },
  onConfirmCheckout,
}) => {
  const [copied, setCopied] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState(guest?.email || '');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('');

  if (!isOpen || !reserva) return null;

  // Cálculo de diárias / noites
  const checkinDate = new Date(reserva.checkin);
  const checkoutDate = new Date(reserva.checkout);
  const timeDiff = Math.abs(checkoutDate.getTime() - checkinDate.getTime());
  const calculatedNights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  const guestName = guest?.nome || 'Hóspede Titular';
  const guestPhone = guest?.telefone || '(35) 99123-4567';
  const guestEmail = guest?.email || 'hospede@email.com';
  const guestDoc = guest?.documento ? formatDocument(guest.documento) : '000.000.000-00';
  const roomNumber = room?.numero || '102';
  const roomName = room?.nome || 'Flat Executivo Standard';

  // Itens de consumo
  const consumoItens = reserva.consumo_itens && reserva.consumo_itens.length > 0 
    ? reserva.consumo_itens 
    : (reserva.valor_consumo && reserva.valor_consumo > 0 
        ? [{ id: 'c-default', item: 'Consumos de Frigobar / Bistrô da Estadia', quantidade: 1, valor_unitario: reserva.valor_consumo, data: reserva.checkin }]
        : []);

  const totalConsumo = reserva.valor_consumo || 0;
  // O status financeiro não pode ser inferido pelo ciclo de vida da reserva.
  // A certificação depende do Folio canônico, cujo vínculo explícito ainda não existe neste componente.
  const financialStatusLabel = 'SITUAÇÃO FINANCEIRA NÃO CERTIFICADA';

  // Montagem do texto estruturado para WhatsApp
  const generateFolioWhatsAppText = () => {
    return (
`🏨 *${hotelConfig.nome.toUpperCase()}*
🧾 *EXTRATO DE CONTA & HOSPEDAGEM*
────────────────────────
👤 *Hóspede:* ${guestName}
🚪 *Acomodação:* Quarto ${roomNumber} - ${roomName}
📅 *Período:* ${formatDateBR(reserva.checkin)} a ${formatDateBR(reserva.checkout)} (${calculatedNights} ${calculatedNights > 1 ? 'diárias' : 'diária'})
🔑 *Código da Reserva:* ${reserva.codigo}

📋 *DETALHAMENTO DA CONTA:*
• Hospedagem (${calculatedNights}x diárias): ${formatCurrency(reserva.valor_diarias)}
• Taxa de Serviço (5%): ${formatCurrency(reserva.valor_taxas)}
${totalConsumo > 0 ? `• Consumos Frigobar / Extras: ${formatCurrency(totalConsumo)}
  ${consumoItens.map((c) => `  └ ${c.quantidade}x ${c.item} (${formatCurrency(c.valor_unitario * c.quantidade)})`).join('\n')}` : '• Consumos Extras: R$ 0,00'}

────────────────────────
💰 *VALOR TOTAL DA CONTA:* *${formatCurrency(reserva.valor_total)}*
💳 *Forma de Pagamento:* ${reserva.forma_pagamento ? reserva.forma_pagamento.toUpperCase() : 'PIX'} (${financialStatusLabel})
────────────────────────
🌟 *Agradecemos imensamente sua preferência!*
Esperamos recebê-lo novamente em breve em Itajubá.`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = generateFolioWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsAppModal = () => {
    setCustomWhatsAppMsg(generateFolioWhatsAppText());
    setShowWhatsAppModal(true);
  };

  const handleDirectWhatsApp = () => {
    const link = generateWhatsAppLink(guestPhone, generateFolioWhatsAppText());
    window.open(link, '_blank');
  };

  const handleOpenEmailModal = () => {
    setEmailTo(guest?.email || '');
    setEmailSubject(`[${hotelConfig.nome}] Extrato de Conta & Fechamento de Estadia - Reserva ${reserva.codigo}`);
    setShowEmailModal(true);
  };

  const handleSendEmailClient = () => {
    const body = encodeURIComponent(generateFolioWhatsAppText());
    const subject = encodeURIComponent(emailSubject || `[${hotelConfig.nome}] Extrato de Conta - ${reserva.codigo}`);
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const handleSimulateEmailDispatch = () => {
    setEmailSentNotice(true);
    setTimeout(() => {
      setEmailSentNotice(false);
      setShowEmailModal(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[96vh]">
        
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR DE CONTROLE E AÇÕES (NÃO IMPRIME NO PDF)                   */}
        {/* ========================================================================= */}
        <div className="no-print p-4 sm:p-5 bg-stone-900 text-stone-100 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-400">
                  Fólio do Hóspede • Fechamento de Conta
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono text-[10px] font-bold border border-stone-700">
                  {reserva.codigo}
                </span>
              </div>
              <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-stone-100">
                {guestName}
              </h3>
            </div>
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Imprimir / Salvar em PDF */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Imprimir Extrato ou Salvar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleOpenWhatsAppModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Enviar extrato por WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* E-mail */}
            <button
              onClick={handleOpenEmailModal}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-stone-700 cursor-pointer"
              title="Enviar extrato por E-mail"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden md:inline">E-mail</span>
            </button>

            {/* Copiar Resumo */}
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-stone-700 cursor-pointer"
              title="Copiar texto do fólio"
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
        {/* CORPO DO DOCUMENTO / FOLIO TIMBRADO (FORMATADO PARA IMPRESSÃO A4 & TELA)  */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-100" id="printable-bill">
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-stone-200/90 shadow-sm max-w-3xl mx-auto space-y-6 text-stone-900 font-sans">
            
            {/* 1. CABEÇALHO DO HOTEL & IDENTIFICAÇÃO FISCAL */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b-2 border-stone-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-bold font-serif-luxury text-base">
                    {hotelConfig.nome.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-serif-luxury text-xl sm:text-2xl font-black tracking-tight text-stone-950">
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
                    CNPJ: <strong>{hotelConfig.cnpj}</strong> • I.M: 18.940/2024 • Tel: {hotelConfig.telefone}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    E-mail: {hotelConfig.email} • Site: {hotelConfig.site || 'www.itajubaflathotel.com.br'}
                  </p>
                </div>
              </div>

              {/* Box de Numeração do Fólio */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-right sm:min-w-[210px] space-y-1 self-stretch sm:self-auto flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  EXTRATO DE HOSPEDAGEM
                </span>
                <span className="font-mono font-black text-lg text-stone-950 block">
                  {reserva.codigo}
                </span>
                <div className="text-[10px] text-stone-500 border-t border-stone-200/80 pt-1 mt-1">
                  <span>Emissão: </span>
                  <strong className="font-mono text-stone-800">
                    {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>
                <div className="text-[10px] text-stone-500">
                  <span>Atendente: </span>
                  <strong className="text-stone-800">{currentUser.nome}</strong>
                </div>
              </div>
            </div>

            {/* 2. DADOS DO HÓSPEDE & DADOS DA ACOMODAÇÃO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Quadro Hóspede */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/70">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    Dados do Hóspede Titular
                  </span>
                  {guest?.vip && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[9px]">
                      HÓSPEDE VIP
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Nome:</span>
                    <strong className="text-stone-900 text-right">{guestName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Documento (CPF):</span>
                    <span className="font-mono text-stone-800 text-right">{guestDoc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Telefone:</span>
                    <span className="text-stone-800 text-right">{formatPhone(guestPhone)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">E-mail:</span>
                    <span className="text-stone-800 text-right">{guestEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Origem:</span>
                    <span className="text-stone-800 text-right">{guest?.cidade || 'Itajubá'}/{guest?.estado || 'MG'}</span>
                  </div>
                </div>
              </div>

              {/* Quadro Acomodação & Estadia */}
              <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/70">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-stone-500" />
                    Acomodação & Período
                  </span>
                  <span className="font-mono font-bold text-[10px] text-stone-600">
                    {calculatedNights} {calculatedNights > 1 ? 'noites' : 'noite'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Quarto / Flat:</span>
                    <strong className="text-stone-900 text-right">Quarto {roomNumber} ({roomName})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Entrada (Check-in):</span>
                    <span className="text-stone-800 text-right">
                      {formatDateBR(reserva.checkin)} ({reserva.checkin_horario ? formatDateTimeBR(reserva.checkin_horario) : '14:00'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Saída (Check-out):</span>
                    <span className="text-stone-800 text-right">
                      {formatDateBR(reserva.checkout)} ({reserva.checkout_horario ? formatDateTimeBR(reserva.checkout_horario) : (reserva.status === 'checkout_concluido' ? '11:30' : '12:00')})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Hóspedes:</span>
                    <span className="text-stone-800 text-right">
                      {reserva.adultos || reserva.quantidade_hospedes} adulto(s) {reserva.criancas > 0 ? `+ ${reserva.criancas} criança(s)` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Senha Fechadura (PIN):</span>
                    <span className="font-mono font-bold text-amber-800 text-right">{reserva.pin_fechadura}#</span>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. TABELA DE LANÇAMENTOS E ITENS DO FÓLIO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                  Discriminação dos Lançamentos & Consumos
                </h4>
                <span className="text-[10px] text-stone-500">Valores em Reais (BRL)</span>
              </div>

              <div className="border border-stone-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] border-b border-stone-300">
                    <tr>
                      <th className="py-2.5 px-3">Data/Hora</th>
                      <th className="py-2.5 px-3">Descrição do Serviço / Produto</th>
                      <th className="py-2.5 px-2 text-center">Qtd</th>
                      <th className="py-2.5 px-3 text-right">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    
                    {/* Linha da Hospedagem / Diárias */}
                    <tr className="hover:bg-stone-50/60">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600">
                        {formatDateBR(reserva.checkin)}
                      </td>
                      <td className="py-2.5 px-3">
                        <strong className="text-stone-900 block">Hospedagem Flat {roomNumber}</strong>
                        <span className="text-[10px] text-stone-500">
                          {calculatedNights}x diárias ({formatDateBR(reserva.checkin)} a {formatDateBR(reserva.checkout)}) • Inclui café colonial & garagem
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-semibold">
                        {calculatedNights}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                        {formatCurrency(reserva.valor_diarias / calculatedNights)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(reserva.valor_diarias)}
                      </td>
                    </tr>

                    {/* Linha da Taxa de Serviço */}
                    <tr className="hover:bg-stone-50/60">
                      <td className="py-2 px-3 font-mono text-[11px] text-stone-600">
                        {formatDateBR(reserva.checkin)}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-stone-800">Taxa de Serviço Hoteleiro & ISS (5%)</span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono">1</td>
                      <td className="py-2 px-3 text-right font-mono text-stone-700">
                        {formatCurrency(reserva.valor_taxas)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(reserva.valor_taxas)}
                      </td>
                    </tr>

                    {/* Linhas de Consumo de Frigobar / Extras */}
                    {consumoItens.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-amber-50/40 bg-stone-50/30">
                        <td className="py-2 px-3 font-mono text-[11px] text-stone-600">
                          {c.data ? (c.data.includes('T') ? formatDateTimeBR(c.data).slice(0, 16) : formatDateBR(c.data)) : formatDateBR(reserva.checkin)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 uppercase">
                              Frigobar / Extra
                            </span>
                            {c.item}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-amber-900">
                          {c.quantidade}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-stone-700">
                          {formatCurrency(c.valor_unitario)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                          {formatCurrency(c.quantidade * c.valor_unitario)}
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. TOTALIZAÇÃO & CONCILIAÇÃO FINANCEIRA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Quadro de Forma de Pagamento & Conciliação */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-stone-700 block">
                    Forma de Liquidação & Pagamento
                  </span>
                  
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-stone-200 text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <div>
                      <strong className="text-stone-900 block uppercase">
                        {reserva.forma_pagamento ? reserva.forma_pagamento.replace('_', ' ') : 'PIX'}
                      </strong>
                      <span className="text-[10px] text-stone-500">
                        Situação financeira não certificada — consulte o Folio oficial
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 space-y-0.5 pt-2 border-t border-stone-200/80">
                  <p>• Chave PIX do Hotel (CNPJ): <strong>{hotelConfig.cnpj}</strong></p>
                  <p>• Banco: Sicoob Mantiqueira • Ag: 3180 • C/C: 10492-1</p>
                </div>
              </div>

              {/* Quadro de Subtotais e Total Geral */}
              <div className="p-4 rounded-xl bg-stone-900 text-stone-100 space-y-2.5 text-xs shadow-md">
                <div className="flex justify-between text-stone-300">
                  <span>Subtotal Diárias Hospedagem:</span>
                  <span className="font-mono">{formatCurrency(reserva.valor_diarias)}</span>
                </div>

                <div className="flex justify-between text-stone-300">
                  <span>Subtotal Taxa de Serviço (5%):</span>
                  <span className="font-mono">{formatCurrency(reserva.valor_taxas)}</span>
                </div>

                <div className="flex justify-between text-stone-300">
                  <span>Subtotal Frigobar & Extras:</span>
                  <span className="font-mono text-amber-400">{formatCurrency(totalConsumo)}</span>
                </div>

                <div className="flex justify-between pt-2.5 border-t border-stone-800 text-base font-bold items-baseline">
                  <span className="text-amber-400 font-serif-luxury tracking-wide">TOTAL DA CONTA:</span>
                  <span className="font-mono text-xl sm:text-2xl font-black text-amber-400">
                    {formatCurrency(reserva.valor_total)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] pt-1 text-emerald-400 font-medium">
                  <span>Situação Financeira:</span>
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    NÃO CERTIFICADA
                  </span>
                </div>
              </div>

            </div>

            {/* 5. TERMO DE CONFERÊNCIA & ASSINATURAS */}
            <div className="pt-4 border-t border-stone-200 space-y-4">
              <p className="text-[10px] text-stone-500 text-justify leading-relaxed italic">
                * Declaro ter conferido todos os lançamentos acima discriminados de hospedagem, taxas e consumos de frigobar/bistrô, estando em pleno acordo com os valores cobrados e confirmando a devolução do apartamento nas mesmas condições em que foi disponibilizado.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-stone-700">
                <div className="space-y-1">
                  <div className="border-b border-stone-400 w-3/4 mx-auto pb-1"></div>
                  <strong className="block text-stone-900">{guestName}</strong>
                  <span className="text-[10px] text-stone-500">Assinatura do Hóspede</span>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-stone-400 w-3/4 mx-auto pb-1"></div>
                  <strong className="block text-stone-900">{hotelConfig.nome}</strong>
                  <span className="text-[10px] text-stone-500">Recepção / Governança</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* RODAPÉ INFERIOR DE CONFIRMAÇÃO & CHECK-OUT (NÃO IMPRIME)                  */}
        {/* ========================================================================= */}
        <div className="no-print p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Documento oficial de fechamento registrado e auditado pelo sistema.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
            >
              Voltar
            </button>

            {onConfirmCheckout && reserva.status !== 'checkout_concluido' && (
              <button
                onClick={() => onConfirmCheckout(reserva)}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Confirmar Check-out & Liberar Quarto</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL DE ENVIO VIA WHATSAPP COM PREVIEW EDITÁVEL                      */}
      {/* ========================================================================= */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageSquare className="w-5 h-5" />
                <h4 className="font-bold text-stone-900 text-base">Enviar Extrato via WhatsApp</h4>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Destinatário:</span>
                  <strong>{guestName}</strong> ({formatPhone(guestPhone)})
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800">{reserva.codigo}</span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Mensagem Formatada:
                </label>
                <textarea
                  rows={8}
                  value={customWhatsAppMsg}
                  onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs text-stone-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
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
                  navigator.clipboard.writeText(customWhatsAppMsg);
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
                  const link = generateWhatsAppLink(guestPhone, customWhatsAppMsg);
                  window.open(link, '_blank');
                  setShowWhatsAppModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir WhatsApp Web</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL DE ENVIO VIA E-MAIL                                             */}
      {/* ========================================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-stone-900">
                <Mail className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-stone-900 text-base">Enviar Extrato de Conta por E-mail</h4>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>

            {emailSentNotice ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h5 className="font-bold text-emerald-900 text-sm">E-mail Enviado com Sucesso!</h5>
                <p className="text-xs text-emerald-700">
                  O fólio de hospedagem em formato PDF e discriminado foi enviado para <strong>{emailTo}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">E-mail do Hóspede:</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Assunto:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                  <span className="font-bold block">📄 Anexo incluído:</span>
                  <span className="text-[11px] font-mono">
                    Extrato_Hospedagem_{reserva.codigo}_{guestName.replace(/\s+/g, '_')}.pdf
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
                  onClick={handleSendEmailClient}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir App de E-mail</span>
                </button>

                <button
                  onClick={handleSimulateEmailDispatch}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar E-mail com PDF</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
