import test from 'node:test';
import assert from 'node:assert/strict';
import { localQueue } from '../src/core/offline/localQueue';
import { deviceService } from '../src/core/device/deviceService';

test('local queue accepts compatible non-financial operations', () => {
  localQueue.clear();
  const id = localQueue.enqueue({ operation: 'catalog_refresh', payload: { version: 1 } });
  assert.equal(localQueue.list().length, 1);
  assert.equal(localQueue.list()[0]?.id, id);
  localQueue.clear();
});

test('local queue rejects financial operations', () => {
  localQueue.clear();
  assert.throws(() => localQueue.enqueue({ operation: 'payment_create', payload: { amount: 10 } }));
});

test('device binding requires hotel and supports version checks', () => {
  deviceService.clear();
  deviceService.bind({ deviceId: 'device-1', hotelId: 'hotel-1', deviceType: 'POS', appVersion: '2.3.0' });
  assert.equal(deviceService.get()?.hotelId, 'hotel-1');
  assert.equal(deviceService.isCompatible('2.0.0'), true);
  assert.equal(deviceService.isCompatible('3.0.0'), false);
  deviceService.clear();
});

test('device binding rejects missing context', () => {
  assert.throws(() => deviceService.bind({ deviceId: '', hotelId: 'hotel-1', deviceType: 'TABLET', appVersion: '1.0.0' }));
});
