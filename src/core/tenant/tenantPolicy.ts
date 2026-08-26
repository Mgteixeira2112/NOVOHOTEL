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

export interface MultiHotelCacheStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  deleteByHotel(hotelId: string): void;
  clear(): void;
}

export class ScopedHotelCache implements MultiHotelCacheStore {
  private store = new Map<string, { hotelId: string; data: unknown }>();

  setScoped(hotelId: string, key: string, data: unknown) {
    this.store.set(`${hotelId}:${key}`, { hotelId, data });
  }

  getScoped(hotelId: string, key: string): unknown {
    const entry = this.store.get(`${hotelId}:${key}`);
    return entry ? entry.data : undefined;
  }

  get(key: string): unknown {
    return this.store.get(key)?.data;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, { hotelId: 'global', data: value });
  }

  deleteByHotel(hotelId: string): void {
    for (const [k, v] of this.store.entries()) {
      if (v.hotelId === hotelId) {
        this.store.delete(k);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export function switchActiveHotel(
  userId: string,
  currentContext: TenantContext,
  targetHotelId: string,
  memberships: HotelMembership[],
  cache?: MultiHotelCacheStore
): { nextContext: TenantContext; success: boolean; error?: string } {
  const targetMembership = memberships.find(
    (m) => m.user_id === userId && m.hotel_id === targetHotelId && m.active
  );

  if (!targetMembership) {
    return {
      nextContext: currentContext,
      success: false,
      error: `Usuário não possui acesso ao hotel ${targetHotelId}.`,
    };
  }

  if (cache) {
    cache.deleteByHotel(currentContext.hotelId);
  }

  const nextContext: TenantContext = {
    userId,
    organizationId: targetMembership.organization_id,
    hotelId: targetHotelId,
    role: targetMembership.role,
  };

  return {
    nextContext,
    success: true,
  };
}
