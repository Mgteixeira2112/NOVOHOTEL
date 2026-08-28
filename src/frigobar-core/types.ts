export interface MinibarProduct {
  id: string;
  hotelId: string;
  name: string;
  sku?: string | null;
  salePrice: number;
  unit: string;
  active: boolean;
}

export interface MinibarRoomStockItem {
  productId: string;
  productName: string;
  quantity: number;
  targetQuantity: number;
  missingQuantity: number;
  salePrice: number;
}

export interface MinibarRoomSnapshot {
  hotelId: string;
  roomId: string;
  roomNumber: string;
  locationId: string;
  items: MinibarRoomStockItem[];
  totalUnits: number;
  missingUnits: number;
  needsRestock: boolean;
}

export interface MinibarRestockSource {
  id: string;
  code: string;
  name: string;
  locationType: string;
}

export interface RegisterMinibarConsumptionInput {
  hotelId: string;
  roomId: string;
  productId: string;
  quantity: number;
  idempotencyKey: string;
}

export interface MinibarConsumptionResult {
  consumptionId: string;
  stayId: string;
  folioId: string;
  folioItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RestockMinibarInput {
  hotelId: string;
  roomId: string;
  productId: string;
  quantity: number;
  fromLocationId: string;
  idempotencyKey: string;
}
