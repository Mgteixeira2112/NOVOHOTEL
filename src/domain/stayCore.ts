export const STAY_STATUSES = ['EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const;
export type StayStatus = typeof STAY_STATUSES[number];

export const FOLIO_ITEM_SOURCES = [
  'ROOM',
  'POS',
  'FRIGOBAR',
  'ROOM_SERVICE',
  'LAUNDRY',
  'MANUAL',
  'TAX',
  'DISCOUNT',
  'ADJUSTMENT',
] as const;
export type FolioItemSource = typeof FOLIO_ITEM_SOURCES[number];

export const PAYMENT_METHODS = [
  'CASH',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const FOLIO_ITEM_STATUSES = ['active', 'voided', 'refunded', 'transferred'] as const;
export type FolioItemStatus = typeof FOLIO_ITEM_STATUSES[number];

export const GUEST_ROLES = ['PRIMARY', 'COMPANION', 'CHILD'] as const;
export type GuestRole = typeof GUEST_ROLES[number];

export interface Stay {
  id: string;
  hotelId: string;
  reservationId: string;
  roomId: string;
  primaryGuestId: string;
  status: StayStatus;
  actualCheckInAt: string | null;
  expectedCheckOut: string;
  actualCheckOutAt: string | null;
}

export interface StayGuest {
  stayId: string;
  guestId: string;
  role: GuestRole;
  isPrimary: boolean;
  childAge?: number | null;
}

export interface Folio {
  id: string;
  hotelId: string;
  stayId: string;
  status: 'open' | 'closed' | 'cancelled';
  currency: string;
  closedAt?: string | null;
}

export interface FolioItem {
  id: string;
  hotelId: string;
  folioId: string;
  source: FolioItemSource;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: FolioItemStatus;
  createdAt: string;
  createdBy: string | null;
  referenceId?: string | null;
}

export interface FolioPayment {
  id: string;
  hotelId: string;
  folioId: string;
  amount: number;
  method: PaymentMethod;
  status: 'approved' | 'pending' | 'rejected' | 'refunded';
  createdAt: string;
  externalReference?: string | null;
}

export interface FolioBalance {
  charges: number;
  payments: number;
  refunds: number;
  balance: number;
}

export interface RoomChangeRecord {
  stayId: string;
  oldRoomId: string;
  newRoomId: string;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface StayExtensionRecord {
  stayId: string;
  oldExpectedCheckOut: string;
  newExpectedCheckOut: string;
  reason?: string;
  timestamp: string;
}

export function calculateFolioBalance(
  items: Array<{ total: number; status: FolioItemStatus }>,
  payments: Array<{ amount: number; status: string }>,
  refunds: Array<{ amount: number; status: string }> = []
): FolioBalance {
  const charges = items
    .filter((i) => i.status === 'active')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalPayments = payments
    .filter((p) => p.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRefunds = refunds
    .filter((r) => r.status === 'approved' || r.status === 'refunded')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = Math.round((charges - totalPayments + totalRefunds) * 100) / 100;

  return {
    charges: Math.round(charges * 100) / 100,
    payments: Math.round(totalPayments * 100) / 100,
    refunds: Math.round(totalRefunds * 100) / 100,
    balance,
  };
}

export function canCheckOut(balance: number, allowBalanceDebt = false): boolean {
  if (balance <= 0) return true;
  return allowBalanceDebt === true;
}
