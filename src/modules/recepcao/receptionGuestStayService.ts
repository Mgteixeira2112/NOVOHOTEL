import { supabase } from '../../lib/supabase';

export type CreateGuestReservationInput = {
  guestId: string;
  roomId: string;
  checkin: string;
  checkout: string;
  guests: number;
  actorUserId?: string;
};

export type CreateUnassignedReservationInput = Omit<CreateGuestReservationInput, 'roomId'>;

export type BindReservationRoomInput = {
  reservationId: string;
  roomId: string;
  actorUserId?: string;
};

export type CreateReceptionGuestInput = {
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  dataNascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  nacionalidade?: string;
  notasPreferencias?: string;
  vip?: boolean;
};

export type UpdateReceptionGuestInput = CreateReceptionGuestInput;

const guestPayload = (input: CreateReceptionGuestInput) => ({
  nome: input.nome.trim(),
  documento: input.documento.trim(),
  email: input.email.trim(),
  telefone: input.telefone.trim(),
  data_nascimento: input.dataNascimento || null,
  endereco: input.endereco?.trim() || null,
  cidade: input.cidade?.trim() || null,
  estado: input.estado?.trim() || null,
  cep: input.cep?.trim() || null,
  nacionalidade: input.nacionalidade?.trim() || 'Brasileiro',
  notas_preferencias: input.notasPreferencias?.trim() || null,
  vip: input.vip === true,
});

export const receptionGuestStayService = {
  async createGuest(input: CreateReceptionGuestInput) {
    const id = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      id,
      ...guestPayload(input),
      total_estadias: 0,
    };
    const { data, error } = await supabase.from('hospedes').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  },

  async updateGuest(guestId: string, input: UpdateReceptionGuestInput) {
    const { data, error } = await supabase
      .from('hospedes')
      .update(guestPayload(input))
      .eq('id', guestId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  // Compatibilidade: usado pelo check-in iniciado diretamente em um quarto disponível.
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

  async createUnassignedReservation(input: CreateUnassignedReservationInput) {
    const { data, error } = await supabase.rpc('reception_create_unassigned_reservation', {
      p_guest_id: input.guestId,
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
      room_id: null;
      checkin: string;
      checkout: string;
      guests: number;
    };
  },

  async bindReservationToRoom(input: BindReservationRoomInput) {
    const { data, error } = await supabase.rpc('reception_bind_reservation_room', {
      p_reservation_id: input.reservationId,
      p_room_id: input.roomId,
      p_actor_user_id: input.actorUserId || null,
    });
    if (error) throw error;
    return data as {
      ok: boolean;
      reservation_id: string;
      room_id: string;
      total: number;
    };
  },

  async unbindReservationFromRoom(reservationId: string, actorUserId?: string) {
    const { data, error } = await supabase.rpc('reception_unbind_reservation_room', {
      p_reservation_id: reservationId,
      p_actor_user_id: actorUserId || null,
    });
    if (error) throw error;
    return data as { ok: boolean; reservation_id: string; room_id: null };
  },
};
