import { supabase } from '../lib/supabase';
import type {
  MinibarConsumptionResult,
  MinibarRestockSource,
  MinibarRoomSnapshot,
  RegisterMinibarConsumptionInput,
  RestockMinibarInput,
} from './types';

export const minibarRepository = {
  async getRoomSnapshot(hotelId: string, roomId: string): Promise<MinibarRoomSnapshot> {
    const { data, error } = await supabase.rpc('hotel_os_minibar_room_snapshot', {
      p_hotel_id: hotelId,
      p_room_id: roomId,
    });
    if (error) throw error;
    return data as MinibarRoomSnapshot;
  },

  async listRestockSources(hotelId: string): Promise<MinibarRestockSource[]> {
    const { data, error } = await supabase
      .from('hotel_os_stock_locations')
      .select('id,code,name,location_type')
      .eq('hotel_id', hotelId)
      .eq('active', true)
      .in('location_type', ['WAREHOUSE', 'BAR'])
      .order('name');
    if (error) throw error;
    return (data || []).map(item => ({
      id: String(item.id),
      code: String(item.code),
      name: String(item.name),
      locationType: String(item.location_type),
    }));
  },

  async registerConsumption(input: RegisterMinibarConsumptionInput): Promise<MinibarConsumptionResult> {
    const { data, error } = await supabase.rpc('hotel_os_minibar_consume', {
      p_hotel_id: input.hotelId,
      p_room_id: input.roomId,
      p_product_id: input.productId,
      p_quantity: input.quantity,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw error;
    return data as MinibarConsumptionResult;
  },

  async restock(input: RestockMinibarInput): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_minibar_restock', {
      p_hotel_id: input.hotelId,
      p_room_id: input.roomId,
      p_product_id: input.productId,
      p_quantity: input.quantity,
      p_from_location_id: input.fromLocationId,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw error;
    return String(data);
  },
};
