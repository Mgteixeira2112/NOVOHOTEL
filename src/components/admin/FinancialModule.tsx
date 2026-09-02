import React, { useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { useSaaSTenant } from '../../context/SaaSTenantContext';
import { PayablesTab } from './financial/PayablesTab';
import { ReceivablesCrmTab } from './financial/ReceivablesCrmTab';
import { ReceiptModal } from './financial/ReceiptModal';
import { useAdministrativeFinanceUi } from './financial/useAdministrativeFinanceUi';
import type { ContaReceber, DespesaOperacional, PaymentMethod } from '../../types/financial';

const unsupportedMutation = () => {
  window.alert('Operação indisponível até existir contrato oficial de criação/exclusão no Financeiro Administrativo.');
};

const unsupportedPaymentLink = () => {
  window.alert('Link de pagamento indisponível até existir contrato financeiro oficial de leitura e escrita.');
};

const money = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(value);

const transactionValue = (transaction: unknown) => {
  const row = transaction as Record<string, unknown>;
  return Number(row.amount ?? row.valor ?? row.total ?? 0);
};

const transactionLabel = (transaction: unknown) => {
  const row = transaction as Record<string, unknown>;
  return String(row.description ?? row.descricao ?? row.type ?? row.transaction_type ?? 'Transação financeira');
};

const transactionDate = (transaction: unknown) => {
  const row = transaction as Record<string, unknown>;
  const value = row.transaction_date ?? row.created_at ?? row.date;
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
};

export const FinancialModule: React.FC = () => {
  const { hotelConfig } = useHotel();
  const { activeHotelId } = useSaaSTenant();
  const {
    receivables,
    payables,
    transactions,
    ready,
    missingSources,
    loading,
    error,
    settleReceivable,
    settlePayable,
  } = useAdministrativeFinanceUi(activeHotelId ?? hotelConfig?.id ?? null);
  const [receiptReceivable, setReceiptReceivable] = useState<ContaReceber | null>(null);
  const [receiptPayable, setReceiptPayable] = useState<DespesaOperacional | null>(null);
  const [tab, setTab] = useState<'receivables' | 'payables' | 'transactions'>('receivables');

  const totals = useMemo(() => ({
    receivable: receivables.reduce((sum, item) => sum + Number(item.saldo_pendente || 0), 0),
    payable: payables.reduce((sum, item) => sum + Number(item.valor || 0), 0),
    transactions: transactions.reduce((sum, item) => sum + transactionValue(item), 0),
  }), [receivables, payables, transactions]);

  const settleReceivableAccount = async (id: string, method: PaymentMethod) => {
    const account = receivables.find(item => item.id === id);
    if (!account || account.saldo_pendente <= 0) return;
    try {
      await settleReceivable(id, account.saldo_pendente, method);
    } catch (settleError) {
      window.alert(settleError instanceof Error ? settleError.message : 'Não foi possível liquidar a conta a receber.');
    }
  };

  const settlePayableAccount = async (id: string, method: PaymentMethod) => {
    const account = payables.find(item => item.id === id);
    if (!account || account.valor <= 0) return;
    try {
      await settlePayable(id, account.valor, method);
    } catch (settleError) {
      window.alert(settleError instanceof Error ? settleError.message : 'Não foi possível liquidar a conta a pagar.');
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">Carregando Financeiro…</div>;
  }

  if (!ready) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <strong>Financeiro administrativo indisponível.</strong>{' '}
        {error || `Fontes oficiais ausentes: ${missingSources.join(', ') || 'não identificadas'}.`}
      </div>
    );
  }

  return (
    <section className="space-y-6" data-saas-financial-module>
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Financeiro</p>
        <h1 className="mt-1 text-2xl font-black text-stone-950">Gestão financeira do hotel</h1>
        <p className="mt-1 text-sm text-stone-500">Contas e transações oficiais do hotel ativo, sem composição por Workspace.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-bold text-stone-500">A receber</p>
          <strong className="mt-2 block text-xl text-stone-950">{money(totals.receivable)}</strong>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-bold text-stone-500">A pagar</p>
          <strong className="mt-2 block text-xl text-stone-950">{money(totals.payable)}</strong>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-bold text-stone-500">Movimentação registrada</p>
          <strong className="mt-2 block text-xl text-stone-950">{money(totals.transactions)}</strong>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2">
        {([
          ['receivables', 'Contas a receber'],
          ['payables', 'Contas a pagar'],
          ['transactions', 'Transações'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap ${tab === id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'receivables' && (
        <ReceivablesCrmTab
          receivables={receivables}
          onOpenNewReceivable={unsupportedMutation}
          onOpenPaymentLink={unsupportedPaymentLink}
          onViewReceipt={setReceiptReceivable}
          onSettleReceivable={(id, method) => { void settleReceivableAccount(id, method); }}
          onDeleteReceivable={unsupportedMutation}
        />
      )}

      {tab === 'payables' && (
        <PayablesTab
          expenses={payables}
          onOpenNewExpense={unsupportedMutation}
          onViewReceipt={setReceiptPayable}
          onSettleExpense={(id, method) => { void settlePayableAccount(id, method); }}
          onDeleteExpense={unsupportedMutation}
        />
      )}

      {tab === 'transactions' && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 className="font-black text-stone-900">Transações financeiras</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Nenhuma transação encontrada.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {transactions.map((transaction, index) => (
                <div key={String((transaction as Record<string, unknown>).id ?? index)} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-stone-900">{transactionLabel(transaction)}</p>
                    <p className="text-xs text-stone-500">{transactionDate(transaction)}</p>
                  </div>
                  <strong className="whitespace-nowrap text-sm text-stone-900">{money(transactionValue(transaction))}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ReceiptModal
        isOpen={Boolean(receiptReceivable)}
        onClose={() => setReceiptReceivable(null)}
        hotelConfig={hotelConfig}
        receivable={receiptReceivable}
      />
      <ReceiptModal
        isOpen={Boolean(receiptPayable)}
        onClose={() => setReceiptPayable(null)}
        hotelConfig={hotelConfig}
        expense={receiptPayable}
      />
    </section>
  );
};
