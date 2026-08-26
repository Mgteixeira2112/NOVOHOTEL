import type { FeatureFlag, HotelMembership, TenantContext } from './tenantTypes';

export function isTenantContextValid(context: TenantContext, memberships: HotelMembership[]): boolean {
  const membership = memberships.find(
    (item) =>
      item.user_id === context.userId &&
      item.organization_id === context.organizationId &&
      item.hotel_id === context.hotelId &&
      item.active,
  );

  return Boolean(membership && membership.role === context.role);
}

export function canUseHotel(userId: string, hotelId: string, memberships: HotelMembership[]): boolean {
  return memberships.some((membership) => membership.user_id === userId && membership.hotel_id === hotelId && membership.active);
}

export function resolveFeatureFlag(
  key: string,
  hotelId: string,
  organizationId: string,
  flags: FeatureFlag[],
): boolean {
  const hotelOverride = flags.find((flag) => flag.key === key && flag.hotel_id === hotelId);
  if (hotelOverride) return hotelOverride.enabled;

  const organizationDefault = flags.find((flag) => flag.key === key && flag.organization_id === organizationId);
  return organizationDefault?.enabled ?? false;
}
