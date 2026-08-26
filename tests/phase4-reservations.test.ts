import assert from 'node:assert/strict';
import test from 'node:test';
import { BED_MATCHES, BOOKING_MODES, PAYMENT_STATUSES, RESERVATION_STATUSES } from '../src/domain/hotelOsCore';
import { availabilityService } from '../src/services/availabilityService';

test('phase 4 centralizes reservation states', () => {
  assert.deepEqual([...BOOKING_MODES], ['AUTO', 'MANUAL', 'GUEST_SELECTION']);
  assert.deepEqual([...PAYMENT_STATUSES], ['PAYMENT_PENDING', 'PAYMENT_APPROVED', 'PAYMENT_FAILED']);
  assert.equal(RESERVATION_STATUSES.includes('cancelada'), true);
});

test('bed match has explicit grades', () => {
  assert.deepEqual([...BED_MATCHES], ['EXACT', 'GOOD', 'PARTIAL', 'INCOMPATIBLE']);
});

test('availability service rejects invalid date ranges before repository access', async () => {
  await assert.rejects(
    availabilityService.search({ hotelId: 'hotel-a', checkin: '2026-09-10', checkout: '2026-09-10', adults: 2, children: 0 }),
    /Check-out deve ser posterior/
  );
});

test('availability service rejects zero adults', async () => {
  await assert.rejects(
    availabilityService.search({ hotelId: 'hotel-a', checkin: '2026-09-10', checkout: '2026-09-11', adults: 0, children: 0 }),
    /quantidade de adultos/i
  );
});
