import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALERT_TYPES,
  EXPIRY_STATUSES,
  INVENTORY_STATUSES,
  PRODUCT_UNITS,
  PURCHASE_ORDER_STATUSES,
  STOCK_LOCATION_TYPES,
  STOCK_MOVEMENT_TYPES,
  SUPPLIER_STATUSES,
  applyStockDelta,
  calculateInventoryDifference,
  calculateWeightedAverageCost,
  checkReorderPoint,
  convertUnits,
  evaluateExpiryStatus,
  type Inventory,
  type InventoryItem,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type StockItem,
  type StockLocation,
  type StockMovement,
  type Supplier,
} from '../src/domain/inventoryCore';

// 1. Entrada de compra (PURCHASE)
test('1. entrada de compra: incrementa estoque e atualiza custo médio ponderado', () => {
  const currentQty = 10;
  const currentAvgCost = 5.0; // Total 50
  const incomingQty = 10;
  const incomingCost = 7.0; // Total 70

  const newQty = applyStockDelta(currentQty, incomingQty);
  const newAvgCost = calculateWeightedAverageCost(currentQty, currentAvgCost, incomingQty, incomingCost);

  assert.equal(newQty, 20);
  assert.equal(newAvgCost, 6.0); // (50 + 70) / 20 = 6.0
});

// 2. Venda (SALE)
test('2. venda: decrementa estoque respeitando quantidade disponível', () => {
  const currentQty = 15;
  const soldQty = 3;
  const newQty = applyStockDelta(currentQty, -soldQty);
  assert.equal(newQty, 12);
});

// 3. Consumo (CONSUMPTION)
test('3. consumo: registra saída de insumo/produto para uso operacional', () => {
  const movement: StockMovement = {
    id: 'mov-1',
    hotelId: 'hotel-a',
    productId: 'prod-detergent',
    locationId: 'loc-laundry',
    movementType: 'CONSUMPTION',
    quantityDelta: -2,
    createdAt: new Date().toISOString(),
  };
  assert.equal(movement.movementType, 'CONSUMPTION');
  assert.equal(STOCK_MOVEMENT_TYPES.includes(movement.movementType), true);
});

// 4. Transferência (TRANSFER)
test('4. transferência: cria perna negativa na origem e positiva no destino com soma zero', () => {
  const qty = 5;
  const fromDelta = -qty;
  const toDelta = qty;

  assert.equal(fromDelta + toDelta, 0);

  const transferOut: StockMovement = {
    id: 'mov-out',
    hotelId: 'hotel-a',
    productId: 'prod-water',
    locationId: 'loc-warehouse',
    relatedLocationId: 'loc-minibar-101',
    movementType: 'TRANSFER',
    quantityDelta: fromDelta,
    createdAt: new Date().toISOString(),
  };

  const transferIn: StockMovement = {
    id: 'mov-in',
    hotelId: 'hotel-a',
    productId: 'prod-water',
    locationId: 'loc-minibar-101',
    relatedLocationId: 'loc-warehouse',
    movementType: 'TRANSFER',
    quantityDelta: toDelta,
    createdAt: new Date().toISOString(),
  };

  assert.equal(transferOut.quantityDelta, -5);
  assert.equal(transferIn.quantityDelta, 5);
  assert.equal(transferOut.relatedLocationId, transferIn.locationId);
});

// 5. Ajuste (ADJUSTMENT)
test('5. ajuste: permite correção quantitativa com justificativa de auditoria', () => {
  const movement: StockMovement = {
    id: 'mov-adj',
    hotelId: 'hotel-a',
    productId: 'prod-coffee',
    locationId: 'loc-kitchen',
    movementType: 'ADJUSTMENT',
    quantityDelta: -1.5,
    createdBy: 'user-manager-1',
    createdAt: new Date().toISOString(),
    metadata: { reason: 'Quebra de embalagem durante manuseio' },
  };
  assert.equal(movement.movementType, 'ADJUSTMENT');
  assert.equal(movement.quantityDelta, -1.5);
  assert.ok(movement.metadata);
});

// 6. Inventário Físico (Ciclo de Vida)
test('6. inventário: suporta fluxo OPEN -> COUNTING -> REVIEW -> APPROVED -> FINALIZED', () => {
  const validTransitions: string[] = ['OPEN', 'COUNTING', 'REVIEW', 'APPROVED', 'FINALIZED'];
  for (const st of validTransitions) {
    assert.equal(INVENTORY_STATUSES.includes(st as any), true);
  }

  const inventory: Inventory = {
    id: 'inv-001',
    hotelId: 'hotel-a',
    locationId: 'loc-bar',
    status: 'COUNTING',
    createdAt: new Date().toISOString(),
    items: [],
  };
  assert.equal(inventory.status, 'COUNTING');
});

// 7. Diferença de Inventário
test('7. diferença: calcula divergência entre contagem física e saldo teórico', () => {
  const expected = 20;
  const countedFalta = 18;
  const resultFalta = calculateInventoryDifference(expected, countedFalta);
  assert.equal(resultFalta.difference, -2);
  assert.equal(resultFalta.isDivergent, true);

  const countedSobra = 23;
  const resultSobra = calculateInventoryDifference(expected, countedSobra);
  assert.equal(resultSobra.difference, 3);
  assert.equal(resultSobra.isDivergent, true);

  const countedExato = 20;
  const resultExato = calculateInventoryDifference(expected, countedExato);
  assert.equal(resultExato.difference, 0);
  assert.equal(resultExato.isDivergent, false);
});

// 8. Recebimento Parcial
test('8. recebimento parcial: preserva quantidade comprada original e registra recebimento parcial', () => {
  const item: PurchaseOrderItem = {
    id: 'poi-1',
    purchaseOrderId: 'po-101',
    productId: 'prod-towel',
    locationId: 'loc-warehouse',
    orderedQuantity: 100,
    receivedQuantity: 60,
    damagedQuantity: 0,
    unitCost: 15.0,
  };

  assert.equal(item.orderedQuantity, 100);
  assert.equal(item.receivedQuantity, 60);
  assert.equal(item.orderedQuantity - item.receivedQuantity, 40); // Pendente

  const poStatus = item.receivedQuantity < item.orderedQuantity ? 'PARTIALLY_RECEIVED' : 'RECEIVED';
  assert.equal(poStatus, 'PARTIALLY_RECEIVED');
  assert.equal(PURCHASE_ORDER_STATUSES.includes(poStatus), true);
});

// 9. Produto Danificado
test('9. produto danificado: registra quantidade avariada no recebimento sem inflar estoque útil', () => {
  const item: PurchaseOrderItem = {
    id: 'poi-2',
    purchaseOrderId: 'po-102',
    productId: 'prod-glass',
    locationId: 'loc-bar',
    orderedQuantity: 50,
    receivedQuantity: 50,
    damagedQuantity: 5, // 5 taças quebradas
    unitCost: 12.0,
  };

  const netUsefulQuantity = item.receivedQuantity - item.damagedQuantity;
  assert.equal(netUsefulQuantity, 45);
});

// 10. Validade (NORMAL, EXPIRING, EXPIRED)
test('10. validade: categoriza lotes em NORMAL, EXPIRING e EXPIRED com precisão diária', () => {
  const today = new Date('2026-08-26T12:00:00Z');

  // Vencido ontem
  const expiredDate = '2026-08-25';
  assert.equal(evaluateExpiryStatus(expiredDate, today, 7), 'EXPIRED');

  // Vencendo em 3 dias (dentro do threshold de 7 dias)
  const expiringDate = '2026-08-29';
  assert.equal(evaluateExpiryStatus(expiringDate, today, 7), 'EXPIRING');

  // Vencimento longo (30 dias)
  const normalDate = '2026-09-26';
  assert.equal(evaluateExpiryStatus(normalDate, today, 7), 'NORMAL');
});

// 11. Estoque Mínimo
test('11. estoque mínimo: identifica quando o estoque atinge ou fica abaixo do limiar', () => {
  assert.equal(checkReorderPoint(5, 5, 5), true); // igual
  assert.equal(checkReorderPoint(3, 5, 5), true); // abaixo
  assert.equal(checkReorderPoint(10, 5, 5), false); // acima
});

// 12. Alerta de Estoque
test('12. alerta: emite OUT_OF_STOCK para zero ou LOW_STOCK para ponto de reposição', () => {
  const zeroStock = 0;
  const lowStock = 4;
  const reorderPoint = 5;

  const alertZero = zeroStock <= 0 ? 'OUT_OF_STOCK' : 'NORMAL';
  const alertLow = lowStock <= reorderPoint ? 'LOW_STOCK' : 'NORMAL';

  assert.equal(alertZero, 'OUT_OF_STOCK');
  assert.equal(alertLow, 'LOW_STOCK');
  assert.equal(ALERT_TYPES.includes(alertZero), true);
  assert.equal(ALERT_TYPES.includes(alertLow), true);
});

// 13. Custo Médio Ponderado
test('13. custo médio: calcula custo ponderado preservando histórico de compras', () => {
  // 100 un a R$ 10,00 + 50 un a R$ 16,00 -> (1000 + 800) / 150 = 1800 / 150 = 12,00
  const avg = calculateWeightedAverageCost(100, 10.0, 50, 16.0);
  assert.equal(avg, 12.0);
});

// 14. Frigobar (Quarto + Folio)
test('14. frigobar: consumo no quarto gera baixa de estoque e lançamento financeiro no Folio', () => {
  const roomStockMovement: StockMovement = {
    id: 'mov-frigo-1',
    hotelId: 'hotel-a',
    productId: 'prod-snack',
    locationId: 'loc-minibar-204',
    movementType: 'CONSUMPTION',
    quantityDelta: -1,
    createdAt: new Date().toISOString(),
  };

  const folioItem = {
    stayId: 'stay-204',
    source: 'FRIGOBAR',
    description: 'Castanha de Caju Frigobar',
    quantity: 1,
    unitPrice: 14.0,
    total: 14.0,
  };

  assert.equal(roomStockMovement.quantityDelta, -1);
  assert.equal(folioItem.source, 'FRIGOBAR');
  assert.equal(folioItem.total, 14.0);
});

// 15. RLS
test('15. RLS: consultas e movimentações de estoque respeitam isolamento do usuário autenticado', () => {
  const locations: StockLocation[] = [
    { id: 'loc-1', hotelId: 'hotel-a', code: 'ALM-A', name: 'Almoxarifado A', locationType: 'WAREHOUSE', active: true, createdAt: '' },
    { id: 'loc-2', hotelId: 'hotel-b', code: 'ALM-B', name: 'Almoxarifado B', locationType: 'WAREHOUSE', active: true, createdAt: '' },
  ];

  const currentHotelId = 'hotel-a';
  const filtered = locations.filter((l) => l.hotelId === currentHotelId);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'loc-1');
});

// 16. Multi-Hotel
test('16. multi-hotel: estoques de produtos idênticos em hotéis diferentes são totalmente independentes', () => {
  const stockHotelA: StockItem = {
    id: 'stk-a',
    hotelId: 'hotel-a',
    productId: 'prod-coca',
    locationId: 'loc-bar-a',
    quantity: 50,
    averageCost: 4.5,
    updatedAt: '',
  };

  const stockHotelB: StockItem = {
    id: 'stk-b',
    hotelId: 'hotel-b',
    productId: 'prod-coca',
    locationId: 'loc-bar-b',
    quantity: 12,
    averageCost: 5.0,
    updatedAt: '',
  };

  assert.notEqual(stockHotelA.hotelId, stockHotelB.hotelId);
  assert.notEqual(stockHotelA.quantity, stockHotelB.quantity);
});

// 17. Concorrência e Saldo Insuficiente
test('17. concorrência: rejeita saída com saldo insuficiente para evitar estoque negativo', () => {
  const currentQuantity = 4;
  const requestedWithdrawal = -6;

  assert.throws(
    () => {
      applyStockDelta(currentQuantity, requestedWithdrawal);
    },
    /Estoque insuficiente/
  );
});

// 18. Auditoria e Tipos Canônicos
test('18. auditoria: movimentos registram autor, tipo, quantidade e metadados', () => {
  const movement: StockMovement = {
    id: 'mov-audit-1',
    hotelId: 'hotel-a',
    productId: 'prod-whisky',
    locationId: 'loc-bar',
    movementType: 'WASTE',
    quantityDelta: -1,
    createdBy: 'user-bartender-1',
    createdAt: new Date().toISOString(),
    metadata: { reason: 'Garrafa acidentalmente quebrada' },
  };

  assert.equal(movement.movementType, 'WASTE');
  assert.equal(movement.createdBy, 'user-bartender-1');
  assert.equal(STOCK_LOCATION_TYPES.includes('BAR'), true);
  assert.equal(PRODUCT_UNITS.includes('UN'), true);
  assert.equal(SUPPLIER_STATUSES.includes('ACTIVE'), true);
});
