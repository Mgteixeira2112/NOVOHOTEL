import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ListChecks } from 'lucide-react';
import { useOperationalTransactionsUi } from '../../components/admin/financial/useOperationalTransactionsUi';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const dateTime = (value: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed);
};

export const FinancialTransactionsWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { transactions, loading, error } = useOperationalTransactionsUi();

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><ListChecks className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-black text-slate-900">{widget.title || 'Transações Financeiras'}</h2>
          <p className="text-[10px] text-slate-400">Ledger operacional · hotel_os_transactions</p>
        </div>
      </div>

      {loading && <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">Carregando transações…</div>}
      {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700">Extrato operacional indisponível.</div>}
      {!loading && !error && !transactions.length && <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">Nenhuma transação operacional encontrada.</div>}

      {!loading && !error && transactions.length > 0 && (
        <div className="mt-4 max-h-[28rem] space-y-2 overflow-auto">
          {transactions.map(transaction => {
            const refund = transaction.transactionType === 'refund';
            return (
              <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${refund ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {refund ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <strong className="block truncate text-[10px] text-slate-800">{refund ? 'Estorno' : 'Pagamento'} · {transaction.method || 'outro'}</strong>
                    <span className="block truncate text-[9px] text-slate-400">{dateTime(transaction.createdAt)} · {transaction.externalReference || transaction.id}</span>
                    <span className="block truncate text-[9px] text-slate-400">Folio {transaction.folioId || '—'} · {transaction.status || '—'}</span>
                  </div>
                </div>
                <strong className={`whitespace-nowrap text-xs ${refund ? 'text-rose-700' : 'text-emerald-800'}`}>{refund ? '−' : '+'}{money(transaction.amount)}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
