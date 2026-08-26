import { tenantRepository } from '../repositories/tenantRepository';
import type { HotelMembership, HotelTenant, Organization, TenantContext } from '../core/tenant/tenantTypes';

export interface TenantSnapshot {
  userId: string;
  organizations: Organization[];
  memberships: HotelMembership[];
  hotels: HotelTenant[];
}

export class TenantService {
  async getSnapshot(): Promise<TenantSnapshot | null> {
    const userId = await tenantRepository.getCurrentUserId();
    if (!userId) return null;

    const [memberships, organizations] = await Promise.all([
      tenantRepository.listMemberships(userId),
      tenantRepository.listOrganizations(userId),
    ]);

    const hotelIds = [...new Set(memberships.map((membership) => membership.hotel_id))];
    const hotels = await tenantRepository.listHotels(hotelIds);

    return { userId, organizations, memberships, hotels };
  }

  async validateContext(context: TenantContext): Promise<boolean> {
    const [access, permission] = await Promise.all([
      tenantRepository.checkHotelAccess(context.hotelId),
      tenantRepository.checkPermission(context.hotelId, 'TENANT_VIEW'),
    ]);

    return access && permission;
  }

  async canSwitchToHotel(hotelId: string): Promise<boolean> {
    return tenantRepository.checkHotelAccess(hotelId);
  }

  async can(permission: string, hotelId: string): Promise<boolean> {
    return tenantRepository.checkPermission(hotelId, permission);
  }

  async featureEnabled(hotelId: string, key: string): Promise<boolean> {
    return tenantRepository.isFeatureEnabled(hotelId, key);
  }
}

export const tenantService = new TenantService();
