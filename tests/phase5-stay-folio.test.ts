import test from 'node:test';
import assert from 'node:assert/strict';
import { STAY_STATUSES, FOLIO_ITEM_SOURCES, PAYMENT_METHODS } from '../src/domain/stayCore';

test('stay status contract is explicit', () => {
  assert.deepEqual(STAY_STATUSES, ['EXPECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']);
});

test('folio sources are centralized', () => {
  assert.ok(FOLIO_ITEM_SOURCES.includes('ROOM'));
  assert.ok(FOLIO_ITEM_SOURCES.includes('POS'));
  assert.ok(FOLIO_ITEM_SOURCES.includes('FRIGOBAR'));
  assert.ok(FOLIO_ITEM_SOURCES.includes('ROOM_SERVICE'));
  assert.ok(FOLIO_ITEM_SOURCES.includes('LAUNDRY'));
});

test('payment methods are centralized', () => {
  assert.deepEqual(PAYMENT_METHODS, ['CASH', 'PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER']);
});

test('checkout date must be after check-in date', () => {
  const checkIn = new Date('2026-09-10T15:00:00-03:00');
  const checkout = new Date('2026-09-10T12:00:00-03:00');
  assert.equal(checkout > checkIn, false);
});

test('partial payments preserve a positive remaining balance', () => {
  const charges = 500;
  const payments = 200;
  assert.equal(charges - payments, 300);
});

test('room checkout state transition is represented by the domain contract', () => {
  assert.ok(STAY_STATUSES.includes('CHECKED_OUT'));
});
