import assert from 'node:assert/strict';
import test from 'node:test';
import { DOMAIN_EVENTS, INVENTORY_MOVEMENT_TYPES, OPERATIONAL_TASK_TYPES, ORDER_ORIGINS, RESERVATION_STATUSES, STAY_STATUSES } from '../src/domain/hotelOsCore';

test('reservation lifecycle includes reservation and checkout states', () => {
  assert.ok(RESERVATION_STATUSES.includes('pendente'));
  assert.ok(RESERVATION_STATUSES.includes('confirmada'));
  assert.ok(RESERVATION_STATUSES.includes('checkin_realizado'));
  assert.ok(RESERVATION_STATUSES.includes('checkout_concluido'));
  assert.ok(RESERVATION_STATUSES.includes('cancelada'));
});

test('stay lifecycle is independent from reservation lifecycle', () => {
  assert.deepEqual(STAY_STATUSES, ['checked_in', 'checked_out', 'cancelled']);
});

test('order origins cover the future Hotel OS channels', () => {
  for (const origin of ['POS', 'ROOM_TABLET', 'RESTAURANT', 'BAR', 'ROOM_SERVICE', 'KIOSK'] as const) assert.ok(ORDER_ORIGINS.includes(origin));
});

test('inventory ledger covers all required movement types', () => {
  for (const type of ['PURCHASE', 'SALE', 'CONSUMPTION', 'ADJUSTMENT', 'TRANSFER', 'LOSS', 'RETURN'] as const) assert.ok(INVENTORY_MOVEMENT_TYPES.includes(type));
});

test('operational tasks cover all future departments', () => {
  for (const type of ['HOUSEKEEPING', 'MAINTENANCE', 'ROOM_SERVICE', 'LAUNDRY', 'INSPECTION'] as const) assert.ok(OPERATIONAL_TASK_TYPES.includes(type));
});

test('domain event names are unique and canonical', () => {
  assert.equal(new Set(DOMAIN_EVENTS).size, DOMAIN_EVENTS.length);
  assert.ok(DOMAIN_EVENTS.includes('reservation.created'));
  assert.ok(DOMAIN_EVENTS.includes('stay.checked_in'));
  assert.ok(DOMAIN_EVENTS.includes('order.created'));
  assert.ok(DOMAIN_EVENTS.includes('task.created'));
  assert.ok(DOMAIN_EVENTS.includes('payment.created'));
});
