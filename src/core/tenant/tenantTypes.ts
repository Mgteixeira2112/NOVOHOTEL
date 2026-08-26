import type { UserRole } from '../../types';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'DEACTIVATED';

export type HotelStatus = OrganizationStatus;

export type TenantRole =
  | 'PLATFORM_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'HOTEL_ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'VIEWER'
  | UserRole;

export interface Organization {
  id: string;
  name: string;
  legal_name?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  status: OrganizationStatus;
}

export interface HotelTenant {
  id: string;
  organization_id: string;
  name: string;
  legal_name?: string | null;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  timezone: string;
  currency: string;
  locale: string;
  status: HotelStatus;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface HotelMembership {
  id: string;
  user_id: string;
  organization_id: string;
  hotel_id: string;
  role: TenantRole;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TenantContext {
  userId: string;
  organizationId: string;
  hotelId: string;
  role: TenantRole;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  organization_id?: string | null;
  hotel_id?: string | null;
  plan_code?: string | null;
}
