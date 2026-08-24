import React from 'react';
import { X, Printer, Download, CheckCircle2, Building2, Calendar, FileText, Share2 } from 'lucide-react';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../../../utils/formatters';
import { HotelConfig } from '../../../types';
import { ContaReceber, DespesaOperacional, PaymentMethod } from '../../../types/financial';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelConfig: HotelConfig;
  receivable?: ContaReceber | null;
  expense?: DespesaOperacional | null;
  paymentId?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  hotelConfig,
  receivable,
  expense,
  paymentId
}) => {
  if (!isOpen || (!receivable && !expense)) return null;

  const isReceivable = !!receivable;
  const receiptNumber = paymentId || (isReceivable ? `REC-${receivable?.id.slice(-6)}` : `PAG-${expense?.id.slice(-6)}`);
  const amount = isReceivable ? receivable!.valor_total : expense!.valor;
  const description = isReceivable ? receivable!.descricao : expense!.descricao;
  const partyName = isReceivable ? receivable!.hospede_nome : expense!.fornecedor;
  const partyDoc = isReceivable ? receivable!.hospede_documento : 'Fornecedor Cadastrado';
  const method: PaymentMethod = isReceivable ? (receivable!.metodo_pagamento || 'pix') : (expense!.metodo_pagamento || 'pix');
  const dateFormatted = isReceivable ? 
    (receivable!.data_pagamento ? formatDateTimeBR(receivable!.data_pagamento) : formatDateBR(receivable!.data_vencimento)) : 
    (expense!.data_pagamento ? formatDateTimeBR(expense!.data_pagamento) : formatDateBR(expense!.data_vencimento));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <FileText className="w-4 h-4" />
            <span>Comprovante & Recibo Oficial</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer text-xs flex items-center gap-1"
              title="Imprimir Recibo"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-stone-50 flex-1 print:p-0 print:bg-white" id="printable-receipt">
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-5">
            
            {/* Header Hotel Info */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-stone-900">
                  {hotelConfig.nome}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {hotelConfig.endereco}, {hotelConfig.bairro} • {hotelConfig.cidade}/{hotelConfig.estado}
                </p>
                <p className="text-[11px] text-stone-500 font-mono">
                  CNPJ: {hotelConfig.cnpj} • Tel: {hotelConfig.telefone}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Comprovante Nº
                </span>
                <span className="font-mono font-bold text-sm text-stone-800">
                  {receiptNumber}
                </span>
              </div>
            </div>

            {/* Status Stamp */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {isReceivable ? 'Recebimento Concluído & Conciliado' : 'Pagamento Liquidado'}
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Operação registrada no PMS do hotel em {dateFormatted}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {method.toUpperCase().replace('_', ' ')}
              </span>
            </div>

            {/* Main Info Table */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">{isReceivable ? 'Hóspede / Cliente:' : 'Fornecedor:'}</span>
                <span className="font-bold text-stone-900 text-right">{partyName}</span>
              </div>

              {partyDoc && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Documento (CPF/CNPJ):</span>
                  <span className="font-mono text-stone-800 text-right">{partyDoc}</span>
                </div>
              )}

              {receivable?.codigo_reserva && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Código da Reserva:</span>
                  <span className="font-bold font-mono text-amber-700 text-right">{receivable.codigo_reserva}</span>
                </div>
              )}

              {receivable?.quarto_numero && (
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500">Acomodação / Quarto:</span>
                  <span className="font-semibold text-stone-800 text-right">Flat {receivable.quarto_numero}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500">Discriminação do Serviço:</span>
                <span className="text-stone-800 text-right max-w-[240px]">{description}</span>
              </div>
            </div>

            {/* Total Amount Box */}
            <div className="p-4 rounded-xl bg-stone-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Valor Total Liquidado
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                {formatCurrency(amount)}
              </span>
            </div>

            {/* Footer Signatures */}
            <div className="pt-6 border-t border-dashed border-stone-300 text-center space-y-4">
              <p className="text-[10px] text-stone-400">
                Este documento serve como recibo e comprovante financeiro emitido pelo sistema de gestão do {hotelConfig.nome}.
              </p>
              
              <div className="flex justify-between items-end pt-4 text-[10px] text-stone-500">
                <div className="border-t border-stone-400 w-36 pt-1 text-center">
                  Recepção / Financeiro
                </div>
                <div className="border-t border-stone-400 w-36 pt-1 text-center">
                  Assinatura do Responsável
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
