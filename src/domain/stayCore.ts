export const STAY_STATUSES = ['EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'] as const;
export type StayStatus = typeof STAY_STATUSES[number];

export const FOLIO_ITEM_SOURCES = [
  'ROOM', 'POS', 'FRIGOBAR', 'ROOM_SERVICE', 'LAUNDRY',
  'MANUAL', 'TAX', 'DISCOUNT', 'ADJUSTMENT',
] as const;
export type FolioItemSource = typeof FOLIO_ITEM_SOURCES[number];

export const PAYMENT_METHODS = [
  'CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER',
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

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

export interface FolioItem {
  id: string;
  hotelId: string;
  folioId: string;
  source: FolioItemSource;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: 'active' | 'voided' | 'refunded' | 'transferred';
  createdAt: string;
  createdBy: string | null;
}

export interface FolioBalance {
  charges: number;
  payments: number;
  refunds: number;
  balance: number;
}
