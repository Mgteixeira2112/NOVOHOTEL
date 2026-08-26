export const ROOM_STATUSES = ['disponivel', 'ocupado', 'manutencao', 'sujo', 'limpeza', 'vistoria'] as const;
export type RoomStatus = typeof ROOM_STATUSES[number];

export const RESERVATION_STATUSES = ['pendente', 'confirmada', 'checkin_realizado', 'checkout_concluido', 'cancelada'] as const;
export type ReservationStatus = typeof RESERVATION_STATUSES[number];

export const STAY_STATUSES = ['checked_in', 'checked_out', 'cancelled'] as const;
export type StayStatus = typeof STAY_STATUSES[number];

export const FOLIO_STATUSES = ['open', 'closed', 'cancelled'] as const;
export type FolioStatus = typeof FOLIO_STATUSES[number];

export const ORDER_ORIGINS = ['POS', 'ROOM_TABLET', 'RESTAURANT', 'BAR', 'ROOM_SERVICE', 'KIOSK'] as const;
export type OrderOrigin = typeof ORDER_ORIGINS[number];

export const INVENTORY_MOVEMENT_TYPES = ['PURCHASE', 'SALE', 'CONSUMPTION', 'ADJUSTMENT', 'TRANSFER', 'LOSS', 'RETURN'] as const;
export type InventoryMovementType = typeof INVENTORY_MOVEMENT_TYPES[number];

export const OPERATIONAL_TASK_TYPES = ['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE', 'LAUNDRY', 'INSPECTION'] as const;
export type OperationalTaskType = typeof OPERATIONAL_TASK_TYPES[number];

export const CASH_SESSION_STATUSES = ['open', 'closed', 'cancelled'] as const;
export type CashSessionStatus = typeof CASH_SESSION_STATUSES[number];

export const TRANSACTION_TYPES = ['payment', 'refund', 'charge', 'adjustment'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

export const DOMAIN_EVENTS = [
  'reservation.created',
  'reservation.cancelled',
  'stay.checked_in',
  'stay.checked_out',
  'order.created',
  'order.completed',
  'task.created',
  'task.completed',
  'payment.created',
] as const;
export type DomainEventName = typeof DOMAIN_EVENTS[number];

export interface RoomBed {
  id: string;
  roomId: string;
  bedTypeId: string;
  quantity: number;
  note?: string | null;
}

export interface Stay {
  id: string;
  hotelId: string;
  reservationId: string;
  roomId: string;
  status: StayStatus;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
}

export interface Folio {
  id: string;
  hotelId: string;
  stayId: string;
  status: FolioStatus;
  currency: string;
}

export interface OrderDomainRef {
  id: string;
  hotelId: string;
  stayId?: string | null;
  roomId?: string | null;
  deviceId?: string | null;
  userId?: string | null;
  origin: OrderOrigin;
  status: string;
}
