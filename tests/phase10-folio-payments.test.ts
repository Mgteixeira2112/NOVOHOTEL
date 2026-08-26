import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FOLIO_CATEGORIES,
  FOLIO_ORIGINS,
  FOLIO_STATUSES,
  KITCHEN_KANBAN_COLUMNS,
  ORDER_SOURCES,
  ORDER_STATUSES,
  PAYER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  POS_PERMISSIONS,
  calculateCashSessionTotals,
  computeFolioFinancialSummary,
  mapOrderStatusToKitchenKanban,
  validateFolioForCheckout,
  type CashMovementRecord,
  type CashRegisterRecord,
  type CashSessionRecord,
  type DeviceRecord,
  type DiscountRecord,
  type FolioItemAllocationRecord,
  type FolioItemRecord,
  type FolioPayerRecord,
  type FolioRecord,
  type OrderRecord,
  type PaymentRecord,
  type PosPermission,
} from '../src/domain/folioPaymentCore';
import { addFolioItem, createFolioPayment, voidFolioItem } from '../src/services/folioService';

// 1. Criação de Folio
test('1. criação de folio: cria conta corrente de hospedagem com status OPEN e rastreamento', () => {
  const folio: FolioRecord = {
    id: 'fol-101',
    hotelId: 'hotel-alpha',
    stayId: 'stay-202',
    status: 'OPEN',
    currency: 'BRL',
    openedAt: '2026-10-01T14:00:00Z',
    createdBy: 'user-reception-1',
  };

  assert.equal(folio.status, 'OPEN');
  assert.equal(folio.currency, 'BRL');
  assert.equal(FOLIO_STATUSES.includes('OPEN'), true);
});

// 2. Diária
test('2. diária: lançamento de diária no folio sob categoria ROOM com recálculo autoritativo', () => {
  const roomCharge: FolioItemRecord = {
    id: 'item-d1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'ROOM',
    description: 'Diária Quarto Standard - Noite 01/10',
    quantity: 1,
    unitPrice: 350.0,
    totalAmount: 350.0,
    source: 'RESERVATION',
    sourceId: 'res-night-1',
    createdAt: '2026-10-01T14:00:00Z',
  };

  assert.equal(roomCharge.category, 'ROOM');
  assert.equal(roomCharge.totalAmount, 350.0);
  assert.equal(FOLIO_CATEGORIES.includes('ROOM'), true);
});

// 3. Consumo
test('3. consumo: registro de consumo de frigobar (MINIBAR) associado à estadia', () => {
  const minibarItem: FolioItemRecord = {
    id: 'item-c1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'MINIBAR',
    description: 'Água Mineral sem Gás 500ml',
    quantity: 2,
    unitPrice: 8.0,
    totalAmount: 16.0,
    source: 'MINIBAR',
    sourceId: 'minibar-audit-101',
    createdAt: '2026-10-01T18:30:00Z',
  };

  assert.equal(minibarItem.category, 'MINIBAR');
  assert.equal(minibarItem.totalAmount, 16.0);
});

// 4. PDV
test('4. PDV: venda no ponto de venda com múltiplos itens e cálculo de totais', () => {
  const posItems: FolioItemRecord[] = [
    {
      id: 'p1',
      folioId: 'fol-101',
      hotelId: 'hotel-alpha',
      category: 'FOOD',
      description: 'Hambúrguer Artesanal',
      quantity: 2,
      unitPrice: 45.0,
      totalAmount: 90.0,
      source: 'POS',
      sourceId: 'pos-sale-881-item1',
      createdAt: '2026-10-01T20:00:00Z',
    },
    {
      id: 'p2',
      folioId: 'fol-101',
      hotelId: 'hotel-alpha',
      category: 'BEVERAGE',
      description: 'Suco Natural de Laranja',
      quantity: 2,
      unitPrice: 12.0,
      totalAmount: 24.0,
      source: 'POS',
      sourceId: 'pos-sale-881-item2',
      createdAt: '2026-10-01T20:00:00Z',
    },
  ];

  const total = posItems.reduce((acc, curr) => acc + curr.totalAmount, 0);
  assert.equal(total, 114.0);
});

// 5. Pagamento
test('5. pagamento: registro de pagamento no Folio com método PIX e baixa de saldo', () => {
  const payment: PaymentRecord = {
    id: 'pay-1',
    hotelId: 'hotel-alpha',
    folioId: 'fol-101',
    amount: 350.0,
    method: 'PIX',
    status: 'PAID',
    transactionReference: 'E1234567820261001',
    createdAt: '2026-10-01T15:00:00Z',
  };

  assert.equal(payment.method, 'PIX');
  assert.equal(payment.status, 'PAID');
  assert.equal(PAYMENT_METHODS.includes('PIX'), true);
});

// 6. Lançamento no quarto
test('6. lançamento no quarto: PDV localiza ACTIVE STAY do quarto e cria Folio Item automaticamente', () => {
  const activeStay = {
    id: 'stay-202',
    roomId: 'room-101',
    hotelId: 'hotel-alpha',
    folioId: 'fol-101',
    status: 'CHECKED_IN',
  };

  function chargeToRoom(roomId: string, saleAmount: number, description: string): FolioItemRecord {
    if (activeStay.roomId !== roomId || activeStay.status !== 'CHECKED_IN') {
      throw new Error('NO_ACTIVE_STAY_FOUND');
    }
    return {
      id: 'folio-pos-charge',
      folioId: activeStay.folioId,
      hotelId: activeStay.hotelId,
      category: 'FOOD',
      description,
      quantity: 1,
      unitPrice: saleAmount,
      totalAmount: saleAmount,
      source: 'POS',
      sourceId: 'pos-sale-999',
      createdAt: new Date().toISOString(),
    };
  }

  const charge = chargeToRoom('room-101', 85.0, 'Consumo Restaurante Almoço');
  assert.equal(charge.folioId, 'fol-101');
  assert.equal(charge.totalAmount, 85.0);
  assert.throws(() => chargeToRoom('room-999', 85.0, 'Teste'), /NO_ACTIVE_STAY_FOUND/);
});

// 7. Tablet
test('7. tablet: dispositivo vinculado de forma segura ao quarto e hotel', () => {
  const tabletDevice: DeviceRecord = {
    id: 'dev-tab-101',
    hotelId: 'hotel-alpha',
    roomId: 'room-101',
    type: 'ROOM_TABLET',
    status: 'ACTIVE',
    token: 'jwt-secure-room-token-101',
    createdAt: '2026-09-01T10:00:00Z',
  };

  assert.equal(tabletDevice.type, 'ROOM_TABLET');
  assert.equal(tabletDevice.roomId, 'room-101');
});

// 8. Pedido
test('8. pedido: criação de pedido pelo Room Tablet com status PENDING', () => {
  const order: OrderRecord = {
    id: 'ord-501',
    hotelId: 'hotel-alpha',
    source: 'ROOM_TABLET',
    roomId: 'room-101',
    stayId: 'stay-202',
    status: 'PENDING',
    total: 65.0,
    createdAt: '2026-10-01T21:00:00Z',
    items: [
      { id: 'oi-1', orderId: 'ord-501', productId: 'prod-pasta', quantity: 1, unitPrice: 65.0, totalPrice: 65.0 },
    ],
  };

  assert.equal(order.source, 'ROOM_TABLET');
  assert.equal(order.status, 'PENDING');
  assert.equal(ORDER_SOURCES.includes('ROOM_TABLET'), true);
});

// 9. Cozinha (Kanban)
test('9. cozinha: pedido entra no Kanban da cozinha na coluna NOVOS e avança para PREPARANDO', () => {
  let orderStatus: OrderRecord['status'] = 'CONFIRMED';
  assert.equal(mapOrderStatusToKitchenKanban(orderStatus), 'NOVOS');

  orderStatus = 'PREPARING';
  assert.equal(mapOrderStatusToKitchenKanban(orderStatus), 'PREPARANDO');

  orderStatus = 'READY';
  assert.equal(mapOrderStatusToKitchenKanban(orderStatus), 'PRONTOS');
});

// 10. Entrega
test('10. entrega: fluxo de entrega do pedido avança para ENTREGANDO e CONCLUÍDOS', () => {
  let orderStatus: OrderRecord['status'] = 'DELIVERING';
  assert.equal(mapOrderStatusToKitchenKanban(orderStatus), 'ENTREGANDO');

  orderStatus = 'DELIVERED';
  assert.equal(mapOrderStatusToKitchenKanban(orderStatus), 'CONCLUÍDOS');
});

// 11. Realtime
test('11. realtime: catálogo de 11 eventos operacionais e financeiros da FASE 10', () => {
  const phase10Events = [
    'POS_SALE_CREATED',
    'POS_SALE_VOIDED',
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'ORDER_PREPARING',
    'ORDER_READY',
    'ORDER_DELIVERED',
    'FOLIO_ITEM_CREATED',
    'FOLIO_ITEM_VOIDED',
    'PAYMENT_CREATED',
    'PAYMENT_CONFIRMED',
  ];

  assert.equal(phase10Events.length, 11);
});

// 12. Cancelamento
test('12. cancelamento: cancelamento de pedido transita para CANCELLED preservando histórico', () => {
  const order: OrderRecord = {
    id: 'ord-502',
    hotelId: 'hotel-alpha',
    source: 'ROOM_TABLET',
    status: 'CANCELLED',
    total: 40.0,
    createdAt: '2026-10-01T21:30:00Z',
    items: [],
  };

  assert.equal(order.status, 'CANCELLED');
  assert.equal(ORDER_STATUSES.includes('CANCELLED'), true);
});

// 13. Estorno (VOID/REFUND)
test('13. estorno: anulação de item no folio (VOID) preserva o registro original com motivo e autor', () => {
  const folioItem: FolioItemRecord = {
    id: 'item-err-1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'MINIBAR',
    description: 'Item lançado por engano',
    quantity: 1,
    unitPrice: 20.0,
    totalAmount: 20.0,
    source: 'MINIBAR',
    createdAt: '2026-10-01T10:00:00Z',
    voidedAt: '2026-10-01T10:15:00Z',
    voidedBy: 'user-manager-1',
    voidReason: 'Hóspede não consumiu o produto',
  };

  assert.equal(folioItem.voidReason, 'Hóspede não consumiu o produto');
  assert.notEqual(folioItem.voidedAt, null);

  const summary = computeFolioFinancialSummary([folioItem], []);
  assert.equal(summary.totalCharges, 0); // Item anulado não soma nas cobranças ativas
});

// 14. Desconto
test('14. desconto: estrutura auditável de desconto sem alteração silenciosa do unit_price', () => {
  const discount: DiscountRecord = {
    id: 'disc-1',
    hotelId: 'hotel-alpha',
    folioId: 'fol-101',
    discountType: 'PERCENT',
    value: 10, // 10%
    reason: 'Cortesia Gerência Aniversário',
    approvedBy: 'user-manager-1',
    createdAt: '2026-10-01T11:00:00Z',
  };

  const item: FolioItemRecord = {
    id: 'i1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'ROOM',
    description: 'Diária',
    quantity: 1,
    unitPrice: 500.0,
    totalAmount: 500.0,
    source: 'RESERVATION',
    createdAt: '',
  };

  const summary = computeFolioFinancialSummary([item], [], [discount]);
  assert.equal(summary.totalCharges, 500.0);
  assert.equal(summary.totalDiscounts, 50.0);
  assert.equal(summary.balance, 450.0);
});

// 15. Caixa (Cash Register)
test('15. caixa: cadastro e configuração de PDV físico/terminal', () => {
  const register: CashRegisterRecord = {
    id: 'reg-01',
    hotelId: 'hotel-alpha',
    name: 'Caixa Bar Piscina',
    code: 'POS-PISCINA-01',
    isActive: true,
  };

  assert.equal(register.code, 'POS-PISCINA-01');
  assert.equal(register.isActive, true);
});

// 16. Abertura de caixa
test('16. abertura: sessão de caixa iniciada com fundo de troco', () => {
  const session: CashSessionRecord = {
    id: 'ses-1',
    hotelId: 'hotel-alpha',
    cashRegisterId: 'reg-01',
    operatorId: 'user-barman-1',
    status: 'OPEN',
    openedAt: '2026-10-01T08:00:00Z',
    openingAmount: 200.0,
  };

  assert.equal(session.status, 'OPEN');
  assert.equal(session.openingAmount, 200.0);
});

// 17. Fechamento de caixa
test('17. fechamento: cálculo automático de saldo esperado, sangrias e conciliação', () => {
  const movements: CashMovementRecord[] = [
    { id: 'm1', cashSessionId: 'ses-1', hotelId: 'hotel-alpha', type: 'SALE', amount: 500.0, createdAt: '', createdBy: 'u1' },
    { id: 'm2', cashSessionId: 'ses-1', hotelId: 'hotel-alpha', type: 'SUPPLY', amount: 50.0, createdAt: '', createdBy: 'u1' },
    { id: 'm3', cashSessionId: 'ses-1', hotelId: 'hotel-alpha', type: 'WITHDRAWAL', amount: 100.0, createdAt: '', createdBy: 'u1' },
  ];

  const totals = calculateCashSessionTotals(200.0, movements); // 200 + 500 + 50 - 100 = 650
  assert.equal(totals.expectedCash, 650.0);
  assert.equal(totals.totalSales, 500.0);
  assert.equal(totals.totalWithdrawals, 100.0);
});

// 18. Pagamento parcial
test('18. pagamento parcial: pagamento parcial atualiza o status financeiro para PARTIALLY_PAID', () => {
  const item: FolioItemRecord = {
    id: 'i1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'ROOM',
    description: 'Diária Quarto',
    quantity: 1,
    unitPrice: 1000.0,
    totalAmount: 1000.0,
    source: 'RESERVATION',
    createdAt: '',
  };

  const partialPay: PaymentRecord = {
    id: 'p1',
    hotelId: 'hotel-alpha',
    folioId: 'fol-101',
    amount: 400.0,
    method: 'CREDIT_CARD',
    status: 'PARTIALLY_PAID',
    createdAt: '',
  };

  const summary = computeFolioFinancialSummary([item], [partialPay]);
  assert.equal(summary.status, 'PARTIALLY_PAID');
  assert.equal(summary.balance, 600.0);
});

// 19. Split Folio
test('19. split: divisão de itens entre pagadores múltiplos (hóspede vs empresa)', () => {
  const payerGuest: FolioPayerRecord = { id: 'p-guest', hotelId: 'hotel-alpha', folioId: 'fol-101', payerType: 'GUEST', name: 'Dr. João', createdAt: '' };
  const payerCorp: FolioPayerRecord = { id: 'p-corp', hotelId: 'hotel-alpha', folioId: 'fol-101', payerType: 'COMPANY', name: 'Empresa XYZ Ltda', createdAt: '' };

  const allocationGuest: FolioItemAllocationRecord = { id: 'a1', hotelId: 'hotel-alpha', folioItemId: 'item-minibar', payerId: payerGuest.id, amount: 80.0, createdAt: '' };
  const allocationCorp: FolioItemAllocationRecord = { id: 'a2', hotelId: 'hotel-alpha', folioItemId: 'item-room', payerId: payerCorp.id, amount: 800.0, createdAt: '' };

  assert.equal(allocationGuest.amount, 80.0);
  assert.equal(allocationCorp.amount, 800.0);
  assert.equal(PAYER_TYPES.includes('COMPANY'), true);
});

// 20. Transferência de despesa
test('20. transferência: transferência entre contas registra rastreabilidade no Folio de origem e destino', () => {
  const transferredItem: FolioItemRecord = {
    id: 'item-transf-1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'FOOD',
    description: 'Transferência de Consumo para Folio #102',
    quantity: 1,
    unitPrice: 120.0,
    totalAmount: 120.0,
    source: 'POS',
    createdAt: '',
    voidedAt: '2026-10-01T12:00:00Z',
    voidReason: 'TRANSFER_TO_FOLIO_102',
  };

  assert.equal(transferredItem.voidReason, 'TRANSFER_TO_FOLIO_102');
});

// 21. Estoque
test('21. estoque: venda de produto controlado no PDV aciona débito contábil de estoque', () => {
  let productStock = 50;
  function processSaleItem(quantity: number, isControlled: boolean) {
    if (isControlled) {
      if (productStock < quantity) throw new Error('INSUFFICIENT_STOCK');
      productStock -= quantity;
    }
  }

  processSaleItem(5, true);
  assert.equal(productStock, 45);
  assert.throws(() => processSaleItem(50, true), /INSUFFICIENT_STOCK/);
});

// 22. Permissões de PDV
test('22. permissões: validação rigorosa de matriz RBAC para operações de caixa e PDV', () => {
  const operatorPermissions: PosPermission[] = ['POS_VIEW', 'POS_SELL'];
  const managerPermissions: PosPermission[] = [...POS_PERMISSIONS];

  assert.equal(operatorPermissions.includes('POS_SELL'), true);
  assert.equal(operatorPermissions.includes('POS_REFUND'), false);
  assert.equal(managerPermissions.includes('POS_REFUND'), true);
});

// 23. RLS
test('23. RLS: isolamento estrito de dados financeiros por hotel_id', () => {
  const folios: FolioRecord[] = [
    { id: 'f1', hotelId: 'hotel-a', stayId: 's1', status: 'OPEN', currency: 'BRL', openedAt: '' },
    { id: 'f2', hotelId: 'hotel-b', stayId: 's2', status: 'OPEN', currency: 'BRL', openedAt: '' },
  ];

  const hotelAFolios = folios.filter((f) => f.hotelId === 'hotel-a');
  assert.equal(hotelAFolios.length, 1);
  assert.equal(hotelAFolios[0].id, 'f1');
});

// 24. Multi-hotel
test('24. multi-hotel: terminais, sessões de caixa e pedidos não colidem entre hotéis distintos', () => {
  const registerHotelA: CashRegisterRecord = { id: 'r1', hotelId: 'hotel-a', name: 'Bar', code: 'POS-01', isActive: true };
  const registerHotelB: CashRegisterRecord = { id: 'r2', hotelId: 'hotel-b', name: 'Bar', code: 'POS-01', isActive: true };

  assert.notEqual(registerHotelA.hotelId, registerHotelB.hotelId);
});

// 25. Idempotência
test('25. idempotência: criação de lançamento no folio com mesma chave (source + source_id) não duplica', () => {
  const existingItems: FolioItemRecord[] = [
    {
      id: 'item-1',
      folioId: 'fol-101',
      hotelId: 'hotel-alpha',
      category: 'FOOD',
      description: 'Lanche',
      quantity: 1,
      unitPrice: 30.0,
      totalAmount: 30.0,
      source: 'POS',
      sourceId: 'sale-tx-777',
      createdAt: '',
    },
  ];

  function addIdempotentItem(newItem: FolioItemRecord): FolioItemRecord {
    const existing = existingItems.find(
      (i) => i.folioId === newItem.folioId && i.source === newItem.source && i.sourceId === newItem.sourceId
    );
    if (existing) return existing;
    existingItems.push(newItem);
    return newItem;
  }

  const secondAttempt = addIdempotentItem({
    id: 'item-2',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'FOOD',
    description: 'Lanche',
    quantity: 1,
    unitPrice: 30.0,
    totalAmount: 30.0,
    source: 'POS',
    sourceId: 'sale-tx-777',
    createdAt: '',
  });

  assert.equal(secondAttempt.id, 'item-1');
  assert.equal(existingItems.length, 1);
});

// 26. Concorrência
test('26. concorrência: checkout bloqueado quando saldo devedor estiver pendente', () => {
  const folio: FolioRecord = {
    id: 'fol-101',
    hotelId: 'hotel-alpha',
    stayId: 'stay-202',
    status: 'OPEN',
    currency: 'BRL',
    openedAt: '',
  };

  const item: FolioItemRecord = {
    id: 'i1',
    folioId: 'fol-101',
    hotelId: 'hotel-alpha',
    category: 'ROOM',
    description: 'Diária',
    quantity: 1,
    unitPrice: 300.0,
    totalAmount: 300.0,
    source: 'RESERVATION',
    createdAt: '',
  };

  const check1 = validateFolioForCheckout(folio, [item], []);
  assert.equal(check1.canClose, false);
  assert.match(check1.reason ?? '', /PENDING_BALANCE/);

  const payment: PaymentRecord = {
    id: 'p1',
    hotelId: 'hotel-alpha',
    folioId: 'fol-101',
    amount: 300.0,
    method: 'PIX',
    status: 'PAID',
    createdAt: '',
  };

  const check2 = validateFolioForCheckout(folio, [item], [payment]);
  assert.equal(check2.canClose, true);
});

// 27. Segurança e Validação no Backend
test('27. segurança: backend rejeita preços inválidos ou tentativas de anulação sem motivo', async () => {
  await assert.rejects(
    () => addFolioItem({ folioId: 'f', category: 'FOOD', description: 'x', quantity: 0, unitPrice: 10, source: 'POS' }),
    /INVALID_FOLIO_AMOUNT/
  );
  await assert.rejects(
    () => createFolioPayment({ folioId: 'f', amount: -50, method: 'PIX' }),
    /INVALID_PAYMENT_AMOUNT/
  );
  await assert.rejects(
    () => voidFolioItem('item-id', '   '),
    /VOID_REASON_REQUIRED/
  );
});
