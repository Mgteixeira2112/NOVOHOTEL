import React from 'react';
import { CreditCard, DollarSign, ReceiptText, RotateCcw } from 'lucide-react';
import { useOperationalRevenueUi } from '../../components/admin/financial/useOperationalRevenueUi';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export const FinancialSummaryWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const { grossPayments, refunds, netReceived, paymentCount, byMethod, loading, error } = useOperationalRevenueUi();

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
          <DollarSign className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-black text-slate-900">{widget.title || 'Resumo Financeiro'}</h2>
          <p className="text-[10px] text-slate-400">Receita operacional · hotel_os_transactions</p>
        </div>
      </div>

      {loading && <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">Carregando receita operacional…</div>}
      {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-700">Receita operacional indisponível.</div>}

      {!loading && !error && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-[9px] font-black uppercase text-emerald-600">Recebido líquido</p>
              <strong className="mt-1 block text-lg text-emerald-900">{money(netReceived)}</strong>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[9px] font-black uppercase text-slate-500">Pagamentos</p>
              <strong className="mt-1 block text-lg text-slate-900">{money(grossPayments)}</strong>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3">
              <p className="text-[9px] font-black uppercase text-rose-500">Estornos</p>
              <strong className="mt-1 block text-lg text-rose-800">{money(refunds)}</strong>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3">
              <p className="text-[9px] font-black uppercase text-blue-500">Transações aprovadas</p>
              <strong className="mt-1 block text-lg text-blue-900">{paymentCount}</strong>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><ReceiptText className="h-3.5 w-3.5" />PIX</span><strong>{money(byMethod.pix)}</strong></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><CreditCard className="h-3.5 w-3.5" />Crédito</span><strong>{money(byMethod.creditCard)}</strong></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><CreditCard className="h-3.5 w-3.5" />Débito</span><strong>{money(byMethod.debitCard)}</strong></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><RotateCcw className="h-3.5 w-3.5" />Outros</span><strong>{money(byMethod.other)}</strong></div>
          </div>
        </>
      )}
    </div>
  );
};
