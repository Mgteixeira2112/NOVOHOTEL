import { supabase } from '../lib/supabase';

export const roomDeviceRepository = {
  async list(hotelId: string) {
    const { data, error } = await supabase.from('dispositivos_hotel').select('id,hotel_id,quarto_id,tipo,status,device_identifier,last_seen_at').eq('hotel_id', hotelId).order('quarto_id');
    if (error) throw error;
    return data ?? [];
  },
  async startSession(deviceId: string, token: string) {
    const { data, error } = await supabase.rpc('hotel_os_start_room_device_session', { p_device_id: deviceId, p_token: token });
    if (error) throw error;
    return String(data);
  },
  async resetAfterCheckout(stayId: string) {
    const { data, error } = await supabase.rpc('hotel_os_reset_room_device_after_checkout', { p_stay_id: stayId });
    if (error) throw error;
    return Boolean(data);
  },
};
