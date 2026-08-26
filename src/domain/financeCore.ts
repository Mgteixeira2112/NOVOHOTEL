export const ACCOUNT_TYPES = ['REVENUE', 'COST', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY'] as const;
export type ChartAccountType = typeof ACCOUNT_TYPES[number];

export const RECEIVABLE_STATUSES = ['OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export type ReceivableStatus = typeof RECEIVABLE_STATUSES[number];

export const PAYABLE_STATUSES = ['OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export type PayableStatus = typeof PAYABLE_STATUSES[number];

export const APPROVAL_STATUSES = ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export const TRANSACTION_TYPES = [
  'REVENUE',
  'EXPENSE',
  'TRANSFER',
  'ADJUSTMENT',
  'REFUND',
  'REVERSAL',
] as const;
export type FinancialTransactionType = typeof TRANSACTION_TYPES[number];

export const CASH_VARIANCE_TYPES = ['SHORTAGE', 'OVERAGE'] as const;
export type CashVarianceType = typeof CASH_VARIANCE_TYPES[number];

export const RECONCILIATION_METHODS = ['AUTO', 'MANUAL'] as const;
export type ReconciliationMethod = typeof RECONCILIATION_METHODS[number];

export const RECURRING_FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
export type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

export const FINANCE_PERMISSIONS = [
  'FINANCE_VIEW',
  'FINANCE_CREATE',
  'FINANCE_EDIT',
  'FINANCE_APPROVE',
  'FINANCE_PAY',
  'FINANCE_RECEIVE',
  'FINANCE_RECONCILE',
  'FINANCE_CLOSE',
  'FINANCE_REPORT',
] as const;
export type FinancePermission = typeof FINANCE_PERMISSIONS[number];

export interface ChartOfAccount {
  id: string;
  hotelId: string;
  parentId?: string | null;
  code: string;
  name: string;
  type: ChartAccountType;
  isActive: boolean;
}

export interface CostCenter {
  id: string;
  hotelId: string;
  code?: string | null;
  name: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  hotelId: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AccountReceivable {
  id: string;
  hotelId: string;
  customerId?: string | null;
  folioId?: string | null;
  description: string;
  amount: number;
  receivedAmount: number;
  dueDate: string;
  status: ReceivableStatus;
  currency: string;
  source?: string | null;
  sourceId?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface AccountPayable {
  id: string;
  hotelId: string;
  supplierId?: string | null;
  description: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: PayableStatus;
  approvalStatus: ApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  currency: string;
  costCenterId?: string | null;
  roomId?: string | null;
  source?: string | null;
  sourceId?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

export interface FinancialTransaction {
  id: string;
  hotelId: string;
  type: FinancialTransactionType;
  accountId?: string | null;
  costCenterId?: string | null;
  roomId?: string | null;
  amount: number;
  currency: string;
  description: string;
  source: string;
  sourceId?: string | null;
  transactionDate: string;
  createdBy?: string | null;
  reversalOf?: string | null;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  hotelId: string;
  name: string;
  bankName?: string | null;
  currency: string;
  isActive: boolean;
}

export interface BankTransaction {
  id: string;
  hotelId: string;
  bankAccountId: string;
  externalId?: string | null;
  amount: number;
  transactionDate: string;
  description?: string | null;
  reference?: string | null;
  document?: string | null;
  status: 'UNRECONCILED' | 'RECONCILED' | 'IGNORED';
  createdAt: string;
}

export interface Reconciliation {
  id: string;
  hotelId: string;
  bankTransactionId: string;
  financialTransactionId: string;
  method: ReconciliationMethod;
  confidence?: number | null;
  reconciledBy?: string | null;
  reconciledAt: string;
}

export interface CashVariance {
  id: string;
  hotelId: string;
  cashSessionId?: string | null;
  type: CashVarianceType;
  expectedAmount: number;
  countedAmount: number;
  difference: number;
  reason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  hotelId: string;
  supplierId?: string | null;
  description: string;
  amount: number;
  currency: string;
  frequency: RecurringFrequency;
  nextDueDate: string;
  costCenterId?: string | null;
  isActive: boolean;
}

export interface DreReport {
  grossRevenue: number;
  costs: number;
  grossProfit: number;
  operatingExpenses: number;
  netResult: number;
}

/**
 * Verifica se um título a pagar exige aprovação baseado no valor e regra
 */
export function requiresApproval(amount: number, approvalThreshold: number = 1000): boolean {
  return amount >= approvalThreshold;
}

/**
 * Gera próxima data de vencimento para despesa recorrente
 */
export function calculateNextRecurringDueDate(currentDueDate: string, frequency: RecurringFrequency): string {
  const d = new Date(currentDueDate + 'T00:00:00Z');
  switch (frequency) {
    case 'WEEKLY':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'MONTHLY':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'QUARTERLY':
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case 'YEARLY':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

/**
 * Calcula DRE simplificado (Demonstrativo do Resultado do Exercício)
 */
export function calculateDre(
  revenues: number[],
  costs: number[],
  expenses: number[]
): DreReport {
  const grossRevenue = Math.round(revenues.reduce((a, b) => a + b, 0) * 100) / 100;
  const totalCosts = Math.round(costs.reduce((a, b) => a + b, 0) * 100) / 100;
  const grossProfit = Math.round((grossRevenue - totalCosts) * 100) / 100;
  const operatingExpenses = Math.round(expenses.reduce((a, b) => a + b, 0) * 100) / 100;
  const netResult = Math.round((grossProfit - operatingExpenses) * 100) / 100;

  return {
    grossRevenue,
    costs: totalCosts,
    grossProfit,
    operatingExpenses,
    netResult,
  };
}

/**
 * Avalia match de conciliação bancária automática
 */
export function evaluateBankMatch(
  bankTx: BankTransaction,
  financialTx: FinancialTransaction
): { isMatch: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Valor idêntico
  if (Math.abs(bankTx.amount) === Math.abs(financialTx.amount)) {
    score += 50;
    reasons.push('Valor idêntico');
  }

  // Data igual ou próxima (+/- 2 dias)
  if (bankTx.transactionDate === financialTx.transactionDate) {
    score += 30;
    reasons.push('Data idêntica');
  } else {
    const bDate = new Date(bankTx.transactionDate).getTime();
    const fDate = new Date(financialTx.transactionDate).getTime();
    const diffDays = Math.abs(bDate - fDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      score += 15;
      reasons.push('Data aproximada (+/- 2 dias)');
    }
  }

  // Referência / Documento
  if (
    (bankTx.reference && financialTx.sourceId && bankTx.reference.includes(financialTx.sourceId)) ||
    (bankTx.document && financialTx.sourceId && bankTx.document.includes(financialTx.sourceId))
  ) {
    score += 20;
    reasons.push('Referência/Documento correspondente');
  }

  return {
    isMatch: score >= 70,
    confidence: score,
    reasons,
  };
}
