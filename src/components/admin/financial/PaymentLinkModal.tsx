import React, { useState } from 'react';
import { 
  X, 
  Link as LinkIcon, 
  QrCode, 
  CreditCard, 
  Copy, 
  Check, 
  Send, 
  Share2, 
  DollarSign, 
  Sparkles,
  Smartphone,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { formatCurrency, generateWhatsAppLink, formatPhone } from '../../../utils/formatters';
import { generatePixPayload, generateQrCodeUrl } from '../../../utils/pixHelper';
import { PixKeyConfig, GatewayConfig, PaymentLink } from '../../../types/financial';

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixKey: PixKeyConfig;
  primaryGateway: GatewayConfig;
  initialGuestName?: string;
  initialPhone?: string;
  initialAmount?: number;
  initialDescription?: string;
  initialReservationCode?: string;
  onSavePaymentLink?: (link: PaymentLink) => void;
}

export const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({
  isOpen,
  onClose,
  pixKey,
  primaryGateway,
  initialGuestName = '',
  initialPhone = '',
  initialAmount = 0,
  initialDescription = '',
  initialReservationCode = '',
  onSavePaymentLink
}) => {
  const [hospedeNome, setHospedeNome] = useState(initialGuestName);
  const [hospedeTelefone, setHospedeTelefone] = useState(initialPhone);
  const [valor, setValor] = useState<number>(initialAmount || 150);
  const [descricao, setDescricao] = useState(initialDescription || 'Hospedagem & Serviços - Itajubá Flat Hotel');
  const [codigoReserva, setCodigoReserva] = useState(initialReservationCode || '');
  const [metodoPix, setMetodoPix] = useState(true);
  const [metodoCartao, setMetodoCartao] = useState(true);
  const [maxParcelas, setMaxParcelas] = useState(3);
  
  // Link gerado
  const [generatedLink, setGeneratedLink] = useState<PaymentLink | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || valor <= 0) return;

    const randomId = 'LINK-' + Math.floor(100000 + Math.random() * 900000);
    const pixPayload = generatePixPayload({
      chave: pixKey.chave,
      nomeTitular: pixKey.titular_nome,
      cidade: pixKey.cidade,
      valor: valor,
      txId: codigoReserva ? codigoReserva.replace(/[^a-zA-Z0-9]/g, '') : randomId,
      descricao: descricao
    });

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 3);

    const methods: ('pix' | 'cartao_credito' | 'boleto')[] = [];
    if (metodoPix) methods.push('pix');
    if (metodoCartao) methods.push('cartao_credito');

    const newLink: PaymentLink = {
      id: 'lnk-' + Date.now(),
      codigo_link: randomId,
      codigo_reserva: codigoReserva || undefined,
      hospede_nome: hospedeNome || 'Hóspede Especial',
      hospede_telefone: hospedeTelefone || '',
      valor: Number(valor),
      descricao: descricao,
      metodos_permitidos: methods,
      gateway_utilizado: primaryGateway.id,
      max_parcelas: maxParcelas,
      status: 'ativo',
      url_pagamento: `https://itajubaflat.com.br/pay/${randomId}`,
      pix_copia_cola: pixPayload,
      data_expiracao: expDate.toISOString(),
      created_at: new Date().toISOString()
    };

    setGeneratedLink(newLink);
    if (onSavePaymentLink) {
      onSavePaymentLink(newLink);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink.url_pagamento);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPix = () => {
    if (!generatedLink?.pix_copia_cola) return;
    navigator.clipboard.writeText(generatedLink.pix_copia_cola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const shareTextWhatsApp = generatedLink ? 
    `Olá, *${generatedLink.hospede_nome}*! 👋\n\nAqui está o link seguro para pagamento da sua fatura no *Itajubá Flat Hotel*:\n\n` +
    `🏢 *Descrição:* ${generatedLink.descricao}\n` +
    (generatedLink.codigo_reserva ? `📌 *Reserva:* ${generatedLink.codigo_reserva}\n` : '') +
    `💰 *Valor Total:* ${formatCurrency(generatedLink.valor)}\n` +
    `💳 *Formas:* PIX Instantâneo ou Cartão de Crédito em até ${generatedLink.max_parcelas}x\n\n` +
    `🔗 *Acesse para pagar agora com segurança:*\n${generatedLink.url_pagamento}\n\n` +
    (generatedLink.pix_copia_cola ? `⚡ *PIX Copia e Cola:*\n\`${generatedLink.pix_copia_cola}\`\n\n` : '') +
    `Qualquer dúvida, estamos à total disposição!` : '';

  const whatsappUrl = generatedLink && hospedeTelefone ? 
    generateWhatsAppLink(hospedeTelefone, shareTextWhatsApp) : 
    `https://wa.me/?text=${encodeURIComponent(shareTextWhatsApp)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                Gerador de Link de Pagamento & PIX
              </h3>
              <p className="text-xs text-stone-400">
                Cobrança instantânea com PIX Dinâmico e Cartão de Crédito ({primaryGateway.nome})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {!generatedLink ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Nome do Hóspede / Cliente
                  </label>
                  <input
                    type="text"
                    required
                    value={hospedeNome}
                    onChange={(e) => setHospedeNome(e.target.value)}
                    placeholder="Ex: Dr. Rodrigo Alcantara"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    WhatsApp / Telefone (com DDD)
                  </label>
                  <input
                    type="text"
                    value={hospedeTelefone}
                    onChange={(e) => setHospedeTelefone(e.target.value)}
                    placeholder="(35) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Valor a Cobrar (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={valor}
                      onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold font-mono text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                    Código de Reserva / Quarto (Opcional)
                  </label>
                  <input
                    type="text"
                    value={codigoReserva}
                    onChange={(e) => setCodigoReserva(e.target.value)}
                    placeholder="Ex: IFH-84920 ou Flat 102"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                  Descrição da Cobrança
                </label>
                <input
                  type="text"
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Diárias de Hospedagem + Consumo Frigobar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
                />
              </div>

              {/* Formas de Pagamento Permitidas */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                  Métodos de Pagamento Habilitados no Link
                </span>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metodoPix}
                      onChange={(e) => setMetodoPix(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      PIX Instantâneo ({pixKey.desconto_percentual}% Desconto)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metodoCartao}
                      onChange={(e) => setMetodoCartao(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      Cartão de Crédito ({primaryGateway.nome.split(' ')[0]})
                    </span>
                  </label>
                </div>

                {metodoCartao && (
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="text-stone-600">Parcelamento Máximo Permitido:</span>
                    <select
                      value={maxParcelas}
                      onChange={(e) => setMaxParcelas(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 text-xs font-bold bg-white"
                    >
                      <option value={1}>1x (À vista)</option>
                      <option value={2}>Até 2x sem juros</option>
                      <option value={3}>Até 3x sem juros</option>
                      <option value={6}>Até 6x (com/sem juros)</option>
                      <option value={12}>Até 12x</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Botão de Geração */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Link & QR Code de Pagamento</span>
              </button>

            </form>
          ) : (
            <div className="space-y-5 animate-fade-in">
              
              {/* Card de Resumo do Link */}
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Link Ativo & Seguro
                  </span>
                  <span className="text-xs text-emerald-800 font-medium">
                    Expira em 3 dias
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-emerald-200/60 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-emerald-950">{generatedLink.hospede_nome}</h4>
                    <p className="text-xs text-emerald-800">{generatedLink.descricao}</p>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-900">
                    {formatCurrency(generatedLink.valor)}
                  </div>
                </div>

                {/* URL do Link */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink.url_pagamento}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs font-mono text-emerald-900 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Seção QR Code PIX Instantâneo */}
              {generatedLink.pix_copia_cola && (
                <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        PIX
                      </div>
                      <span className="text-xs font-bold text-stone-900">
                        PIX Copia e Cola & QR Code EMV
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      {pixKey.banco_nome}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-sm shrink-0">
                      <img
                        src={generateQrCodeUrl(generatedLink.pix_copia_cola, 140)}
                        alt="QR Code PIX"
                        className="w-28 h-28 object-contain rounded-lg"
                      />
                    </div>

                    <div className="w-full space-y-2">
                      <p className="text-xs text-stone-500 leading-relaxed">
                        O hóspede pode escanear o QR Code no app do banco ou utilizar o código abaixo para transferência instantânea:
                      </p>
                      
                      <div className="relative">
                        <textarea
                          readOnly
                          rows={2}
                          value={generatedLink.pix_copia_cola}
                          className="w-full px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-[10px] font-mono text-stone-700 focus:outline-none resize-none"
                        />
                        <button
                          onClick={handleCopyPix}
                          className="mt-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer w-full justify-center"
                        >
                          {copiedPix ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPix ? 'Chave Copiada com Sucesso!' : 'Copiar Código PIX Copia e Cola'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação Direta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp do Hóspede</span>
                </a>

                <button
                  onClick={() => {
                    setGeneratedLink(null);
                    setHospedeNome('');
                    setValor(150);
                  }}
                  className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Gerar Outra Cobrança</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
