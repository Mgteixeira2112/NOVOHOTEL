import { describe, expect, it } from 'vitest';
import { eventMatchesCondition, isAuthorizedForEvent, nextEventStatus } from '../src/core/events/eventPolicy';

describe('event policy', () => {
  it('matches rule conditions against event payload', () => {
    expect(eventMatchesCondition({ payload: { source: 'ROOM_TABLET' } }, { source: 'ROOM_TABLET' })).toBe(true);
    expect(eventMatchesCondition({ payload: { source: 'POS' } }, { source: 'ROOM_TABLET' })).toBe(false);
  });

  it('does not authorize a cross-hotel realtime event', () => {
    expect(isAuthorizedForEvent(
      { userId: 'u1', organizationId: 'org1', hotelId: 'hotel-a', permission: 'ORDER_VIEW' },
      { organizationId: 'org1', hotelId: 'hotel-b' },
    )).toBe(false);
  });

  it('authorizes an event in the active hotel', () => {
    expect(isAuthorizedForEvent(
      { userId: 'u1', organizationId: 'org1', hotelId: 'hotel-a', permission: 'ORDER_VIEW' },
      { organizationId: 'org1', hotelId: 'hotel-a' },
    )).toBe(true);
  });

  it('moves failed processing to dead letter after retry limit', () => {
    expect(nextEventStatus(4)).toBe('FAILED');
    expect(nextEventStatus(5)).toBe('DEAD_LETTER');
  });
});
