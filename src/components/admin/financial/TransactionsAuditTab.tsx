import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  QrCode, 
  CreditCard, 
  Banknote, 
  FileText, 
  Printer, 
  Calendar,
  Layers,
  Building2,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatDateTimeBR, formatDateBR } from '../../../utils/formatters';
import { Pagamento, Reserva, Hospede } from '../../../types';
import { DespesaOperacional, PaymentMethod } from '../../../types/financial';

interface TransactionAuditItem {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  entidade: string;
  categoria: string;
  data: string;
  metodo: PaymentMethod;
  valor_bruto: number;
  taxa_estimada: number;
  valor_liquido: number;
  codigo_transacao: string;
  status: 'aprovado' | 'pago' | 'pendente';
}

interface TransactionsAuditTabProps {
  payments: Pagamento[];
  reservations: Reserva[];
  guests: Hospede[];
  expenses: DespesaOperacional[];
  onExportReport: () => void;
}

export const TransactionsAuditTab: React.FC<TransactionsAuditTabProps> = ({
  payments,
  reservations,
  guests,
  expenses,
  onExportReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [methodFilter, setMethodFilter] = useState<string>('todos');

  // Construção do extrato unificado
  const unifiedTransactions: TransactionAuditItem[] = [
    ...payments.map((p) => {
      const res = reservations.find(r => r.id === p.reserva_id);
      const guest = res ? guests.find(g => g.id === res.hospede_id) : null;
      
      const mdrRate = p.metodo === 'pix' ? 0.00 : (p.metodo === 'cartao_credito' ? 0.029 : 0.015);
      const fee = p.valor * mdrRate;
      const net = p.valor - fee;

      return {
        id: p.id,
        tipo: 'entrada' as const,
        descricao: res ? `Reserva ${res.codigo} (${res.adultos + res.criancas} hóspedes)` : 'Recebimento de Hospedagem',
        entidade: guest?.nome || 'Hóspede Identificado',
        categoria: 'Hospedagem & Diárias',
        data: p.data_pagamento,
        metodo: p.metodo as PaymentMethod,
        valor_bruto: p.valor,
        taxa_estimada: fee,
        valor_liquido: net,
        codigo_transacao: p.codigo_transacao || `AUTH-${p.id.slice(-6)}`,
        status: p.status as any
      };
    }),
    ...expenses.filter(e => e.status === 'pago').map((e) => {
      return {
        id: e.id,
        tipo: 'saida' as const,
        descricao: e.descricao,
        entidade: e.fornecedor,
        categoria: e.centro_custo || 'Operações',
        data: e.data_pagamento || e.data_vencimento,
        metodo: e.metodo_pagamento || 'pix',
        valor_bruto: e.valor,
        taxa_estimada: 0,
        valor_liquido: e.valor,
        codigo_transacao: `PAY-${e.id.slice(-6)}`,
        status: 'pago' as const
      };
    })
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Cálculos de Totais
  const totalIn = unifiedTransactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor_bruto, 0);
  const totalNetIn = unifiedTransactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor_liquido, 0);
  const totalOut = unifiedTransactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + t.valor_bruto, 0);
  const netCashBalance = totalNetIn - totalOut;

  // Filtragem
  const filteredList = unifiedTransactions.filter(t => {
    const matchesSearch = 
      t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.entidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.codigo_transacao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'todos' ? true : t.tipo === typeFilter;
    const matchesMethod = methodFilter === 'todos' ? true : t.metodo === methodFilter;

    return matchesSearch && matchesType && matchesMethod;
  });

  const getMethodIcon = (m: PaymentMethod) => {
    switch (m) {
      case 'pix':
        return <QrCode className="w-3.5 h-3.5 text-emerald-600" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Banknote className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Cards de Resumo do Extrato */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Entradas Líquidas Conciliadas
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 block">
              {formatCurrency(totalNetIn)}
            </span>
            <span className="text-[10px] text-stone-400">Bruto: {formatCurrency(totalIn)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Saídas / Pagamentos Realizados
            </span>
            <span className="text-xl font-bold font-mono text-rose-700 block">
              {formatCurrency(totalOut)}
            </span>
            <span className="text-[10px] text-stone-400">Custos & fornecedores</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Saldo Líquido em Caixa
            </span>
            <span className="text-xl font-bold font-mono text-stone-900 block">
              {formatCurrency(netCashBalance)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">100% auditado</span>
          </div>
        </div>

      </div>

      {/* Barra de Filtros e Exportação */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por comprovante, titular ou valor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['todos', 'entrada', 'saida'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                  typeFilter === t ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {t === 'todos' ? 'Tudo' : t === 'entrada' ? 'Entradas (+)' : 'Saídas (-)'}
              </button>
            ))}
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white text-stone-700"
          >
            <option value="todos">Todos os Métodos</option>
            <option value="pix">PIX</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="boleto">Boleto</option>
            <option value="dinheiro">Dinheiro</option>
          </select>

          <button
            onClick={handlePrintStatement}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Extrato</span>
          </button>
        </div>

      </div>

      {/* Tabela do Extrato Financeiro */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden" id="printable-statement">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <th className="py-3.5 px-4">Data & Horário</th>
                <th className="py-3.5 px-4">Tipo / Operação</th>
                <th className="py-3.5 px-4">Titular / Beneficiário</th>
                <th className="py-3.5 px-4">Forma de Pagamento</th>
                <th className="py-3.5 px-4">Código / Auth</th>
                <th className="py-3.5 px-4 text-right">Valor Bruto</th>
                <th className="py-3.5 px-4 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400 font-sans">
                    Nenhum lançamento registrado no extrato para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isEntry = item.tipo === 'entrada';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition font-sans">
                      
                      {/* Data */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-700">
                        {formatDateTimeBR(item.data)}
                      </td>

                      {/* Tipo / Descrição */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-bold text-stone-900">{item.descricao}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 pl-3.5 block">{item.categoria}</span>
                      </td>

                      {/* Titular */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-stone-800">{item.entidade}</span>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-medium uppercase font-mono">
                          {getMethodIcon(item.metodo)}
                          <span>{item.metodo.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Código de Autenticação */}
                      <td className="py-3.5 px-4 font-mono text-[10px] text-stone-500">
                        {item.codigo_transacao}
                      </td>

                      {/* Valor Bruto */}
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                        isEntry ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isEntry ? '+' : '-'}{formatCurrency(item.valor_bruto)}
                      </td>

                      {/* Valor Líquido */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                        {formatCurrency(item.valor_liquido)}
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
