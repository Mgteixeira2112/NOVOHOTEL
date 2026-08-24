import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, Building2, CheckCircle2 } from 'lucide-react';
import { DespesaOperacional, ExpenseCategory, PaymentMethod } from '../../../types/financial';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<DespesaOperacional, 'id' | 'created_at'>) => void;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  onAddExpense
}) => {
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [categoria, setCategoria] = useState<ExpenseCategory>('fornecedores_alimentos');
  const [valor, setValor] = useState<number>(0);
  const [dataVencimento, setDataVencimento] = useState(() => new Date().toISOString().split('T')[0]);
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>('pix');
  const [centroCusto, setCentroCusto] = useState('Operações Prediais');
  const [recorrente, setRecorrente] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [jaPago, setJaPago] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || valor <= 0) return;

    onAddExpense({
      descricao,
      fornecedor: fornecedor || 'Fornecedor Avulso',
      categoria,
      valor: Number(valor),
      data_vencimento: dataVencimento,
      data_pagamento: jaPago ? new Date().toISOString() : undefined,
      status: jaPago ? 'pago' : 'pendente',
      metodo_pagamento: metodoPagamento,
      centro_custo: centroCusto,
      recorrente,
      observacoes: observacoes || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 bg-stone-900 text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                Nova Conta a Pagar / Despesa
              </h3>
              <p className="text-xs text-stone-400">
                Cadastro de custo operacional, fornecedor ou manutenção
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
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Descrição da Despesa / Produto
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aquisição de Toalhas de Banho 500g"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Fornecedor / Prestador
              </label>
              <input
                type="text"
                required
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex: Lavanderia Mantiqueira"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Categoria de Custo
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none bg-white font-medium"
              >
                <option value="fornecedores_alimentos">A&B / Café da Manhã</option>
                <option value="lavanderia_enxoval">Lavanderia & Enxoval</option>
                <option value="concessionarias_energia_agua">Energia, Água & Gás</option>
                <option value="telecom_internet_software">Internet, Software & TI</option>
                <option value="manutencao_predial">Manutenção Predial & Ar</option>
                <option value="folha_pagamento_comissoes">Folha & Comissões</option>
                <option value="impostos_taxas">Impostos & Taxas (ISS)</option>
                <option value="marketing_comissoes_ota">Comissões OTAs / Booking</option>
                <option value="outros">Outros Custos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Valor da Conta (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-sm">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  value={valor || ''}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-bold font-mono text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="boleto">Boleto Bancário</option>
                <option value="cartao_credito">Cartão de Crédito Corporativo</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="dinheiro">Dinheiro em Espécie</option>
                <option value="transferencia">Transferência Bancária (TED)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
                Centro de Custo
              </label>
              <input
                type="text"
                value={centroCusto}
                onChange={(e) => setCentroCusto(e.target.value)}
                placeholder="Ex: Governança ou Recepção"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:border-stone-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Opções de Baixa e Recorrência */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={jaPago}
                onChange={(e) => setJaPago(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Esta despesa já foi paga no ato (liquidar agora)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={recorrente}
                onChange={(e) => setRecorrente(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span>Despesa mensal recorrente (ex: luz, internet, lavanderia)</span>
            </label>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block mb-1">
              Observações / Nº Nota Fiscal (Opcional)
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: NF-e 4920 referente à entrega de agosto"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Conta a Pagar</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
