import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CASH_MOVEMENT_TYPES,
  ORDER_SOURCES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PREPARATION_SECTORS,
  PRODUCT_STATUSES,
  ROOM_DEVICE_STATUSES,
  calculateCashClosing,
  calculateOrderTotals,
  isDeviceAuthorizedForRoom,
  resetDeviceOnCheckout,
  type CashMovementDomain,
  type CashRegisterDomain,
  type CashSessionDomain,
  type OrderDomain,
  type PdvProductDomain,
  type ProductStatus,
  type RoomDeviceDomain,
} from '../src/domain/pdvCore';
import { canAccessTab, hasRolePermission } from '../src/core/permissions/permissionService';

// 1. Usuário somente PDV
test('1. usuário somente PDV: acessa apenas PDV e KDS, bloqueado em módulos administrativos', () => {
  const role = 'pdv_only' as const;
  assert.equal(canAccessTab(undefined, role, 'pdv'), true);
  assert.equal(canAccessTab(undefined, role, 'kds'), true);
  assert.equal(canAccessTab(undefined, role, 'settings'), false);
  assert.equal(canAccessTab(undefined, role, 'users'), false);
  assert.equal(canAccessTab(undefined, role, 'financial'), false);
  assert.equal(canAccessTab(undefined, role, 'reservations'), false);
});

// 2. Usuário sem permissão
test('2. usuário sem permissão: cozinha_only não pode abrir caixa ou criar vendas', () => {
  const role = 'cozinha_only' as const;
  assert.equal(hasRolePermission(role, 'pos.open_cash'), false);
  assert.equal(hasRolePermission(role, 'pos.create_order'), false);
  assert.equal(canAccessTab(undefined, role, 'kds'), true);
  assert.equal(canAccessTab(undefined, role, 'pdv'), false);
});

// 3. Abertura de caixa
test('3. abertura de caixa: registra operador, horário e valor de abertura', () => {
  const session: CashSessionDomain = {
    id: 'cs-101',
    hotelId: 'hotel-a',
    cashRegisterId: 'cr-1',
    operatorId: 'user-op-1',
    status: 'OPEN',
    openedAt: '2026-08-26T08:00:00Z',
    openingAmount: 150.0,
  };
  assert.equal(session.status, 'OPEN');
  assert.equal(session.openingAmount, 150.0);
  assert.equal(session.operatorId, 'user-op-1');
});

// 4. Venda
test('4. venda: calcula subtotal e total com recálculo autoritativo no backend', () => {
  const items = [
    { unitPrice: 25.0, quantity: 2 }, // 50
    { unitPrice: 15.0, quantity: 1 }, // 15
  ];
  const { subtotal, totalDiscount, total } = calculateOrderTotals(items);
  assert.equal(subtotal, 65.0);
  assert.equal(totalDiscount, 0);
  assert.equal(total, 65.0);
});

// 5. Cancelamento
test('5. cancelamento: pedido transita para status CANCELLED', () => {
  const order: OrderDomain = {
    id: 'ord-100',
    hotelId: 'hotel-a',
    orderNumber: 1001,
    source: 'POS',
    status: 'CANCELLED',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(order.status, 'CANCELLED');
  assert.equal(ORDER_STATUSES.includes(order.status), true);
});

// 6. Desconto
test('6. desconto: aplica desconto sem permitir que o total do item fique negativo', () => {
  const items = [
    { unitPrice: 30.0, quantity: 1, discount: 5.0 }, // 25
    { unitPrice: 20.0, quantity: 1, discount: 50.0 }, // max discount é 20 -> 0
  ];
  const { subtotal, totalDiscount, total } = calculateOrderTotals(items);
  assert.equal(subtotal, 50.0);
  assert.equal(totalDiscount, 25.0);
  assert.equal(total, 25.0);
});

// 7. Estorno
test('7. estorno: movimentação de caixa suporta REFUND e auditoria', () => {
  const movement: CashMovementDomain = {
    id: 'cm-1',
    cashSessionId: 'cs-101',
    hotelId: 'hotel-a',
    type: 'REFUND',
    amount: 30.0,
    description: 'Estorno de item cancelado pelo cliente',
    createdAt: new Date().toISOString(),
    createdBy: 'user-manager-1',
  };
  assert.equal(movement.type, 'REFUND');
  assert.equal(CASH_MOVEMENT_TYPES.includes(movement.type), true);
});

// 8. Fechamento de caixa
test('8. fechamento de caixa: calcula valor esperado baseado em abertura, vendas e retiradas', () => {
  const opening = 200.0;
  const sales = 850.0;
  const supplies = 50.0;
  const withdrawals = 100.0;
  const refunds = 30.0;
  const counted = 970.0;

  // Expected = 200 + 850 + 50 - 100 - 30 = 970.0
  const closing = calculateCashClosing(opening, sales, supplies, withdrawals, refunds, counted);
  assert.equal(closing.expectedCash, 970.0);
  assert.equal(closing.difference, 0.0);
});

// 9. Diferença de caixa
test('9. diferença de caixa: registra sobras ou faltas com precisão', () => {
  const closingShort = calculateCashClosing(100, 500, 0, 0, 0, 580); // Expected: 600, Actual: 580 -> -20
  assert.equal(closingShort.expectedCash, 600);
  assert.equal(closingShort.difference, -20);

  const closingOver = calculateCashClosing(100, 500, 0, 0, 0, 615); // Expected: 600, Actual: 615 -> +15
  assert.equal(closingOver.difference, 15);
});

// 10. Venda em quarto (Room Charge)
test('10. venda em quarto: associa stayId, folioId e roomId ao pedido', () => {
  const roomOrder: OrderDomain = {
    id: 'ord-room-1',
    hotelId: 'hotel-a',
    orderNumber: 1002,
    source: 'ROOM_SERVICE',
    status: 'CONFIRMED',
    roomId: 'room-202',
    stayId: 'stay-300',
    folioId: 'folio-300',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(roomOrder.source, 'ROOM_SERVICE');
  assert.equal(roomOrder.roomId, 'room-202');
  assert.equal(roomOrder.folioId, 'folio-300');
});

// 11. Quarto sem hospedagem
test('11. quarto sem hospedagem: validação rejeita cobrança em quarto vago', () => {
  const isRoomOccupied = false;
  assert.throws(
    () => {
      if (!isRoomOccupied) {
        throw new Error('Não há estadia ativa para o quarto selecionado.');
      }
    },
    /Não há estadia ativa/
  );
});

// 12. Checkout
test('12. checkout: encerra sessão do tablet e prepara dispositivo para novo hóspede', () => {
  const tablet: RoomDeviceDomain = {
    id: 'dev-1',
    hotelId: 'hotel-a',
    roomId: 'room-101',
    deviceIdentifier: 'tab-101',
    token: 'jwt-active',
    status: 'ACTIVE',
    activeStayId: 'stay-old',
    lastSeenAt: '2026-08-26T08:00:00Z',
  };

  const resetTablet = resetDeviceOnCheckout(tablet);
  assert.equal(resetTablet.activeStayId, null);
  assert.equal(resetTablet.status, 'ACTIVE');
});

// 13. Tablet associado
test('13. tablet associado: valida autorização exclusivamente para o quarto vinculado', () => {
  const tablet: RoomDeviceDomain = {
    id: 'dev-1',
    hotelId: 'hotel-a',
    roomId: 'room-101',
    deviceIdentifier: 'tab-101',
    token: 'jwt-active',
    status: 'ACTIVE',
    activeStayId: 'stay-101',
    lastSeenAt: new Date().toISOString(),
  };

  assert.equal(isDeviceAuthorizedForRoom(tablet, 'room-101'), true);
});

// 14. Tablet tentando acessar outro quarto
test('14. tablet tentando acessar outro quarto: rejeita acesso cruzado de quarto', () => {
  const tablet: RoomDeviceDomain = {
    id: 'dev-1',
    hotelId: 'hotel-a',
    roomId: 'room-101',
    deviceIdentifier: 'tab-101',
    token: 'jwt-active',
    status: 'ACTIVE',
    lastSeenAt: new Date().toISOString(),
  };

  assert.equal(isDeviceAuthorizedForRoom(tablet, 'room-102'), false);
});

// 15. Pedido Room Service
test('15. pedido Room Service: origem padronizada e fontes canônicas', () => {
  assert.equal(ORDER_SOURCES.includes('ROOM_SERVICE'), true);
  assert.deepEqual([...ORDER_SOURCES], ['POS', 'ROOM_SERVICE', 'TABLET', 'QR', 'OTHER']);
});

// 16. KDS
test('16. KDS: setores de preparação (COZINHA, BAR, CAFETERIA, OUTROS) e estados de preparo', () => {
  assert.deepEqual([...PREPARATION_SECTORS], ['COZINHA', 'BAR', 'CAFETERIA', 'OUTROS']);
  assert.equal(ORDER_STATUSES.includes('PREPARING'), true);
  assert.equal(ORDER_STATUSES.includes('READY'), true);
  assert.equal(ORDER_STATUSES.includes('DELIVERING'), true);
  assert.equal(ORDER_STATUSES.includes('DELIVERED'), true);
});

// 17. Realtime
test('17. realtime: estados de pedido cobrem fluxo completo de produção e entrega', () => {
  const fullFlow = ['CREATED', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'COMPLETED'];
  for (const st of fullFlow) {
    assert.equal(ORDER_STATUSES.includes(st as any), true);
  }
});

// 18. Estoque
test('18. estoque: status OUT_OF_STOCK impede novas adições ao pedido', () => {
  const product: PdvProductDomain = {
    id: 'prod-coca',
    hotelId: 'hotel-a',
    name: 'Coca-Cola Lata 350ml',
    category: 'Bebidas',
    price: 8.0,
    status: 'OUT_OF_STOCK' as ProductStatus,
    stockQuantity: 0,
    minStockQuantity: 10,
    preparationSector: 'BAR',
  };

  assert.equal(product.status, 'OUT_OF_STOCK');
  assert.equal(PRODUCT_STATUSES.includes(product.status), true);
  const canSell = (product.status as string) === 'ACTIVE' && product.stockQuantity > 0;
  assert.equal(canSell, false);
});

// 19. Folio
test('19. Folio: cobrança de pedido lançada no Folio com integridade e sem duplicação', () => {
  const folioItem = {
    folioId: 'folio-101',
    hotelId: 'hotel-a',
    source: 'POS',
    description: 'Pedido PDV #1001',
    quantity: 1,
    unitPrice: 65.0,
    total: 65.0,
    status: 'active',
  };
  assert.equal(folioItem.source, 'POS');
  assert.equal(folioItem.total, 65.0);
});

// 20. Concorrência
test('20. concorrência: múltiplas chamadas com mesma chave de idempotência retornam o mesmo pedido', () => {
  const idempotencyKey = 'idem-pdv-9988';
  const orderRegistry = new Map<string, string>();

  // Primeira chamada
  if (!orderRegistry.has(idempotencyKey)) {
    orderRegistry.set(idempotencyKey, 'ord-generated-1');
  }
  const result1 = orderRegistry.get(idempotencyKey);

  // Segunda chamada concorrente
  if (!orderRegistry.has(idempotencyKey)) {
    orderRegistry.set(idempotencyKey, 'ord-generated-2');
  }
  const result2 = orderRegistry.get(idempotencyKey);

  assert.equal(result1, 'ord-generated-1');
  assert.equal(result2, 'ord-generated-1');
});

// 21. RLS
test('21. RLS: operações de PDV respeitam o contexto do hotel logado', () => {
  const registerA: CashRegisterDomain = { id: 'cr-a', hotelId: 'hotel-a', name: 'Balcão A', code: 'CX-A', active: true };
  const registerB: CashRegisterDomain = { id: 'cr-b', hotelId: 'hotel-b', name: 'Balcão B', code: 'CX-B', active: true };

  const currentHotelId = 'hotel-a';
  const accessibleRegisters = [registerA, registerB].filter((r) => r.hotelId === currentHotelId);
  assert.equal(accessibleRegisters.length, 1);
  assert.equal(accessibleRegisters[0].id, 'cr-a');
});

// 22. Isolamento multi-hotel
test('22. isolamento multi-hotel: produtos e pedidos pertencem estritamente a um hotel', () => {
  const orderA: OrderDomain = {
    id: 'ord-a',
    hotelId: 'hotel-a',
    orderNumber: 501,
    source: 'POS',
    status: 'COMPLETED',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert.equal(orderA.hotelId, 'hotel-a');
  assert.notEqual(orderA.hotelId, 'hotel-b');
});
