import { supabase } from '../services/supabase';

export interface StayRecord {
  id: string;
  hotel_id: string;
  reservation_id: string;
  room_id: string;
  primary_guest_id: string;
  status: 'EXPECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  actual_check_in_at: string | null;
  expected_check_out: string;
  actual_check_out_at: string | null;
}

export const stayRepository = {
  async checkIn(input: { reservationId: string; roomId?: string | null; primaryGuestId?: string | null }) {
    const { data, error } = await supabase.rpc('hotel_os_check_in', {
      p_reservation_id: input.reservationId,
      p_room_id: input.roomId ?? null,
      p_primary_guest_id: input.primaryGuestId ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  async walkIn(input: { hotelId: string; roomId: string; primaryGuestId: string; expectedCheckOut: string; adults?: number; children?: number }) {
    const { data, error } = await supabase.rpc('hotel_os_walk_in', {
      p_hotel_id: input.hotelId,
      p_room_id: input.roomId,
      p_primary_guest_id: input.primaryGuestId,
      p_expected_check_out: input.expectedCheckOut,
      p_adults: input.adults ?? 1,
      p_children: input.children ?? 0,
    });
    if (error) throw error;
    return data as string;
  },

  async checkOut(stayId: string, allowBalance = false) {
    const { data, error } = await supabase.rpc('hotel_os_check_out', {
      p_stay_id: stayId,
      p_allow_balance: allowBalance,
    });
    if (error) throw error;
    return data as string;
  },

  async changeRoom(stayId: string, newRoomId: string, reason: string) {
    const { data, error } = await supabase.rpc('hotel_os_change_stay_room', {
      p_stay_id: stayId,
      p_new_room_id: newRoomId,
      p_reason: reason,
    });
    if (error) throw error;
    return data as string;
  },

  async extend(stayId: string, expectedCheckOut: string) {
    const { data, error } = await supabase.rpc('hotel_os_extend_stay', {
      p_stay_id: stayId,
      p_expected_check_out: expectedCheckOut,
    });
    if (error) throw error;
    return data as string;
  },
};
