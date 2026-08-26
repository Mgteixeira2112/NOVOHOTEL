import { supabase } from '../lib/supabase';
import type { FeatureFlag, HotelMembership, HotelTenant, Organization } from '../core/tenant/tenantTypes';

export const tenantRepository = {
  async getCurrentUserId(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user?.id ?? null;
  },

  async listMemberships(userId: string): Promise<HotelMembership[]> {
    const { data, error } = await supabase
      .from('hotel_memberships')
      .select('id,user_id,organization_id,hotel_id,role,active')
      .eq('user_id', userId)
      .eq('active', true);

    if (error) throw error;
    return (data ?? []) as HotelMembership[];
  },

  async listOrganizations(userId: string): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organization_memberships')
      .select('organization_id,organizations!inner(id,name,legal_name,document,email,phone,status)')
      .eq('user_id', userId)
      .eq('active', true);

    if (error) throw error;

    return (data ?? [])
      .map((row: any) => row.organizations)
      .filter(Boolean) as Organization[];
  },

  async listHotels(hotelIds: string[]): Promise<HotelTenant[]> {
    if (hotelIds.length === 0) return [];

    const { data, error } = await supabase
      .from('hoteis')
      .select('id,organization_id,nome,name,legal_name,document,email,phone,timezone,currency,locale,status,branding,settings')
      .in('id', hotelIds);

    if (error) throw error;

    return (data ?? []).map((hotel: any) => ({
      ...hotel,
      name: hotel.name ?? hotel.nome,
      timezone: hotel.timezone ?? 'America/Sao_Paulo',
      currency: hotel.currency ?? 'BRL',
      locale: hotel.locale ?? 'pt-BR',
      status: hotel.status ?? 'ACTIVE',
      branding: hotel.branding ?? {},
      settings: hotel.settings ?? {},
    })) as HotelTenant[];
  },

  async checkHotelAccess(hotelId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_has_hotel_access', { p_hotel_id: hotelId });
    if (error) throw error;
    return data === true;
  },

  async checkPermission(hotelId: string, permission: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('user_has_permission', {
      p_hotel_id: hotelId,
      p_permission: permission,
    });
    if (error) throw error;
    return data === true;
  },

  async isFeatureEnabled(hotelId: string, key: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('hotel_os_feature_enabled', {
      p_hotel_id: hotelId,
      p_key: key,
    });
    if (error) throw error;
    return data === true;
  },

  async getFeatureFlags(hotelId: string, organizationId: string): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key,enabled,organization_id,hotel_id,plan_code')
      .or(`hotel_id.eq.${hotelId},organization_id.eq.${organizationId}`);

    if (error) throw error;
    return (data ?? []) as FeatureFlag[];
  },
};
