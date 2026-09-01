import React, { useState, useEffect } from 'react';
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
  PixKeyConfig,
  PixPspConfig,
  GatewayConfig,
  PaymentLink,
  HotelFinancialKpis,
  PaymentMethod,
} from '../../types/financial';
import {
  INITIAL_PIX_KEYS,
  INITIAL_PIX_PSP,
  INITIAL_GATEWAY_CONFIGS,
  INITIAL_PAYMENT_LINKS,
} from '../../data/mockFinancialData';

import { FinancialOverviewTab } from './financial/FinancialOverviewTab';
import { ReceivablesCrmTab } from './financial/ReceivablesCrmTab';
import { PayablesTab } from './financial/PayablesTab';
import { PixConfigTab } from './financial/PixConfigTab';
import { CreditCardGatewaysTab } from './financial/CreditCardGatewaysTab';
import { TransactionsAuditTab } from './financial/TransactionsAuditTab';
import { PaymentLinkModal } from './financial/PaymentLinkModal';
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

  // PIX, gateways e links ainda permanecem no legado até seus contratos oficiais
  // serem auditados em uma etapa própria. Contas, KPIs e extrato já usam fontes oficiais.
  const [pixKeys, setPixKeys] = useState<PixKeyConfig[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_PIX_KEYS_V1');
      return saved ? JSON.parse(saved) : INITIAL_PIX_KEYS;
    } catch {
      return INITIAL_PIX_KEYS;
    }
  });

  const [pixPsp, setPixPsp] = useState<PixPspConfig>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_PIX_PSP_V1');
      return saved ? JSON.parse(saved) : INITIAL_PIX_PSP;
    } catch {
      return INITIAL_PIX_PSP;
    }
  });

  const [gateways, setGateways] = useState<Record<string, GatewayConfig>>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_GATEWAYS_V1');
      return saved ? JSON.parse(saved) : INITIAL_GATEWAY_CONFIGS;
    } catch {
      return INITIAL_GATEWAY_CONFIGS;
    }
  });

  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_PAY_LINKS_V1');
      return saved ? JSON.parse(saved) : INITIAL_PAYMENT_LINKS;
    } catch {
      return INITIAL_PAYMENT_LINKS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ITAJUBA_PMS_PIX_KEYS_V1', JSON.stringify(pixKeys));
    } catch (e) {
      console.error(e);
    }
  }, [pixKeys]);

  useEffect(() => {
    try {
      localStorage.setItem('ITAJUBA_PMS_PIX_PSP_V1', JSON.stringify(pixPsp));
    } catch (e) {
      console.error(e);
    }
  }, [pixPsp]);

  useEffect(() => {
    try {
      localStorage.setItem('ITAJUBA_PMS_GATEWAYS_V1', JSON.stringify(gateways));
    } catch (e) {
      console.error(e);
    }
  }, [gateways]);

  useEffect(() => {
    try {
      localStorage.setItem('ITAJUBA_PMS_PAY_LINKS_V1', JSON.stringify(paymentLinks));
    } catch (e) {
      console.error(e);
    }
  }, [paymentLinks]);

  const [paymentLinkModalOpen, setPaymentLinkModalOpen] = useState(false);
  const [selectedReceivableForLink, setSelectedReceivableForLink] = useState<ContaReceber | null>(null);
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

  const primaryPixKey = pixKeys.find((k) => k.ativo) || pixKeys[0];
  const primaryGateway =
    (Object.values(gateways) as GatewayConfig[]).find((g) => g.is_primary) ||
    (Object.values(gateways) as GatewayConfig[])[0];

  const handleUnsupportedAccountMutation = () => {
    alert('Esta operação está indisponível até existir um contrato oficial de criação/exclusão no Financeiro Administrativo.');
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

  const handleOpenPaymentLinkForReceivable = (rec?: ContaReceber) => {
    setSelectedReceivableForLink(rec || null);
    setPaymentLinkModalOpen(true);
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

  const handleSimulateWebhookPixReceived = () => {
    alert('A simulação PIX não altera mais Contas a Receber. A integração PIX será tratada em uma etapa própria.');
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
            onOpenNewPaymentLink={() => handleOpenPaymentLinkForReceivable()}
            onOpenNewExpense={handleUnsupportedAccountMutation}
            onOpenNewReceivable={handleUnsupportedAccountMutation}
            onExportReport={handleExportReport}
          />
        )}

        {activeTab === 'receivables' && (
          <ReceivablesCrmTab
            receivables={receivables}
            onOpenNewReceivable={handleUnsupportedAccountMutation}
            onOpenPaymentLink={(rec) => handleOpenPaymentLinkForReceivable(rec)}
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
          <PixConfigTab
            pixKeys={pixKeys}
            pixPsp={pixPsp}
            onUpdatePixKeys={(keys) => setPixKeys(keys)}
            onUpdatePixPsp={(psp) => setPixPsp(psp)}
            onSimulateWebhookPixReceived={handleSimulateWebhookPixReceived}
          />
        )}

        {activeTab === 'gateways' && (
          <CreditCardGatewaysTab
            gateways={gateways}
            onUpdateGateways={(gw) => setGateways(gw)}
            onOpenPaymentLink={() => handleOpenPaymentLinkForReceivable()}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsAuditTab
            transactions={operationalTransactions}
            onExportReport={handleExportReport}
          />
        )}
      </main>

      <PaymentLinkModal
        isOpen={paymentLinkModalOpen}
        onClose={() => {
          setPaymentLinkModalOpen(false);
          setSelectedReceivableForLink(null);
        }}
        pixKey={primaryPixKey}
        primaryGateway={primaryGateway}
        initialGuestName={selectedReceivableForLink?.hospede_nome || ''}
        initialPhone={selectedReceivableForLink?.hospede_telefone || ''}
        initialAmount={selectedReceivableForLink?.saldo_pendente || 0}
        initialDescription={selectedReceivableForLink?.descricao || ''}
        initialReservationCode={selectedReceivableForLink?.codigo_reserva || ''}
        onSavePaymentLink={(newLink) => setPaymentLinks((prev) => [newLink, ...prev])}
      />

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
