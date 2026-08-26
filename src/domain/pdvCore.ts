export const ORDER_SOURCES = ['POS', 'ROOM_SERVICE', 'TABLET', 'QR', 'OTHER'] as const;
export type OrderSource = typeof ORDER_SOURCES[number];

export const ORDER_STATUSES = [
  'CREATED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_METHODS = [
  'CASH',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const PRODUCT_STATUSES = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'] as const;
export type ProductStatus = typeof PRODUCT_STATUSES[number];

export const PREPARATION_SECTORS = ['COZINHA', 'BAR', 'CAFETERIA', 'OUTROS'] as const;
export type PreparationSector = typeof PREPARATION_SECTORS[number];

export const ROOM_DEVICE_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'RESET_REQUIRED'] as const;
export type RoomDeviceStatus = typeof ROOM_DEVICE_STATUSES[number];

export const CASH_MOVEMENT_TYPES = [
  'OPENING',
  'SALE',
  'REFUND',
  'WITHDRAWAL',
  'SUPPLY',
  'ADJUSTMENT',
  'CLOSING',
] as const;
export type CashMovementType = typeof CASH_MOVEMENT_TYPES[number];

export interface PdvProductDomain {
  id: string;
  hotelId: string;
  name: string;
  description?: string | null;
  category: string;
  price: number;
  imageUrl?: string | null;
  status: ProductStatus;
  stockQuantity: number;
  minStockQuantity: number;
  preparationSector: PreparationSector;
}

export interface OrderItemDomain {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
}

export interface OrderDomain {
  id: string;
  hotelId: string;
  orderNumber: number;
  source: OrderSource;
  status: OrderStatus;
  roomId?: string | null;
  stayId?: string | null;
  folioId?: string | null;
  deviceId?: string | null;
  createdBy?: string | null;
  items: OrderItemDomain[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomDeviceDomain {
  id: string;
  hotelId: string;
  roomId: string;
  deviceIdentifier: string;
  token: string;
  status: RoomDeviceStatus;
  activeStayId?: string | null;
  lastSeenAt: string;
}

export interface CashRegisterDomain {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  active: boolean;
}

export interface CashSessionDomain {
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

export interface CashMovementDomain {
  id: string;
  cashSessionId: string;
  hotelId: string;
  type: CashMovementType;
  amount: number;
  description?: string | null;
  createdAt: string;
  createdBy: string;
}

export function calculateOrderTotals(
  items: Array<{ unitPrice: number; quantity: number; discount?: number }>
): { subtotal: number; totalDiscount: number; total: number } {
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of items) {
    const itemSubtotal = item.unitPrice * item.quantity;
    const itemDiscount = Math.min(itemSubtotal, Math.max(0, item.discount ?? 0));
    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
  }

  const total = Math.max(0, subtotal - totalDiscount);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function calculateCashClosing(
  openingAmount: number,
  sales: number,
  supplies: number,
  withdrawals: number,
  refunds: number,
  actualCash: number
): { expectedCash: number; difference: number } {
  const expectedCash = Math.round((openingAmount + sales + supplies - withdrawals - refunds) * 100) / 100;
  const difference = Math.round((actualCash - expectedCash) * 100) / 100;
  return { expectedCash, difference };
}

export function isDeviceAuthorizedForRoom(device: RoomDeviceDomain, targetRoomId: string): boolean {
  return device.roomId === targetRoomId && device.status === 'ACTIVE';
}

export function resetDeviceOnCheckout(device: RoomDeviceDomain): RoomDeviceDomain {
  return {
    ...device,
    activeStayId: null,
    status: 'ACTIVE',
    lastSeenAt: new Date().toISOString(),
  };
}
