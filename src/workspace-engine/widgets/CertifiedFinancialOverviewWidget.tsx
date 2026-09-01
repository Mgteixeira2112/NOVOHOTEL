import React from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CircleDollarSign, ReceiptText } from 'lucide-react';
import { useAdministrativeFinanceUi } from '../../components/admin/financial/useAdministrativeFinanceUi';
import { useOperationalRevenueUi } from '../../components/admin/financial/useOperationalRevenueUi';
import type { WorkspaceWidgetRuntimeContext } from '../widgetRuntimeRegistry';

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

export const CertifiedFinancialOverviewWidget: React.FC<WorkspaceWidgetRuntimeContext> = ({ widget }) => {
  const revenue = useOperationalRevenueUi();
  const admin = useAdministrativeFinanceUi();

  const pendingReceivables = admin.receivables.reduce((total, item) => total + item.saldo_pendente, 0);
  const pendingPayables = admin.payables.reduce((total, item) => total + item.valor, 0);
  const overdueReceivables = admin.receivables
    .filter(item => item.status === 'atrasado')
    .reduce((total, item) => total + item.saldo_pendente, 0);

  const loading = revenue.loading || admin.loading;
  const unavailable = Boolean(revenue.error) || (!admin.loading && !admin.ready);

  return (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CircleDollarSign className="h-4 w-4" /></span>
        <div>
          <h2 className="text-sm font-black text-slate-900">{widget.title || 'Visão Financeira Certificada'}</h2>
          <p className="text-[10px] text-slate-400">Somente fontes financeiras oficiais auditadas</p>
        </div>
      </div>

      {loading && <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">Carregando posição financeira…</div>}
      {!loading && unavailable && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><strong>Visão financeira incompleta.</strong> Uma ou mais fontes oficiais estão indisponíveis.</div>}

      {!loading && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5">
            <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-[9px] font-black uppercase text-emerald-600">Recebido líquido</p><strong className="mt-1 block text-lg text-emerald-900">{money(revenue.netReceived)}</strong></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-500">Pagamentos brutos</p><strong className="mt-1 block text-lg text-slate-900">{money(revenue.grossPayments)}</strong></div>
            <div className="rounded-2xl bg-rose-50 p-3"><p className="text-[9px] font-black uppercase text-rose-500">Estornos</p><strong className="mt-1 block text-lg text-rose-800">{money(revenue.refunds)}</strong></div>
            <div className="rounded-2xl bg-blue-50 p-3"><p className="text-[9px] font-black uppercase text-blue-500">A receber</p><strong className="mt-1 block text-lg text-blue-900">{money(pendingReceivables)}</strong></div>
            <div className="rounded-2xl bg-amber-50 p-3"><p className="text-[9px] font-black uppercase text-amber-600">A pagar</p><strong className="mt-1 block text-lg text-amber-900">{money(pendingPayables)}</strong></div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><ReceiptText className="h-3.5 w-3.5" />Pagamentos aprovados</span><strong>{revenue.paymentCount}</strong></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><ArrowUpRight className="h-3.5 w-3.5" />Recebíveis vencidos</span><strong>{money(overdueReceivables)}</strong></div>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-500"><ArrowDownRight className="h-3.5 w-3.5" />Contas abertas</span><strong>{admin.receivables.length + admin.payables.length}</strong></div>
          </div>

          <div className="mt-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p><strong>DRE completa ainda não certificada.</strong> Taxas de gateway, competência contábil, custos realizados e demais indicadores somente serão exibidos quando houver contrato oficial suficiente. Este widget não usa estimativas nem fallbacks financeiros.</p>
          </div>
        </>
      )}
    </div>
  );
};
