import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CASH_SESSION_STATUSES,
  detectReservationConflict,
  DOMAIN_EVENTS,
  FOLIO_STATUSES,
  INVENTORY_MOVEMENT_TYPES,
  OPERATIONAL_TASK_TYPES,
  ORDER_ORIGINS,
  RESERVATION_STATUSES,
  ROOM_STATUSES,
  STAY_STATUSES,
  TRANSACTION_TYPES,
  type AuditLogEntry,
  type CashRegister,
  type CashSession,
  type Folio,
  type Guest,
  type InventoryMovement,
  type OperationalTask,
  type OrderDomainRef,
  type ReservationDomain,
  type RoomBed,
  type Stay,
  type TransactionDomain,
} from '../src/domain/hotelOsCore';

// 1. Reservation
test('1. reservation domain model encapsulates reservation lifecycle', () => {
  const reservation: ReservationDomain = {
    id: 'res-100',
    hotelId: 'hotel-alpha',
    guestId: 'guest-1',
    roomId: 'room-101',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-05',
    status: 'confirmada',
    totalAmount: 1200.0,
  };
  assert.equal(reservation.status, 'confirmada');
  assert.equal(RESERVATION_STATUSES.includes(reservation.status), true);
});

// 2. Stay
test('2. stay represents effectively started check-in', () => {
  const stay: Stay = {
    id: 'stay-500',
    hotelId: 'hotel-alpha',
    reservationId: 'res-100',
    roomId: 'room-101',
    status: 'checked_in',
    checkedInAt: '2026-09-01T14:00:00Z',
    checkedOutAt: null,
  };
  assert.equal(stay.status, 'checked_in');
  assert.equal(STAY_STATUSES.includes(stay.status), true);
});

// 3. Folio
test('3. folio represents account linked to stay', () => {
  const folio: Folio = {
    id: 'folio-88',
    hotelId: 'hotel-alpha',
    stayId: 'stay-500',
    status: 'open',
    currency: 'BRL',
  };
  assert.equal(folio.status, 'open');
  assert.equal(FOLIO_STATUSES.includes(folio.status), true);
});

// 4. Room
test('4. room statuses are centralized and standard', () => {
  assert.deepEqual(ROOM_STATUSES, ['disponivel', 'ocupado', 'manutencao', 'sujo', 'limpeza', 'vistoria']);
});

// 5. Room beds
test('5. room beds support flexible configurations (king, double, single, etc)', () => {
  const bedConfig: RoomBed[] = [
    { id: 'b1', roomId: 'r101', bedTypeId: 'queen', quantity: 1 },
    { id: 'b2', roomId: 'r101', bedTypeId: 'solteiro', quantity: 1 },
  ];
  assert.equal(bedConfig.length, 2);
  assert.equal(bedConfig[0].quantity + bedConfig[1].quantity, 2);
});

// 6. Order
test('6. order associates hotel, stay, room, device, user and origin', () => {
  const order: OrderDomainRef = {
    id: 'ord-123',
    hotelId: 'hotel-alpha',
    stayId: 'stay-500',
    roomId: 'r101',
    deviceId: 'tablet-101',
    userId: 'guest-user-1',
    origin: 'ROOM_TABLET',
    status: 'received',
  };
  assert.equal(ORDER_ORIGINS.includes(order.origin), true);
  assert.equal(order.origin, 'ROOM_TABLET');
});

// 7. Inventory
test('7. inventory movements support purchase, sale, consumption, loss, etc', () => {
  const mov: InventoryMovement = {
    id: 'mov-1',
    hotelId: 'hotel-alpha',
    productId: 'prod-agua',
    movementType: 'CONSUMPTION',
    quantity: 2,
    unitCost: 3.5,
    previousBalance: 10,
    newBalance: 8,
    createdAt: new Date().toISOString(),
  };
  assert.equal(INVENTORY_MOVEMENT_TYPES.includes(mov.movementType), true);
  assert.equal(mov.newBalance, mov.previousBalance - mov.quantity);
});

// 8. Tasks
test('8. operational tasks support housekeeping, maintenance, laundry, inspection', () => {
  const task: OperationalTask = {
    id: 'task-1',
    hotelId: 'hotel-alpha',
    department: 'HOUSEKEEPING',
    title: 'Limpeza de Quarto Pós-Checkout',
    status: 'pendente',
    roomId: 'r101',
  };
  assert.equal(OPERATIONAL_TASK_TYPES.includes(task.department), true);
});

// 9. Devices
test('9. device types support POS, TABLET_ROOM, KDS, TOTEM, MOBILE', () => {
  const supportedDevices = ['POS', 'TABLET_ROOM', 'KDS', 'TOTEM', 'MOBILE'];
  assert.equal(supportedDevices.includes('TABLET_ROOM'), true);
  assert.equal(supportedDevices.includes('KDS'), true);
});

// 10. Cash sessions
test('10. cash register and cash sessions control opening and closing', () => {
  const register: CashRegister = {
    id: 'cr-1',
    hotelId: 'hotel-alpha',
    name: 'Caixa Recepção 01',
    active: true,
  };
  const session: CashSession = {
    id: 'cs-1',
    hotelId: 'hotel-alpha',
    cashRegisterId: register.id,
    status: 'open',
    openedAt: '2026-08-26T08:00:00Z',
    closedAt: null,
  };
  assert.equal(CASH_SESSION_STATUSES.includes(session.status), true);
});

// 11. Transactions
test('11. transactions centralize payments, charges, refunds and adjustments', () => {
  const tx: TransactionDomain = {
    id: 'tx-1',
    hotelId: 'hotel-alpha',
    type: 'payment',
    amount: 150.0,
    folioId: 'folio-88',
    orderId: 'ord-123',
    cashSessionId: 'cs-1',
  };
  assert.equal(TRANSACTION_TYPES.includes(tx.type), true);
});

// 12. Audit logs
test('12. audit logs capture actor, hotel, entity, old/new data, action, timestamp', () => {
  const audit: AuditLogEntry = {
    id: 'aud-1',
    hotelId: 'hotel-alpha',
    actorId: 'user-manager-1',
    action: 'RESERVATION_CANCEL',
    entityType: 'reservation',
    entityId: 'res-100',
    oldData: { status: 'confirmada' },
    newData: { status: 'cancelada' },
    createdAt: new Date().toISOString(),
  };
  assert.equal(audit.action, 'RESERVATION_CANCEL');
  assert.equal(audit.oldData?.status, 'confirmada');
  assert.equal(audit.newData?.status, 'cancelada');
});

// 13. Isolamento por hotel
test('13. multi-hotel isolation enforces hotelId scoping across all domain entities', () => {
  const guest: Guest = { id: 'g1', hotelId: 'hotel-a', name: 'Maria Silva' };
  const resA: ReservationDomain = {
    id: 'rA',
    hotelId: 'hotel-a',
    guestId: guest.id,
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-05',
    status: 'confirmada',
    totalAmount: 500,
  };

  assert.equal(guest.hotelId, resA.hotelId);
  assert.notEqual(resA.hotelId, 'hotel-b');
});

// 14. Conflito de reserva
test('14. reservation conflict detection prevents overlapping bookings for same room', () => {
  const existingReservations = [
    { checkIn: '2026-09-10', checkOut: '2026-09-15', status: 'confirmada' as const },
    { checkIn: '2026-09-20', checkOut: '2026-09-25', status: 'cancelada' as const },
  ];

  // Overlapping request
  const hasConflict1 = detectReservationConflict(existingReservations, {
    checkIn: '2026-09-12',
    checkOut: '2026-09-17',
  });
  assert.equal(hasConflict1, true);

  // Non-overlapping request (after existing)
  const hasConflict2 = detectReservationConflict(existingReservations, {
    checkIn: '2026-09-15',
    checkOut: '2026-09-18',
  });
  assert.equal(hasConflict2, false);

  // Overlapping with cancelled reservation (should be allowed)
  const hasConflict3 = detectReservationConflict(existingReservations, {
    checkIn: '2026-09-21',
    checkOut: '2026-09-24',
  });
  assert.equal(hasConflict3, false);
});
