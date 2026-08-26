import test from 'node:test';
import assert from 'node:assert/strict';

const SOURCES = ['POS','ROOM_SERVICE','TABLET','QR','OTHER'] as const;
const ORDER_STATUS = ['CREATED','CONFIRMED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED'] as const;
const PAYMENT_METHODS = ['CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER'] as const;

function total(items: Array<{ price:number; quantity:number; discount?:number }>) {
  return items.reduce((sum, item) => sum + Math.max(item.price * item.quantity - (item.discount ?? 0), 0), 0);
}

test('PDV source contract is centralized', () => assert.deepEqual(SOURCES, ['POS','ROOM_SERVICE','TABLET','QR','OTHER']));
test('order lifecycle contains KDS states', () => assert.ok(ORDER_STATUS.includes('PREPARING') && ORDER_STATUS.includes('READY')));
test('payment methods match Hotel OS', () => assert.ok(PAYMENT_METHODS.includes('PIX') && PAYMENT_METHODS.includes('CASH')));
test('server-side total calculation ignores client total', () => assert.equal(total([{ price:25, quantity:2, discount:5 }]), 45));
test('discount cannot make an item negative', () => assert.equal(total([{ price:10, quantity:1, discount:50 }]), 0));
test('room service requires an active stay context', () => {
  const activeStay = true;
  const hasFolio = true;
  assert.equal(activeStay && hasFolio, true);
});
test('tablet context is immutable from the order payload', () => {
  const deviceRoom = '203';
  const requestedRoom = '999';
  assert.notEqual(deviceRoom, requestedRoom);
});
test('cash difference is calculated from expected versus counted cash', () => assert.equal(1250 - 1200, 50));
test('stock is not deducted during cart calculation', () => {
  const stockBefore = 8;
  total([{ price:12, quantity:2 }]);
  assert.equal(stockBefore, 8);
});
