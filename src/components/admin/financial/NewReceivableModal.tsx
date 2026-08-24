import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, User, Building2, CheckCircle2 } from 'lucide-react';
import { ContaReceber, ReceivableCategory, PaymentMethod } from '../../../types/financial';

interface NewReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReceivable: (receivable: Omit<ContaReceber, 'id' | 'created_at'>) => void;
}

export const NewReceivableModal: React.FC<NewReceivableModalProps> = ({
  isOpen,
  onClose,
  onAddReceivable
}) => {
  const [hospedeNome, setHospedeNome] = useState('');
  const [hospedeTelefone, setHospedeTelefone] = useState('');
  const [hospedeDocumento, setHospedeDocumento] = useState('');
  const [hospedeEmail, setHospedeEmail] = useState('');
  const [codigoReserva, setCodigoReserva] = useState('');
  const [quartoNumero, setQuartoNumero] = useState('');
  const [categoria, setCategoria] = useState<ReceivableCategory>('diaria_hospedagem');
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [dataVencimento, setDataVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>('pix');
  const [jaPago, setJaPago] = useState(false);
  const [notasCobranca, setNotasCobranca] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospedeNome || valorTotal <= 0) return;

    onAddReceivable({
      hospede_nome: hospedeNome,
      hospede_telefone: hospedeTelefone || '',
      hospede_documento: hospedeDocumento || undefined,
      hospede_email: hospedeEmail || undefined,
      codigo_reserva: codigoReserva || undefined,
      quarto_numero: quartoNumero || undefined,
      categoria,
      descricao: descricao || `Hospedagem & Serviços - ${hospedeNome}`,
      valor_total: Number(valorTotal),
      valor_pago: jaPago ? Number(valorTotal) : 0,
      saldo_pendente: jaPago ? 0 : Number(valorTotal),
      data_vencimento: dataVencimento,
      data_pagamento: jaPago ? new Date().toISOString() : undefined,
      status: jaPago ? 'recebido' : 'pendente',
      metodo_pagamento: metodoPagamento,
      notas_cobranca: notasCobranca || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                Nova Conta a Receber / Faturamento
              </h3>
              <p className="text-xs text-stone-400">
                Lançamento de diárias, consumo extra, eventos ou faturamento para empresas
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Nome do Hóspede / Empresa
              </label>
              <input
                type="text"
                required
                value={hospedeNome}
                onChange={(e) => setHospedeNome(e.target.value)}
                placeholder="Ex: Dra. Camila ou Embraer S.A."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Telefone / WhatsApp
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
                Documento (CPF ou CNPJ)
              </label>
              <input
                type="text"
                value={hospedeDocumento}
                onChange={(e) => setHospedeDocumento(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Categoria de Receita
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ReceivableCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none bg-white font-medium"
              >
                <option value="diaria_hospedagem">Diárias de Hospedagem</option>
                <option value="consumo_frigobar">Consumo Frigobar / Restaurante</option>
                <option value="taxa_servico">Taxa de Serviço / Limpeza Extra</option>
                <option value="day_use">Day Use / Garagem</option>
                <option value="locacao_espaco">Locação de Sala / Espaço</option>
                <option value="multa_no_show">Multa de Cancelamento / No-Show</option>
                <option value="outros">Outras Receitas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Código Reserva / Quarto
              </label>
              <input
                type="text"
                value={codigoReserva}
                onChange={(e) => setCodigoReserva(e.target.value)}
                placeholder="Ex: IFH-84920 ou Flat 201"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Descrição do Lançamento
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Diárias referentes ao período de 24 a 28 de Agosto"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Valor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  value={valorTotal || ''}
                  onChange={(e) => setValorTotal(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold font-mono text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Forma de Pagamento
              </label>
              <select
                value={metodoPagamento}
                onChange={(e) => setMetodoPagamento(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none bg-white font-medium"
              >
                <option value="pix">PIX Instantâneo</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="faturado">Faturado Corporativo (30 dias)</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
                <option value="transferencia">Transferência Bancária</option>
              </select>
            </div>
          </div>

          {/* Opção de Quitação Imediata */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-emerald-900 cursor-pointer">
              <input
                type="checkbox"
                checked={jaPago}
                onChange={(e) => setJaPago(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Este valor já foi integralmente pago e conciliado no ato</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Observações / Instruções de Cobrança
            </label>
            <input
              type="text"
              value={notasCobranca}
              onChange={(e) => setNotasCobranca(e.target.value)}
              placeholder="Ex: Faturado para empresa com autorização de faturamento anexa"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Conta a Receber</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
