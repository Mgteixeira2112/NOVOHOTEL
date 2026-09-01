import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/components/admin/ReservationsModule.tsx', 'utf8');

test('ReservationsModule não consome o array legado de payments', () => {
  const hotelDestructuring = source.split('= useHotel();', 1)[0];
  assert.doesNotMatch(hotelDestructuring, /payments/);
  assert.doesNotMatch(source, /payments\.(filter|find|map|reduce)/);
});
