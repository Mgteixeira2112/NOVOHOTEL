import { supabase } from '../../lib/supabase';

export type ReservationRoomHistoryEvent = {
  id: number;
  reservation_id: string;
  guest_id?: string | null;
  from_room_id?: string | null;
  to_room_id?: string | null;
  event_type: 'reservation_assigned' | 'checkin' | 'room_transfer' | 'checkout';
  actor_user_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
};

function rpcError(error: any, fallback: string) {
  const message = error?.message || error?.details || error?.hint || fallback;
  return new Error(message);
}

export const receptionStayService = {
  async checkin(reservationId: string, actorUserId?: string | null) {
    const { data, error } = await supabase.rpc('reception_room_checkin', {
      p_reservation_id: reservationId,
      p_actor_user_id: actorUserId || null,
    });
    if (error) throw rpcError(error, 'Não foi possível realizar o check-in.');
    return data;
  },

  async checkout(reservationId: string, actorUserId?: string | null) {
    const { data, error } = await supabase.rpc('reception_room_checkout', {
      p_reservation_id: reservationId,
      p_actor_user_id: actorUserId || null,
    });
    if (error) throw rpcError(error, 'Não foi possível realizar o check-out.');
    return data;
  },

  async transferRoom(reservationId: string, toRoomId: string, actorUserId?: string | null) {
    const { data, error } = await supabase.rpc('reception_room_transfer', {
      p_reservation_id: reservationId,
      p_to_room_id: toRoomId,
      p_actor_user_id: actorUserId || null,
    });
    if (error) throw rpcError(error, 'Não foi possível trocar o quarto da hospedagem.');
    return data;
  },

  async findActiveStayId(reservationId: string): Promise<string | null> {
    if (!reservationId) return null;
    const { data, error } = await supabase
      .from('hotel_os_stays')
      .select('id')
      .eq('reservation_id', reservationId)
      .eq('status', 'CHECKED_IN')
      .maybeSingle();
    if (error) throw rpcError(error, 'Não foi possível localizar a hospedagem financeira ativa.');
    return data?.id ? String(data.id) : null;
  },

  async history(reservationId: string): Promise<ReservationRoomHistoryEvent[]> {
    const { data, error } = await supabase
      .from('reservation_room_history')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: true });
    if (error) throw rpcError(error, 'Não foi possível carregar o histórico de quartos.');
    return (data || []) as ReservationRoomHistoryEvent[];
  },
};
