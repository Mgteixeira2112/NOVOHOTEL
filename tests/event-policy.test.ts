import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { eventMatchesCondition, isAuthorizedForEvent, nextEventStatus } from '../src/core/events/eventPolicy';

describe('event policy', () => {
  it('matches rule conditions against event payload', () => {
    assert.equal(eventMatchesCondition({ payload: { source: 'ROOM_TABLET' } }, { source: 'ROOM_TABLET' }), true);
    assert.equal(eventMatchesCondition({ payload: { source: 'POS' } }, { source: 'ROOM_TABLET' }), false);
  });

  it('does not authorize a cross-hotel realtime event', () => {
    assert.equal(
      isAuthorizedForEvent(
        { userId: 'u1', organizationId: 'org1', hotelId: 'hotel-a', permission: 'ORDER_VIEW' },
        { organizationId: 'org1', hotelId: 'hotel-b' }
      ),
      false
    );
  });

  it('authorizes an event in the active hotel', () => {
    assert.equal(
      isAuthorizedForEvent(
        { userId: 'u1', organizationId: 'org1', hotelId: 'hotel-a', permission: 'ORDER_VIEW' },
        { organizationId: 'org1', hotelId: 'hotel-a' }
      ),
      true
    );
  });

  it('moves failed processing to dead letter after retry limit', () => {
    assert.equal(nextEventStatus(4), 'FAILED');
    assert.equal(nextEventStatus(5), 'DEAD_LETTER');
  });
});
