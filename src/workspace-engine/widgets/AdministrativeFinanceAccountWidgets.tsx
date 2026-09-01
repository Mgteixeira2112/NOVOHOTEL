import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { PayablesTab } from '../../components/admin/financial/PayablesTab';
import { ReceivablesCrmTab } from '../../components/admin/financial/ReceivablesCrmTab';
import { ReceiptModal } from '../../components/admin/financial/ReceiptModal';
import { useAdministrativeFinanceUi } from '../../components/admin/financial/useAdministrativeFinanceUi';
import type { ContaReceber, DespesaOperacional, PaymentMethod } from '../../types/financial';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const unsupportedMutation = () => {
  window.alert('Operação indisponível até existir contrato oficial de criação/exclusão no Financeiro Administrativo.');
};

const unsupportedPaymentLink = () => {
  window.alert('Link de pagamento indisponível até existir contrato financeiro oficial de leitura e escrita.');
};

const FinanceUnavailable: React.FC<{ loading: boolean; error: string | null; missingSources: string[] }> = ({ loading, error, missingSources }) => {
  if (loading) return <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">Carregando Financeiro Administrativo…</div>;
  return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-900"><strong>Financeiro administrativo indisponível.</strong> {error || `Fontes oficiais ausentes: ${missingSources.join(', ') || 'não identificadas'}.`}</div>;
};

export const FinancialReceivablesWidget: React.FC<WorkspaceWidgetRuntimeContext> = () => {
  const { hotelConfig } = useHotel();
  const { receivables, ready, missingSources, loading, error, settleReceivable } = useAdministrativeFinanceUi();
  const [receipt, setReceipt] = useState<ContaReceber | null>(null);

  const settle = async (id: string, method: PaymentMethod) => {
    const account = receivables.find(item => item.id === id);
    if (!account || account.saldo_pendente <= 0) return;
    try {
      await settleReceivable(id, account.saldo_pendente, method);
    } catch (settleError) {
      window.alert(settleError instanceof Error ? settleError.message : 'Não foi possível liquidar a conta a receber.');
    }
  };

  if (!ready) return <FinanceUnavailable loading={loading} error={error} missingSources={missingSources} />;

  return <>
    <ReceivablesCrmTab
      receivables={receivables}
      onOpenNewReceivable={unsupportedMutation}
      onOpenPaymentLink={unsupportedPaymentLink}
      onViewReceipt={setReceipt}
      onSettleReceivable={(id, method) => { void settle(id, method); }}
      onDeleteReceivable={unsupportedMutation}
    />
    <ReceiptModal isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} hotelConfig={hotelConfig} receivable={receipt} />
  </>;
};

export const FinancialPayablesWidget: React.FC<WorkspaceWidgetRuntimeContext> = () => {
  const { hotelConfig } = useHotel();
  const { payables, ready, missingSources, loading, error, settlePayable } = useAdministrativeFinanceUi();
  const [receipt, setReceipt] = useState<DespesaOperacional | null>(null);

  const settle = async (id: string, method: PaymentMethod) => {
    const account = payables.find(item => item.id === id);
    if (!account || account.valor <= 0) return;
    try {
      await settlePayable(id, account.valor, method);
    } catch (settleError) {
      window.alert(settleError instanceof Error ? settleError.message : 'Não foi possível liquidar a conta a pagar.');
    }
  };

  if (!ready) return <FinanceUnavailable loading={loading} error={error} missingSources={missingSources} />;

  return <>
    <PayablesTab
      expenses={payables}
      onOpenNewExpense={unsupportedMutation}
      onViewReceipt={setReceipt}
      onSettleExpense={(id, method) => { void settle(id, method); }}
      onDeleteExpense={unsupportedMutation}
    />
    <ReceiptModal isOpen={Boolean(receipt)} onClose={() => setReceipt(null)} hotelConfig={hotelConfig} expense={receipt} />
  </>;
};
