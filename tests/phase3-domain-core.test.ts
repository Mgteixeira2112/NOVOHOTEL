import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DOMAIN_EVENTS,
  FOLIO_STATUSES,
  INVENTORY_MOVEMENT_TYPES,
  OPERATIONAL_TASK_TYPES,
  ORDER_ORIGINS,
  RESERVATION_STATUSES,
  ROOM_STATUSES,
  STAY_STATUSES,
  TRANSACTION_TYPES,
} from '../src/domain/hotelOsCore';

test('reservation, stay and folio remain distinct concepts', () => {
  assert.equal(RESERVATION_STATUSES.includes('confirmada'), true);
  assert.equal(STAY_STATUSES.includes('checked_in'), true);
  assert.equal(FOLIO_STATUSES.includes('open'), true);
});

test('room/order/inventory/task domain vocabularies are centralized', () => {
  assert.equal(ROOM_STATUSES.includes('disponivel'), true);
  assert.equal(ORDER_ORIGINS.includes('ROOM_TABLET'), true);
  assert.equal(INVENTORY_MOVEMENT_TYPES.includes('TRANSFER'), true);
  assert.equal(OPERATIONAL_TASK_TYPES.includes('LAUNDRY'), true);
  assert.equal(TRANSACTION_TYPES.includes('refund'), true);
});

test('required domain events are registered once', () => {
  assert.equal(new Set(DOMAIN_EVENTS).size, DOMAIN_EVENTS.length);
  assert.deepEqual(DOMAIN_EVENTS, [
    'reservation.created',
    'reservation.cancelled',
    'stay.checked_in',
    'stay.checked_out',
    'order.created',
    'order.completed',
    'task.created',
    'task.completed',
    'payment.created',
  ]);
});
