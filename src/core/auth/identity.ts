import { supabase } from '../../services/supabase';

export interface HotelMembership {
  id: string;
  user_id: string;
  hotel_id: string;
  role: string;
  active: boolean;
}

export interface HotelDevice {
  id: string;
  hotel_id: string;
  room_id?: string | null;
  device_type: 'POS' | 'TABLET_ROOM' | 'KDS' | 'TOTEM' | 'MOBILE';
  name: string;
  active: boolean;
  revoked_at?: string | null;
  last_seen_at?: string | null;
}

export async function getMyMemberships(): Promise<HotelMembership[]> {
  const { data, error } = await supabase.from('hotel_memberships').select('id,user_id,hotel_id,role,active').eq('user_id', (await supabase.auth.getUser()).data.user?.id || '').eq('active', true);
  if (error) throw error;
  return data || [];
}

export async function hasHotelAccess(hotelId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_has_hotel_access', { p_hotel_id: hotelId });
  if (error) throw error;
  return Boolean(data);
}

export async function hasPermission(hotelId: string, permission: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_has_permission', { p_hotel_id: hotelId, p_permission: permission });
  if (error) throw error;
  return Boolean(data);
}

export async function auditSecurityEvent(eventType: string, hotelId?: string | null, entityType?: string | null, entityId?: string | null, metadata: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc('hotel_os_audit', {
    p_event_type: eventType,
    p_hotel_id: hotelId || null,
    p_entity_type: entityType || null,
    p_entity_id: entityId || null,
    p_metadata: metadata,
  });
  if (error) throw error;
  return data as string;
}
