import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Building2, 
  Tag, 
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../../../utils/formatters';
import { DespesaOperacional, ExpenseStatus, ExpenseCategory, PaymentMethod } from '../../../types/financial';

interface PayablesTabProps {
  expenses: DespesaOperacional[];
  onOpenNewExpense: () => void;
  onViewReceipt: (expense: DespesaOperacional) => void;
  onSettleExpense: (id: string, method: PaymentMethod) => void;
  onDeleteExpense: (id: string) => void;
}

export const PayablesTab: React.FC<PayablesTabProps> = ({
  expenses,
  onOpenNewExpense,
  onViewReceipt,
  onSettleExpense,
  onDeleteExpense
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('pix');

  const totalExpenses = expenses.reduce((acc, e) => acc + e.valor, 0);
  const totalPaid = expenses.filter(e => e.status === 'pago').reduce((acc, e) => acc + e.valor, 0);
  const totalPending = expenses.filter(e => e.status === 'pendente').reduce((acc, e) => acc + e.valor, 0);
  const totalOverdue = expenses.filter(e => e.status === 'atrasado').reduce((acc, e) => acc + e.valor, 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.centro_custo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' ? true : e.status === statusFilter;
    const matchesCat = categoryFilter === 'todos' ? true : e.categoria === categoryFilter;

    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleConfirmSettle = (id: string) => {
    onSettleExpense(id, settleMethod);
    setSettlingId(null);
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'fornecedores_alimentos': return 'A&B / Café da Manhã';
      case 'lavanderia_enxoval': return 'Lavanderia & Enxoval';
      case 'concessionarias_energia_agua': return 'Energia & Água';
      case 'telecom_internet_software': return 'Internet & TI';
      case 'manutencao_predial': return 'Manutenção Predial';
      case 'folha_pagamento_comissoes': return 'Folha & Comissões';
      case 'impostos_taxas': return 'Impostos (ISS)';
      case 'marketing_comissoes_ota': return 'Comissões OTAs';
      default: return 'Outros Custos';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header com Totais de Contas a Pagar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
            Total de Custos Previstos
          </span>
          <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">
            {formatCurrency(totalExpenses)}
          </span>
          <span className="text-[10px] text-stone-400">{expenses.length} lançamentos operacionais</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Total Já Liquidado / Pago
          </span>
          <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
            {formatCurrency(totalPaid)}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">
            {totalExpenses > 0 ? Math.round((totalPaid / totalExpenses) * 100) : 0}% pago
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
            Contas a Vencer no Mês
          </span>
          <span className="text-xl font-bold font-mono text-amber-700 mt-1 block">
            {formatCurrency(totalPending)}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Contas e fornecedores</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block">
            Vencidas / Em Atraso
          </span>
          <span className="text-xl font-bold font-mono text-red-700 mt-1 block">
            {formatCurrency(totalOverdue)}
          </span>
          <span className="text-[10px] text-red-600 font-medium">Requer atenção imediata</span>
        </div>

      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por despesa, fornecedor ou centro..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white text-stone-700 focus:outline-none"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="fornecedores_alimentos">A&B / Café da Manhã</option>
            <option value="lavanderia_enxoval">Lavanderia & Enxoval</option>
            <option value="concessionarias_energia_agua">Energia & Água</option>
            <option value="telecom_internet_software">Internet & TI</option>
            <option value="manutencao_predial">Manutenção Predial</option>
            <option value="impostos_taxas">Impostos (ISS)</option>
          </select>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['todos', 'pendente', 'pago'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {st === 'todos' ? 'Todos' : st === 'pendente' ? 'A Vencer' : 'Pagos'}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenNewExpense}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>

      </div>

      {/* Tabela de Contas a Pagar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <th className="py-3.5 px-4">Descrição da Despesa</th>
                <th className="py-3.5 px-4">Fornecedor / Centro</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4">Valor (R$)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400">
                    Nenhuma despesa encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const isSettling = settlingId === item.id;
                  const isPending = item.status === 'pendente' || item.status === 'atrasado';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition">
                      
                      {/* Descrição */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-stone-900">{item.descricao}</div>
                        {item.recorrente && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            Recorrente Mensal
                          </span>
                        )}
                      </td>

                      {/* Fornecedor / Centro */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-800">{item.fornecedor}</div>
                        <div className="text-[11px] text-stone-500">{item.centro_custo || 'Operações'}</div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                          {getCategoryLabel(item.categoria)}
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-mono text-stone-800">
                        {formatDateBR(item.data_vencimento)}
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {formatCurrency(item.valor)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'pago' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Liquidado
                          </span>
                        ) : item.status === 'atrasado' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Vencido
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> A Vencer
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        
                        {isSettling ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                            <select
                              value={settleMethod}
                              onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                              className="px-2 py-1 rounded-lg border border-stone-300 text-[11px] font-bold bg-white"
                            >
                              <option value="pix">PIX</option>
                              <option value="boleto">Boleto</option>
                              <option value="cartao_credito">Cartão Corporativo</option>
                              <option value="dinheiro">Dinheiro</option>
                              <option value="transferencia">TED</option>
                            </select>

                            <button
                              onClick={() => handleConfirmSettle(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Confirmar
                            </button>

                            <button
                              onClick={() => setSettlingId(null)}
                              className="px-2 py-1 rounded-lg bg-stone-200 text-stone-700 text-[11px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Pagar / Liquidar */}
                            {isPending && (
                              <button
                                onClick={() => setSettlingId(item.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-emerald-200"
                                title="Liquidar despesa"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Pagar</span>
                              </button>
                            )}

                            {/* Ver Comprovante */}
                            <button
                              onClick={() => onViewReceipt(item)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                              title="Visualizar Comprovante"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Deseja realmente remover a despesa: ${item.descricao}?`)) {
                                  onDeleteExpense(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition cursor-pointer"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        )}

                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
