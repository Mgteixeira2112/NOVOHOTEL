export type FinancialChargeSource =
  | 'ROOM'
  | 'POS'
  | 'FRIGOBAR'
  | 'ROOM_SERVICE'
  | 'LAUNDRY'
  | 'MANUAL'
  | 'TAX'
  | 'DISCOUNT'
  | 'ADJUSTMENT';

export type FinancialPaymentMethod =
  | 'CASH'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'OTHER';

export type FolioStatus = 'open' | 'closed';
export type FolioItemStatus = 'active' | 'voided' | 'refunded' | 'transferred';

export interface FinancialFolioItem {
  id: string;
  source: FinancialChargeSource;
  sourceKey?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: FolioItemStatus;
  createdAt?: string;
}

export interface FinancialPayment {
  id: string;
  amount: number;
  method: FinancialPaymentMethod;
  status: string;
  externalReference?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string;
}

export interface FinancialFolioSnapshot {
  folioId: string;
  hotelId: string;
  stayId: string;
  status: FolioStatus;
  currency: string;
  chargesTotal: number;
  paymentsTotal: number;
  refundsTotal: number;
  balance: number;
  items: FinancialFolioItem[];
  payments: FinancialPayment[];
}

export interface AddChargeInput {
  folioId: string;
  source: FinancialChargeSource;
  sourceKey?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceivePaymentInput {
  folioId: string;
  amount: number;
  method: FinancialPaymentMethod;
  externalReference?: string | null;
  idempotencyKey?: string | null;
}

export interface CheckoutFinancialEligibility {
  stayId: string;
  folioId: string;
  balance: number;
  eligible: boolean;
  reason: 'OK' | 'FOLIO_NOT_FOUND' | 'FOLIO_NOT_OPEN' | 'OUTSTANDING_BALANCE';
}
