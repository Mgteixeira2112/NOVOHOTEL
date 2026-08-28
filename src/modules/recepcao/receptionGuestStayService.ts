import { supabase } from '../../lib/supabase';

export type CreateGuestReservationInput = {
  guestId: string;
  roomId: string;
  checkin: string;
  checkout: string;
  guests: number;
  actorUserId?: string;
};

export const receptionGuestStayService = {
  async createReservationForGuest(input: CreateGuestReservationInput) {
    const { data, error } = await supabase.rpc('reception_create_reservation_for_guest', {
      p_guest_id: input.guestId,
      p_room_id: input.roomId,
      p_checkin: input.checkin,
      p_checkout: input.checkout,
      p_guests: input.guests,
      p_actor_user_id: input.actorUserId || null,
    });
    if (error) throw error;
    return data as {
      ok: boolean;
      reservation_id: string;
      reservation_code: string;
      guest_id: string;
      room_id: string;
      checkin: string;
      checkout: string;
      guests: number;
      total: number;
    };
  },
};
