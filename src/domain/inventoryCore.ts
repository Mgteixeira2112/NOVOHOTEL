export const STOCK_LOCATION_TYPES = [
  'WAREHOUSE',
  'KITCHEN',
  'BAR',
  'MINIBAR',
  'LAUNDRY',
  'OTHER',
] as const;
export type StockLocationType = typeof STOCK_LOCATION_TYPES[number];

export const PRODUCT_UNITS = ['UN', 'KG', 'G', 'L', 'ML', 'CX', 'PCT', 'FD'] as const;
export type ProductUnit = typeof PRODUCT_UNITS[number];

export const STOCK_MOVEMENT_TYPES = [
  'PURCHASE',
  'SALE',
  'CONSUMPTION',
  'TRANSFER',
  'ADJUSTMENT',
  'RETURN',
  'WASTE',
  'EXPIRATION',
  'INITIAL_BALANCE',
] as const;
export type StockMovementType = typeof STOCK_MOVEMENT_TYPES[number];

export const INVENTORY_STATUSES = [
  'OPEN',
  'COUNTING',
  'REVIEW',
  'APPROVED',
  'FINALIZED',
  'CANCELLED',
] as const;
export type InventoryStatus = typeof INVENTORY_STATUSES[number];

export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
] as const;
export type PurchaseOrderStatus = typeof PURCHASE_ORDER_STATUSES[number];

export const SUPPLIER_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;
export type SupplierStatus = typeof SUPPLIER_STATUSES[number];

export const EXPIRY_STATUSES = ['NORMAL', 'EXPIRING', 'EXPIRED'] as const;
export type ExpiryStatus = typeof EXPIRY_STATUSES[number];

export const ALERT_TYPES = ['NORMAL', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING', 'EXPIRED'] as const;
export type AlertType = typeof ALERT_TYPES[number];

export interface StockLocation {
  id: string;
  hotelId: string;
  code: string;
  name: string;
  locationType: StockLocationType;
  active: boolean;
  createdAt: string;
}

export interface StockItem {
  id: string;
  hotelId: string;
  productId: string;
  locationId: string;
  quantity: number;
  averageCost: number;
  minimumStock?: number | null;
  maximumStock?: number | null;
  reorderPoint?: number | null;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  hotelId: string;
  productId: string;
  stockItemId?: string | null;
  locationId: string;
  relatedLocationId?: string | null;
  movementType: StockMovementType;
  quantityDelta: number;
  unitCost?: number | null;
  referenceId?: string | null;
  referenceType?: string | null;
  batchNumber?: string | null;
  manufacturedAt?: string | null;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Supplier {
  id: string;
  hotelId: string;
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  status: SupplierStatus;
  paymentTerms?: string | null;
  leadTimeDays?: number | null;
  createdAt: string;
}

export interface SupplierProduct {
  id: string;
  hotelId: string;
  supplierId: string;
  productId: string;
  supplierSku?: string | null;
  unitPrice?: number | null;
  leadTimeDays?: number | null;
  active: boolean;
}

export interface PurchaseOrder {
  id: string;
  hotelId: string;
  supplierId?: string | null;
  orderNumber: string;
  status: PurchaseOrderStatus;
  requestedBy?: string | null;
  approvedBy?: string | null;
  orderedAt?: string | null;
  createdAt: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  locationId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  damagedQuantity: number;
  unitCost?: number | null;
}

export interface PurchaseReceipt {
  id: string;
  hotelId: string;
  purchaseOrderId: string;
  receivedBy?: string | null;
  receivedAt: string;
  notes?: string | null;
}

export interface Inventory {
  id: string;
  hotelId: string;
  locationId?: string | null;
  categoryId?: string | null;
  status: InventoryStatus;
  createdBy?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  finalizedAt?: string | null;
  items: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  productId: string;
  stockItemId?: string | null;
  expectedQuantity: number;
  countedQuantity?: number | null;
  differenceQuantity?: number | null;
  notes?: string | null;
  countedBy?: string | null;
  countedAt?: string | null;
}

export interface StockDashboardSummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
  estimatedTotalValue: number;
}

/**
 * Recalcula o Custo Médio Ponderado após uma nova entrada.
 * Fórmula: ((Quantidade Atual * Custo Médio Atual) + (Quantidade Entrada * Custo Unitário Entrada)) / (Quantidade Total)
 */
export function calculateWeightedAverageCost(
  currentQuantity: number,
  currentAverageCost: number,
  incomingQuantity: number,
  incomingUnitCost: number
): number {
  if (incomingQuantity <= 0) return currentAverageCost;
  const totalQty = currentQuantity + incomingQuantity;
  if (totalQty <= 0) return 0;

  const totalValue = currentQuantity * currentAverageCost + incomingQuantity * incomingUnitCost;
  return Math.round((totalValue / totalQty) * 10000) / 10000;
}

/**
 * Valida a aplicação de um delta ao estoque, rejeitando saldo negativo.
 */
export function applyStockDelta(currentQuantity: number, delta: number): number {
  if (delta === 0) {
    throw new Error('A movimentação deve possuir quantidade diferente de zero.');
  }
  const newQty = currentQuantity + delta;
  if (newQty < 0) {
    throw new Error(`Estoque insuficiente. Saldo atual: ${currentQuantity}, solicitado: ${Math.abs(delta)}.`);
  }
  return Math.round(newQty * 1000) / 1000;
}

/**
 * Identifica se a quantidade atingiu ou está abaixo do ponto de reposição / estoque mínimo.
 */
export function checkReorderPoint(quantity: number, reorderPoint?: number | null, minStock?: number | null): boolean {
  const threshold = reorderPoint ?? minStock;
  if (threshold === undefined || threshold === null) return false;
  return quantity <= threshold;
}

/**
 * Avalia o status de validade de um lote/produto.
 */
export function evaluateExpiryStatus(
  expiresAt: string | Date,
  referenceDate: Date = new Date(),
  warningDaysThreshold = 7
): ExpiryStatus {
  const expDate = new Date(expiresAt);
  const refDate = new Date(referenceDate);

  // Zera horas para comparação puramente diária
  expDate.setHours(0, 0, 0, 0);
  refDate.setHours(0, 0, 0, 0);

  const diffMs = expDate.getTime() - refDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= warningDaysThreshold) return 'EXPIRING';
  return 'NORMAL';
}

/**
 * Calcula a diferença da contagem física no inventário.
 */
export function calculateInventoryDifference(
  expectedQuantity: number,
  countedQuantity: number
): { difference: number; isDivergent: boolean } {
  const diff = Math.round((countedQuantity - expectedQuantity) * 1000) / 1000;
  return {
    difference: diff,
    isDivergent: diff !== 0,
  };
}

/**
 * Conversão de unidades básicas (ex: KG <-> G, L <-> ML).
 */
export function convertUnits(
  quantity: number,
  fromUnit: ProductUnit,
  toUnit: ProductUnit,
  customPackageFactor?: number
): number {
  if (fromUnit === toUnit) return quantity;

  // Massa
  if (fromUnit === 'KG' && toUnit === 'G') return quantity * 1000;
  if (fromUnit === 'G' && toUnit === 'KG') return quantity / 1000;

  // Volume
  if (fromUnit === 'L' && toUnit === 'ML') return quantity * 1000;
  if (fromUnit === 'ML' && toUnit === 'L') return quantity / 1000;

  // Embalagens com fator customizado (CX, PCT, FD para UN)
  if (customPackageFactor && customPackageFactor > 0) {
    if (['CX', 'PCT', 'FD'].includes(fromUnit) && toUnit === 'UN') {
      return quantity * customPackageFactor;
    }
    if (fromUnit === 'UN' && ['CX', 'PCT', 'FD'].includes(toUnit)) {
      return quantity / customPackageFactor;
    }
  }

  return quantity;
}
