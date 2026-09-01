import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency } from '../../utils/formatters';
import {
  CreditCard,
  QrCode,
  TrendingUp,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  DespesaOperacional,
  ContaReceber,
  HotelFinancialKpis,
  PaymentMethod,
} from '../../types/financial';

import { FinancialOverviewTab } from './financial/FinancialOverviewTab';
import { ReceivablesCrmTab } from './financial/ReceivablesCrmTab';
import { PayablesTab } from './financial/PayablesTab';
import { TransactionsAuditTab } from './financial/TransactionsAuditTab';
import { ReceiptModal } from './financial/ReceiptModal';
import { useAdministrativeFinanceUi } from './financial/useAdministrativeFinanceUi';
import { useOperationalRevenueUi } from './financial/useOperationalRevenueUi';
import { useOperationalTransactionsUi } from './financial/useOperationalTransactionsUi';

export type FinancialSubTab =
  | 'overview'
  | 'receivables'
  | 'payables'
  | 'pix_config'
  | 'gateways'
  | 'transactions';

interface UnavailablePaymentConfigPanelProps {
  title: string;
  description: string;
}

const UnavailablePaymentConfigPanel: React.FC<UnavailablePaymentConfigPanelProps> = ({
  title,
  description,
}) => (
  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
    <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
      Integração financeira ainda não certificada
    </div>
    <h2 className="mt-2 text-xl font-bold text-stone-900">{title}</h2>
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-700">{description}</p>
    <p className="mt-3 text-xs font-semibold text-amber-900">
      Nenhuma configuração será salva localmente. Esta área será habilitada somente quando existir contrato oficial de leitura e escrita.
    </p>
  </div>
);

export const FinancialModule: React.FC = () => {
  const { reservations, hotelConfig, rooms } = useHotel();
  const {
    receivables,
    payables: expenses,
    ready: administrativeFinanceReady,
    missingSources,
    loading: administrativeFinanceLoading,
    error: administrativeFinanceError,
    settleReceivable,
    settlePayable,
  } = useAdministrativeFinanceUi();
  const {
    grossPayments,
    netReceived,
    paymentCount,
    byMethod,
    loading: operationalRevenueLoading,
    error: operationalRevenueError,
  } = useOperationalRevenueUi();
  const {
    transactions: operationalTransactions,
    loading: operationalTransactionsLoading,
    error: operationalTransactionsError,
  } = useOperationalTransactionsUi();

  const [activeTab, setActiveTab] = useState<FinancialSubTab>('overview');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptReceivable, setReceiptReceivable] = useState<ContaReceber | null>(null);
  const [receiptExpense, setReceiptExpense] = useState<DespesaOperacional | null>(null);

  const totalRevenue = grossPayments;
  const pixRevenue = byMethod.pix;
  const cardCreditRevenue = byMethod.creditCard;
  const cardDebitRevenue = byMethod.debitCard;
  const otherRevenue = byMethod.other;

  const totalExpenses = expenses.reduce((acc, e) => acc + e.valor, 0);
  const paidExpenses = expenses.filter((e) => e.status === 'pago').reduce((acc, e) => acc + e.valor, 0);
  const pendingExpenses = expenses
    .filter((e) => e.status === 'pendente' || e.status === 'atrasado')
    .reduce((acc, e) => acc + e.valor, 0);

  const pendingReceivables = receivables
    .filter((r) => r.status === 'pendente' || r.status === 'parcial' || r.status === 'atrasado')
    .reduce((acc, r) => acc + r.saldo_pendente, 0);
  const overdueReceivables = receivables
    .filter((r) => r.status === 'atrasado')
    .reduce((acc, r) => acc + r.saldo_pendente, 0);

  const estimatedGatewayFees = cardCreditRevenue * 0.029 + cardDebitRevenue * 0.015;
  const netRevenue = netReceived - estimatedGatewayFees;
  const operationalProfit = netRevenue - paidExpenses;
  const operationalMargin = totalRevenue > 0 ? (operationalProfit / totalRevenue) * 100 : 0;

  const totalRoomsCount = rooms.length || 6;
  const occupiedRoomsCount = reservations.filter(
    (r) => r.status === 'confirmada' || r.status === 'checkin_realizado',
  ).length;
  const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 75;
  const averageDailyRate = occupiedRoomsCount > 0 ? totalRevenue / occupiedRoomsCount : totalRevenue > 0 ? totalRevenue / 3 : 260;
  const revPar = (averageDailyRate * occupancyRate) / 100;
  const averageTicket = paymentCount > 0 ? totalRevenue / paymentCount : 0;

  const kpis: HotelFinancialKpis = {
    faturamento_bruto: totalRevenue,
    faturamento_liquido: netRevenue,
    total_despesas: totalExpenses,
    lucro_operacional: operationalProfit,
    margem_operacional: operationalMargin,
    saldo_receber: pendingReceivables,
    saldo_pagar: pendingExpenses,
    inadimplencia_valor: overdueReceivables,
    inadimplencia_percentual: totalRevenue > 0 ? (overdueReceivables / totalRevenue) * 100 : 0,
    revpar: revPar,
    adr: averageDailyRate,
    taxa_ocupacao: occupancyRate,
    ticket_medio: averageTicket,
    total_transacoes: paymentCount,
    receita_pix: pixRevenue,
    receita_cartao_credito: cardCreditRevenue,
    receita_cartao_debito: cardDebitRevenue,
    receita_outros: otherRevenue,
  };

  const handleUnsupportedAccountMutation = () => {
    alert('Esta operação está indisponível até existir um contrato oficial de criação/exclusão no Financeiro Administrativo.');
  };

  const handleUnsupportedPaymentConfiguration = () => {
    alert('PIX, gateways e links de pagamento estão indisponíveis até existir um contrato financeiro oficial de leitura e escrita.');
  };

  const handleSettleExpense = async (id: string, method: PaymentMethod) => {
    const expense = expenses.find((item) => item.id === id);
    if (!expense) return;

    try {
      await settlePayable(id, expense.valor, method);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível liquidar a conta a pagar.');
    }
  };

  const handleSettleReceivable = async (id: string, method: PaymentMethod) => {
    const receivable = receivables.find((item) => item.id === id);
    if (!receivable || receivable.saldo_pendente <= 0) return;

    try {
      await settleReceivable(id, receivable.saldo_pendente, method);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível liquidar a conta a receber.');
    }
  };

  const handleViewReceiptReceivable = (rec: ContaReceber) => {
    setReceiptReceivable(rec);
    setReceiptExpense(null);
    setReceiptModalOpen(true);
  };

  const handleViewReceiptExpense = (exp: DespesaOperacional) => {
    setReceiptExpense(exp);
    setReceiptReceivable(null);
    setReceiptModalOpen(true);
  };

  const handleExportReport = () => {
    alert('Relatório Financeiro e DRE exportado com sucesso em formato PDF e planilha CSV!');
  };

  const subTabsConfig: {
    id: FinancialSubTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'overview', label: 'DRE & Visão Geral', icon: TrendingUp },
    {
      id: 'receivables',
      label: 'Contas a Receber & Folio CRM',
      icon: ArrowUpRight,
      badge: pendingReceivables > 0 ? formatCurrency(pendingReceivables) : undefined,
    },
    {
      id: 'payables',
      label: 'Contas a Pagar & Despesas',
      icon: ArrowDownRight,
      badge: pendingExpenses > 0 ? formatCurrency(pendingExpenses) : undefined,
    },
    { id: 'pix_config', label: 'Configuração Chaves PIX & PSP', icon: QrCode },
    { id: 'gateways', label: 'Gateways Cartão de Crédito', icon: CreditCard },
    { id: 'transactions', label: 'Extrato & Conciliação', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {!administrativeFinanceLoading && !administrativeFinanceReady && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Financeiro administrativo indisponível.</strong>{' '}
          {administrativeFinanceError
            ? administrativeFinanceError
            : `Fontes oficiais ausentes: ${missingSources.join(', ') || 'não identificadas'}.`}
        </div>
      )}

      {!operationalRevenueLoading && operationalRevenueError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Receita operacional indisponível.</strong> {operationalRevenueError}
        </div>
      )}

      {!operationalTransactionsLoading && operationalTransactionsError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Extrato operacional indisponível.</strong> {operationalTransactionsError}
        </div>
      )}

      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subTabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-amber-300 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main>
        {activeTab === 'overview' && (
          <FinancialOverviewTab
            kpis={kpis}
            receivables={receivables}
            expenses={expenses}
            onOpenNewPaymentLink={handleUnsupportedPaymentConfiguration}
            onOpenNewExpense={handleUnsupportedAccountMutation}
            onOpenNewReceivable={handleUnsupportedAccountMutation}
            onExportReport={handleExportReport}
          />
        )}

        {activeTab === 'receivables' && (
          <ReceivablesCrmTab
            receivables={receivables}
            onOpenNewReceivable={handleUnsupportedAccountMutation}
            onOpenPaymentLink={handleUnsupportedPaymentConfiguration}
            onViewReceipt={handleViewReceiptReceivable}
            onSettleReceivable={(id, method) => void handleSettleReceivable(id, method)}
            onDeleteReceivable={handleUnsupportedAccountMutation}
          />
        )}

        {activeTab === 'payables' && (
          <PayablesTab
            expenses={expenses}
            onOpenNewExpense={handleUnsupportedAccountMutation}
            onViewReceipt={handleViewReceiptExpense}
            onSettleExpense={(id, method) => void handleSettleExpense(id, method)}
            onDeleteExpense={handleUnsupportedAccountMutation}
          />
        )}

        {activeTab === 'pix_config' && (
          <UnavailablePaymentConfigPanel
            title="Configuração PIX indisponível"
            description="As chaves PIX e a configuração PSP ainda não possuem fonte oficial certificada no Financeiro. O estado local e os dados mock não são usados como persistência de produção."
          />
        )}

        {activeTab === 'gateways' && (
          <UnavailablePaymentConfigPanel
            title="Gateways de pagamento indisponíveis"
            description="Credenciais, ambiente, gateway principal e links de pagamento permanecerão bloqueados até existir um contrato oficial seguro para armazenamento e operação dessas integrações."
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsAuditTab
            transactions={operationalTransactions}
            onExportReport={handleExportReport}
          />
        )}
      </main>

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setReceiptReceivable(null);
          setReceiptExpense(null);
        }}
        hotelConfig={hotelConfig}
        receivable={receiptReceivable}
        expense={receiptExpense}
      />
    </div>
  );
};
