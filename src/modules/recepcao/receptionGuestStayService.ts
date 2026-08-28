import { supabase } from '../../lib/supabase';

export type CreateGuestReservationInput = {
  guestId: string;
  roomId: string;
  checkin: string;
  checkout: string;
  guests: number;
  actorUserId?: string;
};

export type CreateReceptionGuestInput = {
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  dataNascimento?: string;
  cidade?: string;
  estado?: string;
};

export const receptionGuestStayService = {
  async createGuest(input: CreateReceptionGuestInput) {
    const id = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      id,
      nome: input.nome.trim(),
      documento: input.documento.trim(),
      email: input.email.trim(),
      telefone: input.telefone.trim(),
      data_nascimento: input.dataNascimento || null,
      cidade: input.cidade?.trim() || null,
      estado: input.estado?.trim() || null,
      nacionalidade: 'Brasileiro',
      vip: false,
      total_estadias: 0,
    };
    const { data, error } = await supabase.from('hospedes').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  },

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
