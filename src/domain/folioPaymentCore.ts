export const FOLIO_STATUSES = ['OPEN', 'LOCKED', 'CLOSED', 'VOID'] as const;
export type FolioStatus = typeof FOLIO_STATUSES[number];

export const FOLIO_CATEGORIES = [
  'ROOM',
  'FOOD',
  'BEVERAGE',
  'MINIBAR',
  'ROOM_SERVICE',
  'LAUNDRY',
  'PARKING',
  'SPA',
  'PHONE',
  'TAX',
  'DISCOUNT',
  'OTHER',
] as const;
export type FolioCategory = typeof FOLIO_CATEGORIES[number];

export const FOLIO_ORIGINS = [
  'RESERVATION',
  'POS',
  'MINIBAR',
  'ROOM_SERVICE',
  'LAUNDRY',
  'OTHER',
] as const;
export type FolioOrigin = typeof FOLIO_ORIGINS[number];

export const PAYMENT_METHODS = [
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'BANK_TRANSFER',
  'OTHER',
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PAYMENT_STATUSES = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const PAYER_TYPES = ['GUEST', 'COMPANY', 'AGENCY', 'OTHER'] as const;
export type PayerType = typeof PAYER_TYPES[number];

export const ORDER_SOURCES = ['POS', 'ROOM_TABLET', 'RESTAURANT', 'PHONE', 'RECEPTION'] as const;
export type OrderSource = typeof ORDER_SOURCES[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const KITCHEN_KANBAN_COLUMNS = [
  'NOVOS',
  'PREPARANDO',
  'PRONTOS',
  'ENTREGANDO',
  'CONCLUÍDOS',
] as const;
export type KitchenKanbanColumn = typeof KITCHEN_KANBAN_COLUMNS[number];

export const POS_PERMISSIONS = [
  'POS_VIEW',
  'POS_SELL',
  'POS_DISCOUNT',
  'POS_VOID',
  'POS_REFUND',
  'POS_OPEN_CASH',
  'POS_CLOSE_CASH',
  'POS_CASH_REPORT',
] as const;
export type PosPermission = typeof POS_PERMISSIONS[number];

export interface FolioRecord {
  id: string;
  hotelId: string;
  stayId: string;
  status: FolioStatus;
  currency: string;
  openedAt: string;
  closedAt?: string | null;
  createdBy?: string | null;
  closedBy?: string | null;
}

export interface FolioItemRecord {
  id: string;
  folioId: string;
  hotelId: string;
  category: FolioCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  source: FolioOrigin;
  sourceId?: string | null;
  createdAt: string;
  createdBy?: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
}

export interface PaymentRecord {
  id: string;
  hotelId: string;
  folioId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string | null;
  createdAt: string;
  createdBy?: string | null;
  refundedAt?: string | null;
  refundReason?: string | null;
}

export interface DiscountRecord {
  id: string;
  hotelId: string;
  folioId: string;
  folioItemId?: string | null;
  discountType: 'PERCENT' | 'FIXED';
  value: number;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface FolioPayerRecord {
  id: string;
  hotelId: string;
  folioId: string;
  payerType: PayerType;
  guestId?: string | null;
  name: string;
  createdAt: string;
}

export interface FolioItemAllocationRecord {
  id: string;
  hotelId: string;
  folioItemId: string;
  payerId: string;
  amount: number;
  createdAt: string;
}

export interface DeviceRecord {
  id: string;
  hotelId: string;
  roomId: string;
  type: 'ROOM_TABLET';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  token: string;
  createdAt: string;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderRecord {
  id: string;
  hotelId: string;
  source: OrderSource;
  roomId?: string | null;
  stayId?: string | null;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItemRecord[];
}

export interface CashRegisterRecord {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface CashSessionRecord {
  id: string;
  hotelId: string;
  cashRegisterId: string;
  operatorId: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  openingAmount: number;
  closedAt?: string | null;
  expectedCash?: number | null;
  actualCash?: number | null;
  difference?: number | null;
}

export interface CashMovementRecord {
  id: string;
  cashSessionId: string;
  hotelId: string;
  type: 'OPENING' | 'SALE' | 'REFUND' | 'WITHDRAWAL' | 'SUPPLY' | 'ADJUSTMENT' | 'CLOSING';
  amount: number;
  description?: string | null;
  createdAt: string;
  createdBy: string;
}

/**
 * Mapeamento do status do pedido para coluna do Kanban da cozinha
 */
export function mapOrderStatusToKitchenKanban(status: OrderStatus): KitchenKanbanColumn {
  switch (status) {
    case 'PENDING':
    case 'CONFIRMED':
      return 'NOVOS';
    case 'PREPARING':
      return 'PREPARANDO';
    case 'READY':
      return 'PRONTOS';
    case 'DELIVERING':
      return 'ENTREGANDO';
    case 'DELIVERED':
    case 'CANCELLED':
      return 'CONCLUÍDOS';
  }
}

/**
 * Recalcula o saldo consolidado do Folio no backend
 */
export function computeFolioFinancialSummary(
  items: FolioItemRecord[],
  payments: PaymentRecord[],
  discounts: DiscountRecord[] = []
): { totalCharges: number; totalDiscounts: number; totalPayments: number; totalRefunds: number; balance: number; status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' } {
  const activeItems = items.filter((i) => !i.voidedAt);
  const totalCharges = activeItems.reduce((sum, i) => sum + i.totalAmount, 0);

  const totalDiscounts = discounts.reduce((sum, d) => {
    if (d.discountType === 'FIXED') return sum + d.value;
    return sum + (totalCharges * (d.value / 100));
  }, 0);

  const approvedPayments = payments.filter((p) => p.status === 'PAID' || p.status === 'PARTIALLY_PAID');
  const totalPayments = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

  const refundedPayments = payments.filter((p) => p.status === 'REFUNDED');
  const totalRefunds = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

  const netCharges = Math.max(0, Math.round((totalCharges - totalDiscounts) * 100) / 100);
  const netPaid = Math.max(0, Math.round((totalPayments - totalRefunds) * 100) / 100);
  const balance = Math.round((netCharges - netPaid) * 100) / 100;

  let status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' = 'PENDING';
  if (netPaid >= netCharges && netCharges > 0) {
    status = 'PAID';
  } else if (netPaid > 0) {
    status = 'PARTIALLY_PAID';
  }

  return {
    totalCharges: Math.round(totalCharges * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    totalPayments: Math.round(totalPayments * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    balance,
    status,
  };
}

/**
 * Validação segura de checkout: saldo deve estar zerado ou quitado
 */
export function validateFolioForCheckout(
  folio: FolioRecord,
  items: FolioItemRecord[],
  payments: PaymentRecord[],
  discounts: DiscountRecord[] = []
): { canClose: boolean; reason?: string } {
  if (folio.status === 'CLOSED') {
    return { canClose: false, reason: 'FOLIO_ALREADY_CLOSED' };
  }
  if (folio.status === 'VOID') {
    return { canClose: false, reason: 'FOLIO_IS_VOID' };
  }

  const summary = computeFolioFinancialSummary(items, payments, discounts);
  if (summary.balance > 0) {
    return { canClose: false, reason: `FOLIO_HAS_PENDING_BALANCE: ${summary.balance}` };
  }

  return { canClose: true };
}

/**
 * Cálculo de fechamento de sessão de caixa (sangria / suprimento / vendas / estorno)
 */
export function calculateCashSessionTotals(
  openingAmount: number,
  movements: CashMovementRecord[]
): { expectedCash: number; totalSales: number; totalSupplies: number; totalWithdrawals: number; totalRefunds: number } {
  let totalSales = 0;
  let totalSupplies = 0;
  let totalWithdrawals = 0;
  let totalRefunds = 0;

  for (const m of movements) {
    switch (m.type) {
      case 'SALE':
        totalSales += m.amount;
        break;
      case 'SUPPLY':
        totalSupplies += m.amount;
        break;
      case 'WITHDRAWAL':
        totalWithdrawals += m.amount;
        break;
      case 'REFUND':
        totalRefunds += m.amount;
        break;
    }
  }

  const expectedCash = Math.round((openingAmount + totalSales + totalSupplies - totalWithdrawals - totalRefunds) * 100) / 100;

  return {
    expectedCash,
    totalSales: Math.round(totalSales * 100) / 100,
    totalSupplies: Math.round(totalSupplies * 100) / 100,
    totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
  };
}
