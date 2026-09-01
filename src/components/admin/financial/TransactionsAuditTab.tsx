import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  CreditCard,
  Banknote,
  Printer,
  DollarSign,
} from 'lucide-react';
import { formatCurrency, formatDateTimeBR } from '../../../utils/formatters';
import type { PaymentMethod } from '../../../types/financial';
import type { OperationalTransaction } from '../../../services/financialReportingService';

type TransactionDisplayMethod = PaymentMethod | 'outros';

interface TransactionAuditItem {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  entidade: string;
  categoria: string;
  data: string;
  metodo: TransactionDisplayMethod;
  valor_bruto: number;
  valor_liquido: number;
  codigo_transacao: string;
  status: string;
}

interface TransactionsAuditTabProps {
  transactions: OperationalTransaction[];
  onExportReport: () => void;
}

const toPaymentMethod = (method: string): TransactionDisplayMethod => {
  if (method === 'pix') return 'pix';
  if (['cartao_credito', 'credit_card', 'credit'].includes(method)) return 'cartao_credito';
  if (['cartao_debito', 'debit_card', 'debit'].includes(method)) return 'cartao_debito';
  if (method === 'dinheiro' || method === 'cash') return 'dinheiro';
  if (method === 'boleto') return 'boleto';
  if (method === 'faturado') return 'faturado';
  if (['transferencia', 'transfer', 'bank_transfer'].includes(method)) return 'transferencia';
  return 'outros';
};

export const TransactionsAuditTab: React.FC<TransactionsAuditTabProps> = ({
  transactions,
  onExportReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [methodFilter, setMethodFilter] = useState<string>('todos');

  const unifiedTransactions: TransactionAuditItem[] = transactions.map((transaction) => {
    const isRefund = transaction.transactionType === 'refund';
    const method = toPaymentMethod(transaction.method);

    return {
      id: transaction.id,
      tipo: isRefund ? 'saida' : 'entrada',
      descricao: isRefund ? 'Estorno de Folio' : 'Recebimento de Folio',
      entidade: transaction.folioId ? `Folio ${transaction.folioId.slice(0, 8)}` : 'Folio não identificado',
      categoria: isRefund ? 'Estornos' : 'Hospedagem & Consumos',
      data: transaction.createdAt,
      metodo: method,
      valor_bruto: transaction.amount,
      valor_liquido: transaction.amount,
      codigo_transacao: transaction.externalReference || transaction.id,
      status: transaction.status,
    };
  });

  const totalIn = unifiedTransactions
    .filter((transaction) => transaction.tipo === 'entrada')
    .reduce((total, transaction) => total + transaction.valor_bruto, 0);
  const totalOut = unifiedTransactions
    .filter((transaction) => transaction.tipo === 'saida')
    .reduce((total, transaction) => total + transaction.valor_bruto, 0);
  const netCashBalance = totalIn - totalOut;

  const filteredList = unifiedTransactions.filter((transaction) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      transaction.descricao.toLowerCase().includes(normalizedSearch) ||
      transaction.entidade.toLowerCase().includes(normalizedSearch) ||
      transaction.codigo_transacao.toLowerCase().includes(normalizedSearch);
    const matchesType = typeFilter === 'todos' || transaction.tipo === typeFilter;
    const matchesMethod = methodFilter === 'todos' || transaction.metodo === methodFilter;

    return matchesSearch && matchesType && matchesMethod;
  });

  const getMethodIcon = (method: TransactionDisplayMethod) => {
    switch (method) {
      case 'pix':
        return <QrCode className="w-3.5 h-3.5 text-emerald-600" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Banknote className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Entradas aprovadas</span>
            <span className="text-xl font-bold font-mono text-emerald-700 block">{formatCurrency(totalIn)}</span>
            <span className="text-[10px] text-stone-400">Ledger operacional oficial</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Estornos registrados</span>
            <span className="text-xl font-bold font-mono text-rose-700 block">{formatCurrency(totalOut)}</span>
            <span className="text-[10px] text-stone-400">Refunds do Folio</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Recebido líquido</span>
            <span className="text-xl font-bold font-mono text-stone-900 block">{formatCurrency(netCashBalance)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">Fonte: hotel_os_transactions</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por folio ou transação..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:border-stone-900 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {(['todos', 'entrada', 'saida'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                  typeFilter === type ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {type === 'todos' ? 'Tudo' : type === 'entrada' ? 'Entradas (+)' : 'Estornos (-)'}
              </button>
            ))}
          </div>

          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white text-stone-700"
          >
            <option value="todos">Todos os Métodos</option>
            <option value="pix">PIX</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="boleto">Boleto</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="faturado">Faturado</option>
            <option value="transferencia">Transferência</option>
            <option value="outros">Outros</option>
          </select>

          <button
            onClick={onExportReport}
            className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer"
          >
            Exportar
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Extrato</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden" id="printable-statement">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <th className="py-3.5 px-4">Data & Horário</th>
                <th className="py-3.5 px-4">Tipo / Operação</th>
                <th className="py-3.5 px-4">Folio</th>
                <th className="py-3.5 px-4">Forma de Pagamento</th>
                <th className="py-3.5 px-4">Código / Referência</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400 font-sans">
                    Nenhuma transação oficial registrada para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isEntry = item.tipo === 'entrada';
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition font-sans">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-700">{formatDateTimeBR(item.data)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-bold text-stone-900">{item.descricao}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 pl-3.5 block">{item.categoria}</span>
                      </td>
                      <td className="py-3.5 px-4"><span className="font-semibold text-stone-800">{item.entidade}</span></td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-medium uppercase font-mono">
                          {getMethodIcon(item.metodo)}
                          <span>{item.metodo.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-stone-500">{item.codigo_transacao}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold ${isEntry ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isEntry ? '+' : '-'}{formatCurrency(item.valor_bruto)}
                      </td>
                      <td className="py-3.5 px-4 text-[10px] uppercase text-stone-600">{item.status}</td>
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
