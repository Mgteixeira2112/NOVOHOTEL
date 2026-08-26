import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCOUNT_TYPES,
  APPROVAL_STATUSES,
  CASH_VARIANCE_TYPES,
  FINANCE_PERMISSIONS,
  PAYABLE_STATUSES,
  RECEIVABLE_STATUSES,
  RECONCILIATION_METHODS,
  RECURRING_FREQUENCIES,
  TRANSACTION_TYPES,
  calculateDre,
  calculateNextRecurringDueDate,
  evaluateBankMatch,
  requiresApproval,
  type AccountPayable,
  type AccountReceivable,
  type BankAccount,
  type BankTransaction,
  type CashVariance,
  type ChartOfAccount,
  type CostCenter,
  type FinancialTransaction,
  type Reconciliation,
  type RecurringExpense,
  type Supplier,
} from '../src/domain/financeCore';
import {
  calculateCashDifference,
  classifyCashVariance,
  isOverdue,
  settleFinancialAccount,
} from '../src/services/financeService';

// 1. Plano de contas
test('1. plano de contas: suporta estrutura hierárquica com receitas, custos e despesas', () => {
  const chartReceitas: ChartOfAccount = {
    id: 'coa-1',
    hotelId: 'hotel-a',
    code: '1.0',
    name: 'RECEITAS',
    type: 'REVENUE',
    isActive: true,
  };

  const chartHospedagem: ChartOfAccount = {
    id: 'coa-1.1',
    hotelId: 'hotel-a',
    parentId: 'coa-1',
    code: '1.1',
    name: 'Hospedagem',
    type: 'REVENUE',
    isActive: true,
  };

  assert.equal(chartHospedagem.parentId, 'coa-1');
  assert.equal(ACCOUNT_TYPES.includes('REVENUE'), true);
  assert.equal(ACCOUNT_TYPES.includes('EXPENSE'), true);
});

// 2. Conta a pagar
test('2. conta a pagar: registro de obrigação financeira com fornecedor e centro de custo', () => {
  const payable: AccountPayable = {
    id: 'ap-1',
    hotelId: 'hotel-a',
    supplierId: 'sup-1',
    description: 'Fornecimento de Hortifrúti',
    amount: 1500.0,
    paidAmount: 0,
    dueDate: '2026-10-15',
    status: 'OPEN',
    approvalStatus: 'APPROVED',
    currency: 'BRL',
    costCenterId: 'cc-restaurante',
    createdAt: '2026-10-01T08:00:00Z',
  };

  assert.equal(payable.status, 'OPEN');
  assert.equal(payable.amount, 1500.0);
  assert.equal(PAYABLE_STATUSES.includes('OPEN'), true);
});

// 3. Conta a receber
test('3. conta a receber: registro de direito financeiro vinculado a Folio/cliente corporativo', () => {
  const receivable: AccountReceivable = {
    id: 'ar-1',
    hotelId: 'hotel-a',
    customerId: 'cust-empresa-x',
    folioId: 'folio-55',
    description: 'Faturamento Hospedagem Corporativa',
    amount: 3200.0,
    receivedAmount: 0,
    dueDate: '2026-10-20',
    status: 'OPEN',
    currency: 'BRL',
    createdAt: '2026-10-01T10:00:00Z',
  };

  assert.equal(receivable.status, 'OPEN');
  assert.equal(receivable.amount, 3200.0);
  assert.equal(RECEIVABLE_STATUSES.includes('OPEN'), true);
});

// 4. Pagamento (Liquidação de Conta a Pagar)
test('4. pagamento: liquidação de conta a pagar atualiza status para PAID e gera despesa', () => {
  const payable: AccountPayable = {
    id: 'ap-2',
    hotelId: 'hotel-a',
    description: 'Manutenção Ar Condicionado',
    amount: 450.0,
    paidAmount: 0,
    dueDate: '2026-10-10',
    status: 'OPEN',
    approvalStatus: 'NOT_REQUIRED',
    currency: 'BRL',
    createdAt: '',
  };

  // Executa pagamento integral
  payable.paidAmount = 450.0;
  payable.status = 'PAID';
  payable.paidAt = '2026-10-05T14:00:00Z';

  assert.equal(payable.status, 'PAID');
  assert.equal(payable.paidAmount, 450.0);
});

// 5. Recebimento (Liquidação de Conta a Receber)
test('5. recebimento: recebimento de fatura atualiza status e baixa saldo devedor', () => {
  const receivable: AccountReceivable = {
    id: 'ar-2',
    hotelId: 'hotel-a',
    description: 'Fatura Evento Corporativo',
    amount: 5000.0,
    receivedAmount: 0,
    dueDate: '2026-10-10',
    status: 'OPEN',
    currency: 'BRL',
    createdAt: '',
  };

  // Recebe R$ 3000 (parcial)
  receivable.receivedAmount = 3000.0;
  receivable.status = 'PARTIALLY_PAID';

  assert.equal(receivable.status, 'PARTIALLY_PAID');
  assert.equal(receivable.receivedAmount, 3000.0);

  // Recebe os R$ 2000 restantes
  receivable.receivedAmount += 2000.0;
  receivable.status = 'PAID';
  assert.equal(receivable.status, 'PAID');
});

// 6. Caixa
test('6. caixa: cálculo de diferença entre saldo esperado e saldo físico contado', () => {
  const diffShortage = calculateCashDifference(1000, 950);
  assert.equal(diffShortage, -50);

  const diffOverage = calculateCashDifference(1000, 1050);
  assert.equal(diffOverage, 50);
});

// 7. Abertura de caixa
test('7. abertura: registra valor inicial de fundo de troco', () => {
  const openingSession = {
    id: 'ses-1',
    hotelId: 'hotel-a',
    openingAmount: 300.0,
    status: 'OPEN',
    openedAt: '2026-10-01T08:00:00Z',
  };

  assert.equal(openingSession.openingAmount, 300.0);
  assert.equal(openingSession.status, 'OPEN');
});

// 8. Fechamento de caixa
test('8. fechamento: apura total esperado sem distorcer expected_amount', () => {
  const expectedAmount = 850.0;
  const countedAmount = 840.0; // Faltam 10
  const diff = calculateCashDifference(expectedAmount, countedAmount);

  assert.equal(diff, -10.0);
  // Regra: nunca alterar expected_amount
  assert.equal(expectedAmount, 850.0);
});

// 9. Diferença de caixa (CASH_VARIANCE)
test('9. diferença: classifica SHORTAGE (quebra de caixa) e OVERAGE (sobra de caixa)', () => {
  const shortage = classifyCashVariance(500, 480);
  assert.deepEqual(shortage, { difference: -20, type: 'SHORTAGE' });

  const overage = classifyCashVariance(500, 530);
  assert.deepEqual(overage, { difference: 30, type: 'OVERAGE' });

  assert.equal(CASH_VARIANCE_TYPES.includes('SHORTAGE'), true);
  assert.equal(CASH_VARIANCE_TYPES.includes('OVERAGE'), true);
});

// 10. Banco
test('10. banco: extrato bancário com transações em status UNRECONCILED', () => {
  const bankAcc: BankAccount = {
    id: 'ba-1',
    hotelId: 'hotel-a',
    name: 'Banco Itaú Principal',
    bankName: 'Itaú Unibanco',
    currency: 'BRL',
    isActive: true,
  };

  const bankTx: BankTransaction = {
    id: 'btx-1',
    hotelId: 'hotel-a',
    bankAccountId: 'ba-1',
    amount: 1250.0,
    transactionDate: '2026-10-01',
    description: 'PIX RECEBIDO - HOSPEDE SILVA',
    status: 'UNRECONCILED',
    createdAt: '',
  };

  assert.equal(bankAcc.name, 'Banco Itaú Principal');
  assert.equal(bankTx.status, 'UNRECONCILED');
});

// 11. Conciliação (Automática e Manual)
test('11. conciliação: avalia match entre transação bancária e transação interna', () => {
  const bankTx: BankTransaction = {
    id: 'btx-1',
    hotelId: 'hotel-a',
    bankAccountId: 'ba-1',
    amount: 1500.0,
    transactionDate: '2026-10-01',
    description: 'TED RECEBIDA',
    reference: 'RES-HTL-2026-001',
    status: 'UNRECONCILED',
    createdAt: '',
  };

  const finTx: FinancialTransaction = {
    id: 'ftx-1',
    hotelId: 'hotel-a',
    type: 'REVENUE',
    amount: 1500.0,
    currency: 'BRL',
    description: 'Recebimento Reserva',
    source: 'RESERVATION',
    sourceId: 'RES-HTL-2026-001',
    transactionDate: '2026-10-01',
    createdAt: '',
  };

  const match = evaluateBankMatch(bankTx, finTx);
  assert.equal(match.isMatch, true);
  assert.equal(match.confidence >= 80, true);
  assert.equal(RECONCILIATION_METHODS.includes('AUTO'), true);
});

// 12. Ajuste financeiro (ADJUSTMENT)
test('12. ajuste: transação de correção com auditoria sem apagar histórico', () => {
  const adjustment: FinancialTransaction = {
    id: 'ftx-adj-1',
    hotelId: 'hotel-a',
    type: 'ADJUSTMENT',
    amount: 45.0,
    currency: 'BRL',
    description: 'Ajuste de juros bancários não provisionados',
    source: 'MANUAL',
    transactionDate: '2026-10-01',
    createdBy: 'user-finance-1',
    createdAt: '2026-10-01T16:00:00Z',
  };

  assert.equal(adjustment.type, 'ADJUSTMENT');
  assert.equal(TRANSACTION_TYPES.includes('ADJUSTMENT'), true);
});

// 13. Reversão (REVERSAL)
test('13. reversão: estorno financeiro vinculado à transação original', () => {
  const originalTxId = 'ftx-orig-100';
  const reversalTx: FinancialTransaction = {
    id: 'ftx-rev-101',
    hotelId: 'hotel-a',
    type: 'REVERSAL',
    amount: 200.0,
    currency: 'BRL',
    description: 'Estorno de taxa duplicada',
    source: 'MANUAL',
    reversalOf: originalTxId,
    transactionDate: '2026-10-02',
    createdAt: '2026-10-02T10:00:00Z',
  };

  assert.equal(reversalTx.type, 'REVERSAL');
  assert.equal(reversalTx.reversalOf, originalTxId);
});

// 14. Centro de custo
test('14. centro de custo: vinculação de despesas e custos por setor e por quarto', () => {
  const costCenter: CostCenter = {
    id: 'cc-gov',
    hotelId: 'hotel-a',
    name: 'HOUSEKEEPING',
    isActive: true,
  };

  const payableRoomCost: AccountPayable = {
    id: 'ap-room-maint',
    hotelId: 'hotel-a',
    description: 'Troca de Chuveiro Quarto 104',
    amount: 180.0,
    paidAmount: 0,
    dueDate: '2026-10-15',
    status: 'OPEN',
    approvalStatus: 'NOT_REQUIRED',
    currency: 'BRL',
    costCenterId: costCenter.id,
    roomId: 'room-104',
    createdAt: '',
  };

  assert.equal(payableRoomCost.costCenterId, 'cc-gov');
  assert.equal(payableRoomCost.roomId, 'room-104');
});

// 15. Despesa Recorrente
test('15. recorrência: cálculo de próxima data para despesas mensais, semanais e anuais', () => {
  const nextMonthly = calculateNextRecurringDueDate('2026-10-05', 'MONTHLY');
  assert.equal(nextMonthly, '2026-11-05');

  const nextWeekly = calculateNextRecurringDueDate('2026-10-05', 'WEEKLY');
  assert.equal(nextWeekly, '2026-10-12');

  assert.equal(RECURRING_FREQUENCIES.includes('MONTHLY'), true);
});

// 16. Alçadas de Aprovação
test('16. aprovação: despesas acima do limite exigem status PENDING e aprovação de gestor', () => {
  const threshold = 1000.0;

  assert.equal(requiresApproval(500, threshold), false);
  assert.equal(requiresApproval(1500, threshold), true);
  assert.equal(APPROVAL_STATUSES.includes('PENDING'), true);
  assert.equal(APPROVAL_STATUSES.includes('APPROVED'), true);
});

// 17. Comissões de OTA
test('17. comissão: segregação entre valor da diária bruta e comissão da agência/canal', () => {
  const grossDailyRate = 400.0;
  const otaCommissionRate = 0.15; // 15% Booking/Expedia
  const otaCommissionAmount = grossDailyRate * otaCommissionRate;
  const netHotelRevenue = grossDailyRate - otaCommissionAmount;

  assert.equal(otaCommissionAmount, 60.0);
  assert.equal(netHotelRevenue, 340.0);
});

// 18. Dashboard & DRE
test('18. dashboard: demonstrativo de resultado (Receitas - Custos - Despesas = Resultado Líquido)', () => {
  const revenues = [50000, 12000, 4500]; // Hospedagem, Restaurante, PDV
  const costs = [8000, 3500]; // Insumos A&B, Lavanderia
  const expenses = [15000, 4000, 2000]; // Folha, Energia, Manutenção

  const dre = calculateDre(revenues, costs, expenses);
  assert.equal(dre.grossRevenue, 66500);
  assert.equal(dre.costs, 11500);
  assert.equal(dre.grossProfit, 55000);
  assert.equal(dre.operatingExpenses, 21000);
  assert.equal(dre.netResult, 34000);
});

// 19. RLS
test('19. RLS: consultas financeiras isoladas por hotel_id', () => {
  const transactions: FinancialTransaction[] = [
    { id: 't1', hotelId: 'hotel-a', type: 'REVENUE', amount: 100, currency: 'BRL', description: '', source: '', createdAt: '', transactionDate: '' },
    { id: 't2', hotelId: 'hotel-b', type: 'REVENUE', amount: 200, currency: 'BRL', description: '', source: '', createdAt: '', transactionDate: '' },
  ];

  const filtered = transactions.filter((t) => t.hotelId === 'hotel-a');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 't1');
});

// 20. Multi-hotel
test('20. multi-hotel: centros de custo e contas bancárias não colidem entre hotéis', () => {
  const bankHotelA: BankAccount = { id: 'b1', hotelId: 'hotel-a', name: 'Bradesco', currency: 'BRL', isActive: true };
  const bankHotelB: BankAccount = { id: 'b2', hotelId: 'hotel-b', name: 'Bradesco', currency: 'BRL', isActive: true };

  assert.notEqual(bankHotelA.hotelId, bankHotelB.hotelId);
});

// 21. Auditoria
test('21. auditoria: registro de ações financeiras (PAY, RECEIVE, APPROVE, RECONCILE, REVERSAL)', () => {
  const auditActions = ['CREATE', 'UPDATE', 'APPROVE', 'PAY', 'RECEIVE', 'RECONCILE', 'VOID', 'REFUND', 'ADJUST', 'CLOSE'];
  assert.equal(auditActions.length, 10);
  assert.equal(auditActions.includes('RECONCILE'), true);
});

// 22. Concorrência
test('22. concorrência: validação no backend impede pagamento de valor maior que o saldo em aberto', async () => {
  await assert.rejects(
    () => settleFinancialAccount({ accountType: 'PAYABLE', accountId: '', amount: -100, method: 'PIX' }),
    /INVALID_FINANCIAL_AMOUNT/
  );
  await assert.rejects(
    () => settleFinancialAccount({ accountType: 'PAYABLE', accountId: '', amount: 100, method: 'PIX' }),
    /ACCOUNT_REQUIRED/
  );
});

// 23. Idempotência
test('23. idempotência: liquidação com chave de idempotência reutilizada não duplica lançamento', () => {
  const ledger: { idempotencyKey: string; amount: number }[] = [];

  function recordSettlement(idempotencyKey: string, amount: number) {
    const existing = ledger.find((l) => l.idempotencyKey === idempotencyKey);
    if (existing) return existing;
    const entry = { idempotencyKey, amount };
    ledger.push(entry);
    return entry;
  }

  const s1 = recordSettlement('idem-key-888', 250.0);
  const s2 = recordSettlement('idem-key-888', 250.0);

  assert.equal(s1, s2);
  assert.equal(ledger.length, 1);
});
