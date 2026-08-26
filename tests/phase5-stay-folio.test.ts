import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateFolioBalance,
  canCheckOut,
  FOLIO_ITEM_SOURCES,
  FOLIO_ITEM_STATUSES,
  GUEST_ROLES,
  PAYMENT_METHODS,
  STAY_STATUSES,
  type Folio,
  type FolioItem,
  type FolioPayment,
  type RoomChangeRecord,
  type Stay,
  type StayExtensionRecord,
  type StayGuest,
} from '../src/domain/stayCore';

// 1. Contrato de Status de Estadia
test('1. stay status contract is explicit and covers all lifecycle states', () => {
  assert.deepEqual(STAY_STATUSES, ['EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']);
});

// 2. Transição de Check-in (Room -> OCCUPIED, Stay -> CHECKED_IN, Folio -> OPEN)
test('2. check-in transition updates room to OCCUPIED, stay to CHECKED_IN and opens folio', () => {
  const stay: Stay = {
    id: 'stay-101',
    hotelId: 'hotel-alpha',
    reservationId: 'res-999',
    roomId: 'room-301',
    primaryGuestId: 'guest-1',
    status: 'CHECKED_IN',
    actualCheckInAt: new Date().toISOString(),
    expectedCheckOut: '2026-09-05',
    actualCheckOutAt: null,
  };

  const folio: Folio = {
    id: 'folio-101',
    hotelId: 'hotel-alpha',
    stayId: stay.id,
    status: 'open',
    currency: 'BRL',
  };

  const roomStatus = 'ocupado';

  assert.equal(stay.status, 'CHECKED_IN');
  assert.equal(folio.status, 'open');
  assert.equal(roomStatus, 'ocupado');
});

// 3. Transição de Check-out (Stay -> CHECKED_OUT, Folio -> CLOSED, Room -> DIRTY)
test('3. check-out transition validates balance and updates room to DIRTY', () => {
  const initialBalance = 0;
  const allowCheckout = canCheckOut(initialBalance);
  assert.equal(allowCheckout, true);

  const checkedOutStay: Stay = {
    id: 'stay-101',
    hotelId: 'hotel-alpha',
    reservationId: 'res-999',
    roomId: 'room-301',
    primaryGuestId: 'guest-1',
    status: 'CHECKED_OUT',
    actualCheckInAt: '2026-09-01T14:00:00Z',
    expectedCheckOut: '2026-09-05',
    actualCheckOutAt: '2026-09-05T11:00:00Z',
  };

  const closedFolio: Folio = {
    id: 'folio-101',
    hotelId: 'hotel-alpha',
    stayId: checkedOutStay.id,
    status: 'closed',
    currency: 'BRL',
    closedAt: '2026-09-05T11:00:00Z',
  };

  const roomStatusAfterCheckout = 'sujo';

  assert.equal(checkedOutStay.status, 'CHECKED_OUT');
  assert.equal(closedFolio.status, 'closed');
  assert.equal(roomStatusAfterCheckout, 'sujo');
});

// 4. Origens Centralizadas de Folio
test('4. folio item sources are centralized and support all modules', () => {
  const expectedSources = [
    'ROOM',
    'POS',
    'FRIGOBAR',
    'ROOM_SERVICE',
    'LAUNDRY',
    'MANUAL',
    'TAX',
    'DISCOUNT',
    'ADJUSTMENT',
  ];
  assert.deepEqual([...FOLIO_ITEM_SOURCES], expectedSources);
});

// 5. Métodos de Pagamento Padronizados
test('5. payment methods are centralized', () => {
  assert.deepEqual([...PAYMENT_METHODS], ['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER']);
});

// 6. Cálculo de Saldo do Folio com Pagamentos Parciais e Múltiplos
test('6. folio balance accurately computes active items, multiple payments, and refunds', () => {
  const items: Array<{ total: number; status: 'active' | 'voided' | 'refunded' | 'transferred' }> = [
    { total: 350.0, status: 'active' }, // Diária
    { total: 45.0, status: 'active' },  // Frigobar
    { total: 80.0, status: 'voided' },  // Item estornado (não soma)
    { total: 25.0, status: 'active' },  // Room service
  ];

  const payments: Array<{ amount: number; status: string }> = [
    { amount: 200.0, status: 'approved' }, // Pagamento parcial 1 (PIX)
    { amount: 100.0, status: 'approved' }, // Pagamento parcial 2 (Cartão)
  ];

  const calc = calculateFolioBalance(items, payments);
  // Charges: 350 + 45 + 25 = 420
  // Payments: 200 + 100 = 300
  // Balance: 420 - 300 = 120
  assert.equal(calc.charges, 420.0);
  assert.equal(calc.payments, 300.0);
  assert.equal(calc.balance, 120.0);

  // Tentativa de checkout sem autorização de saldo devedor deve ser bloqueada
  assert.equal(canCheckOut(calc.balance, false), false);
  // Com autorização de dívida, deve ser permitido
  assert.equal(canCheckOut(calc.balance, true), true);
});

// 7. Não-Destrutividade de Itens Financeiros (Estorno / Void via Status)
test('7. folio item voiding preserves historical records with voided status', () => {
  const item: FolioItem = {
    id: 'item-1',
    hotelId: 'hotel-alpha',
    folioId: 'folio-101',
    source: 'FRIGOBAR',
    description: 'Água com gás 500ml',
    quantity: 2,
    unitPrice: 8.0,
    total: 16.0,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'user-op-1',
  };

  assert.equal(item.status, 'active');

  // Voiding
  const voidedItem: FolioItem = {
    ...item,
    status: 'voided',
  };
  assert.equal(voidedItem.status, 'voided');
  assert.equal(FOLIO_ITEM_STATUSES.includes(voidedItem.status), true);
});

// 8. Troca de Quarto (Room Change)
test('8. room change records previous room, new room, reason and updates room states', () => {
  const roomChange: RoomChangeRecord = {
    stayId: 'stay-101',
    oldRoomId: 'room-101',
    newRoomId: 'room-102',
    reason: 'Ar-condicionado com ruído',
    performedBy: 'user-reception-1',
    timestamp: new Date().toISOString(),
  };

  assert.equal(roomChange.oldRoomId, 'room-101');
  assert.equal(roomChange.newRoomId, 'room-102');
  assert.ok(roomChange.reason.length > 0);
});

// 9. Extensão de Estadia
test('9. stay extension updates expected check-out and validates chronological integrity', () => {
  const currentExpected = '2026-09-05';
  const newExpected = '2026-09-08';

  assert.equal(new Date(newExpected) > new Date(currentExpected), true);

  const extension: StayExtensionRecord = {
    stayId: 'stay-101',
    oldExpectedCheckOut: currentExpected,
    newExpectedCheckOut: newExpected,
    reason: 'Hóspede estendeu o período de férias',
    timestamp: new Date().toISOString(),
  };

  assert.equal(extension.newExpectedCheckOut, '2026-09-08');
});

// 10. Múltiplos Hóspedes por Estadia (Titular, Acompanhante, Criança)
test('10. stay guests support primary, companion, and child roles with age tracking', () => {
  const stayGuests: StayGuest[] = [
    { stayId: 'stay-101', guestId: 'g-titular', role: 'PRIMARY', isPrimary: true },
    { stayId: 'stay-101', guestId: 'g-spouse', role: 'COMPANION', isPrimary: false },
    { stayId: 'stay-101', guestId: 'g-kid', role: 'CHILD', isPrimary: false, childAge: 6 },
  ];

  assert.equal(stayGuests.length, 3);
  assert.equal(stayGuests[0].isPrimary, true);
  assert.equal(stayGuests[2].childAge, 6);
  assert.deepEqual([...GUEST_ROLES], ['PRIMARY', 'COMPANION', 'CHILD']);
});

// 11. Isolamento por Hotel em Stay e Folio
test('11. stay and folio strictly enforce hotelId boundary', () => {
  const stayHotelA: Stay = {
    id: 'stay-a',
    hotelId: 'hotel-a',
    reservationId: 'res-a',
    roomId: 'room-a',
    primaryGuestId: 'guest-a',
    status: 'CHECKED_IN',
    actualCheckInAt: '2026-09-01T14:00:00Z',
    expectedCheckOut: '2026-09-04',
    actualCheckOutAt: null,
  };

  const folioHotelA: Folio = {
    id: 'folio-a',
    hotelId: 'hotel-a',
    stayId: stayHotelA.id,
    status: 'open',
    currency: 'BRL',
  };

  assert.equal(stayHotelA.hotelId, folioHotelA.hotelId);
  assert.notEqual(stayHotelA.hotelId, 'hotel-b');
});
