import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseHotel, isTenantContextValid, resolveFeatureFlag } from '../src/core/tenant/tenantPolicy';
import type { FeatureFlag, HotelMembership, TenantContext } from '../src/core/tenant/tenantTypes';

const memberships: HotelMembership[] = [
  { id: 'm-a', user_id: 'user-1', organization_id: 'org-1', hotel_id: 'hotel-a', role: 'MANAGER', active: true },
  { id: 'm-b', user_id: 'user-1', organization_id: 'org-1', hotel_id: 'hotel-b', role: 'VIEWER', active: true },
  { id: 'm-c', user_id: 'user-2', organization_id: 'org-2', hotel_id: 'hotel-c', role: 'MANAGER', active: true },
];

test('permite usuário somente nos hotéis associados', () => {
  assert.equal(canUseHotel('user-1', 'hotel-a', memberships), true);
  assert.equal(canUseHotel('user-1', 'hotel-c', memberships), false);
});

test('contexto exige organização, hotel, usuário e role coerentes', () => {
  const valid: TenantContext = {
    userId: 'user-1',
    organizationId: 'org-1',
    hotelId: 'hotel-a',
    role: 'MANAGER',
  };
  const wrongHotel = { ...valid, hotelId: 'hotel-c' } as TenantContext;
  const wrongRole = { ...valid, role: 'VIEWER' } as TenantContext;

  assert.equal(isTenantContextValid(valid, memberships), true);
  assert.equal(isTenantContextValid(wrongHotel, memberships), false);
  assert.equal(isTenantContextValid(wrongRole, memberships), false);
});

test('override de feature flag do hotel vence default da organização', () => {
  const flags: FeatureFlag[] = [
    { key: 'TABLET', organization_id: 'org-1', enabled: false },
    { key: 'TABLET', hotel_id: 'hotel-a', enabled: true },
  ];

  assert.equal(resolveFeatureFlag('TABLET', 'hotel-a', 'org-1', flags), true);
  assert.equal(resolveFeatureFlag('TABLET', 'hotel-b', 'org-1', flags), false);
});
