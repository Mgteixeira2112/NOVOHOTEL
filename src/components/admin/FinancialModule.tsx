import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext';
import { formatCurrency } from '../../utils/formatters';
import { 
  DollarSign, 
  CreditCard, 
  QrCode, 
  TrendingUp, 
  Download, 
  Layers, 
  FileText, 
  Sliders, 
  Key, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Link as LinkIcon,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  DespesaOperacional, 
  ContaReceber, 
  PixKeyConfig, 
  PixPspConfig, 
  GatewayConfig, 
  PaymentLink, 
  HotelFinancialKpis,
  PaymentMethod 
} from '../../types/financial';
import { 
  INITIAL_EXPENSES, 
  INITIAL_RECEIVABLES, 
  INITIAL_PIX_KEYS, 
  INITIAL_PIX_PSP, 
  INITIAL_GATEWAY_CONFIGS, 
  INITIAL_PAYMENT_LINKS 
} from '../../data/mockFinancialData';

import { FinancialOverviewTab } from './financial/FinancialOverviewTab';
import { ReceivablesCrmTab } from './financial/ReceivablesCrmTab';
import { PayablesTab } from './financial/PayablesTab';
import { PixConfigTab } from './financial/PixConfigTab';
import { CreditCardGatewaysTab } from './financial/CreditCardGatewaysTab';
import { TransactionsAuditTab } from './financial/TransactionsAuditTab';
import { PaymentLinkModal } from './financial/PaymentLinkModal';
import { NewExpenseModal } from './financial/NewExpenseModal';
import { NewReceivableModal } from './financial/NewReceivableModal';
import { ReceiptModal } from './financial/ReceiptModal';

export type FinancialSubTab = 
  | 'overview' 
  | 'receivables' 
  | 'payables' 
  | 'pix_config' 
  | 'gateways' 
  | 'transactions';

export const FinancialModule: React.FC = () => {
  const { payments, reservations, guests, hotelConfig, rooms } = useHotel();

  // Sub-abas do módulo financeiro
  const [activeTab, setActiveTab] = useState<FinancialSubTab>('overview');

  // Estado das Contas e Configurações com LocalStorage
  const [expenses, setExpenses] = useState<DespesaOperacional[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_EXPENSES_V1');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [receivables, setReceivables] = useState<ContaReceber[]>(() => {
    try {
      const saved = localStorage.getItem('ITAJUBA_PMS_RECEIVABLES_V1');
      return saved ? JSON.parse(saved) : INITIAL_RECEIVABLES;
    } catch {
      return INITIAL_RECEIVABLES;
    }
  });

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

  // Salvar no localStorage sempre que alterar
  useEffect(() => {
    try {
      localStorage.setItem('ITAJUBA_PMS_EXPENSES_V1', JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('ITAJUBA_PMS_RECEIVABLES_V1', JSON.stringify(receivables));
    } catch (e) {
      console.error(e);
    }
  }, [receivables]);

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

  // Modais
  const [paymentLinkModalOpen, setPaymentLinkModalOpen] = useState(false);
  const [selectedReceivableForLink, setSelectedReceivableForLink] = useState<ContaReceber | null>(null);

  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);
  const [newReceivableModalOpen, setNewReceivableModalOpen] = useState(false);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptReceivable, setReceiptReceivable] = useState<ContaReceber | null>(null);
  const [receiptExpense, setReceiptExpense] = useState<DespesaOperacional | null>(null);

  // Cálculos de Indicadores Financeiros e KPIs Hoteleiros (PMS)
  const approvedPayments = payments.filter((p) => p.status === 'aprovado');
  const totalRevenue = approvedPayments.reduce((acc, p) => acc + p.valor, 0);

  const pixRevenue = approvedPayments.filter((p) => p.metodo === 'pix').reduce((acc, p) => acc + p.valor, 0);
  const cardCreditRevenue = approvedPayments.filter((p) => p.metodo === 'cartao_credito').reduce((acc, p) => acc + p.valor, 0);
  const cardDebitRevenue = approvedPayments.filter((p) => p.metodo === 'cartao_debito').reduce((acc, p) => acc + p.valor, 0);
  const otherRevenue = approvedPayments.filter((p) => p.metodo !== 'pix' && p.metodo !== 'cartao_credito' && p.metodo !== 'cartao_debito').reduce((acc, p) => acc + p.valor, 0);

  // Custos Operacionais
  const totalExpenses = expenses.reduce((acc, e) => acc + e.valor, 0);
  const paidExpenses = expenses.filter(e => e.status === 'pago').reduce((acc, e) => acc + e.valor, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pendente' || e.status === 'atrasado').reduce((acc, e) => acc + e.valor, 0);

  // Recebíveis
  const pendingReceivables = receivables.filter(r => r.status === 'pendente' || r.status === 'parcial' || r.status === 'atrasado').reduce((acc, r) => acc + r.saldo_pendente, 0);
  const overdueReceivables = receivables.filter(r => r.status === 'atrasado').reduce((acc, r) => acc + r.saldo_pendente, 0);

  // Deduções MDR Estimadas de Cartão
  const estimatedGatewayFees = (cardCreditRevenue * 0.029) + (cardDebitRevenue * 0.015);
  const netRevenue = totalRevenue - estimatedGatewayFees;
  const operationalProfit = netRevenue - paidExpenses;
  const operationalMargin = totalRevenue > 0 ? (operationalProfit / totalRevenue) * 100 : 0;

  // RevPAR & ADR
  const totalRoomsCount = rooms.length || 6;
  const occupiedRoomsCount = reservations.filter(r => r.status === 'confirmada' || r.status === 'checkin_realizado').length;
  const occupancyRate = totalRoomsCount > 0 ? (occupiedRoomsCount / totalRoomsCount) * 100 : 75;
  const averageDailyRate = occupiedRoomsCount > 0 ? totalRevenue / occupiedRoomsCount : (totalRevenue > 0 ? totalRevenue / 3 : 260);
  const revPar = (averageDailyRate * occupancyRate) / 100;
  const averageTicket = approvedPayments.length > 0 ? totalRevenue / approvedPayments.length : 0;

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
    total_transacoes: approvedPayments.length,
    receita_pix: pixRevenue,
    receita_cartao_credito: cardCreditRevenue,
    receita_cartao_debito: cardDebitRevenue,
    receita_outros: otherRevenue
  };

  const primaryPixKey = pixKeys.find(k => k.ativo) || pixKeys[0];
  const primaryGateway = (Object.values(gateways) as GatewayConfig[]).find(g => g.is_primary) || (Object.values(gateways) as GatewayConfig[])[0];

  // Ações de Contas a Pagar
  const handleAddExpense = (expenseData: Omit<DespesaOperacional, 'id' | 'created_at'>) => {
    const newExp: DespesaOperacional = {
      ...expenseData,
      id: 'desp-' + Date.now(),
      created_at: new Date().toISOString()
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const handleSettleExpense = (id: string, method: PaymentMethod) => {
    setExpenses(prev => prev.map(e => e.id === id ? {
      ...e,
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      metodo_pagamento: method
    } : e));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Ações de Contas a Receber
  const handleAddReceivable = (recData: Omit<ContaReceber, 'id' | 'created_at'>) => {
    const newRec: ContaReceber = {
      ...recData,
      id: 'rec-' + Date.now(),
      created_at: new Date().toISOString()
    };
    setReceivables(prev => [newRec, ...prev]);
  };

  const handleSettleReceivable = (id: string, method: PaymentMethod) => {
    setReceivables(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'recebido',
      saldo_pendente: 0,
      valor_pago: r.valor_total,
      data_pagamento: new Date().toISOString(),
      metodo_pagamento: method
    } : r));
  };

  const handleDeleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
  };

  // Abrir Modal de Link de Pagamento para Recebível específico
  const handleOpenPaymentLinkForReceivable = (rec?: ContaReceber) => {
    setSelectedReceivableForLink(rec || null);
    setPaymentLinkModalOpen(true);
  };

  // Visualizar Recibo
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

  // Simulação de Recebimento de Webhook PIX
  const handleSimulateWebhookPixReceived = (amount: number, txId: string) => {
    const newRec: ContaReceber = {
      id: 'rec-wh-' + Date.now(),
      codigo_reserva: txId,
      hospede_nome: 'Pagamento PIX Instantâneo via Webhook',
      hospede_telefone: '(35) 99999-0000',
      categoria: 'diaria_hospedagem',
      descricao: `Recebimento PIX Confirmado (TXID: ${txId})`,
      valor_total: amount,
      valor_pago: amount,
      saldo_pendente: 0,
      data_vencimento: new Date().toISOString().split('T')[0],
      data_pagamento: new Date().toISOString(),
      status: 'recebido',
      metodo_pagamento: 'pix',
      created_at: new Date().toISOString()
    };
    setReceivables(prev => [newRec, ...prev]);
  };

  const handleExportReport = () => {
    alert('Relatório Financeiro e DRE exportado com sucesso em formato PDF e planilha CSV!');
  };

  // Abas de Navegação do Módulo Financeiro
  const subTabsConfig: { id: FinancialSubTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'overview', label: 'DRE & Visão Geral', icon: TrendingUp },
    { id: 'receivables', label: 'Contas a Receber & Folio CRM', icon: ArrowUpRight, badge: pendingReceivables > 0 ? formatCurrency(pendingReceivables) : undefined },
    { id: 'payables', label: 'Contas a Pagar & Despesas', icon: ArrowDownRight, badge: pendingExpenses > 0 ? formatCurrency(pendingExpenses) : undefined },
    { id: 'pix_config', label: 'Configuração Chaves PIX & PSP', icon: QrCode },
    { id: 'gateways', label: 'Gateways Cartão de Crédito', icon: CreditCard },
    { id: 'transactions', label: 'Extrato & Conciliação', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      
      {/* Sub-navegação do Módulo Financeiro */}
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
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 text-stone-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Sub-aba Ativa */}
      <main>
        {activeTab === 'overview' && (
          <FinancialOverviewTab
            kpis={kpis}
            receivables={receivables}
            expenses={expenses}
            onOpenNewPaymentLink={() => handleOpenPaymentLinkForReceivable()}
            onOpenNewExpense={() => setNewExpenseModalOpen(true)}
            onOpenNewReceivable={() => setNewReceivableModalOpen(true)}
            onExportReport={handleExportReport}
          />
        )}

        {activeTab === 'receivables' && (
          <ReceivablesCrmTab
            receivables={receivables}
            onOpenNewReceivable={() => setNewReceivableModalOpen(true)}
            onOpenPaymentLink={(rec) => handleOpenPaymentLinkForReceivable(rec)}
            onViewReceipt={handleViewReceiptReceivable}
            onSettleReceivable={handleSettleReceivable}
            onDeleteReceivable={handleDeleteReceivable}
          />
        )}

        {activeTab === 'payables' && (
          <PayablesTab
            expenses={expenses}
            onOpenNewExpense={() => setNewExpenseModalOpen(true)}
            onViewReceipt={handleViewReceiptExpense}
            onSettleExpense={handleSettleExpense}
            onDeleteExpense={handleDeleteExpense}
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
            payments={payments}
            reservations={reservations}
            guests={guests}
            expenses={expenses}
            onExportReport={handleExportReport}
          />
        )}
      </main>

      {/* Modal: Gerador de Link de Pagamento & PIX Instantâneo */}
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
        onSavePaymentLink={(newLink) => setPaymentLinks(prev => [newLink, ...prev])}
      />

      {/* Modal: Nova Conta a Pagar / Despesa */}
      <NewExpenseModal
        isOpen={newExpenseModalOpen}
        onClose={() => setNewExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
      />

      {/* Modal: Nova Conta a Receber */}
      <NewReceivableModal
        isOpen={newReceivableModalOpen}
        onClose={() => setNewReceivableModalOpen(false)}
        onAddReceivable={handleAddReceivable}
      />

      {/* Modal: Recibo Oficial e Comprovante */}
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
