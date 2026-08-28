import { supabase } from '../../lib/supabase';

export type CreateGuestReservationInput = {
  guestId: string;
  roomId: string;
  checkin: string;
  checkout: string;
  guests: number;
  actorUserId?: string;
};

export type CreateReservationWithRoomInput = CreateGuestReservationInput & {
  bedScheme: string;
};

export type AvailableRoom = {
  room_id: string;
  numero: string;
  nome: string | null;
  capacidade: number;
  cama: string | null;
  valor_diaria: number;
  tipo_quarto_id: string | null;
};

export type FindAvailableRoomsInput = {
  checkin: string;
  checkout: string;
  guests: number;
  bedScheme?: string;
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

  async findAvailableRooms(input: FindAvailableRoomsInput) {
    const { data, error } = await supabase.rpc('reception_find_available_rooms', {
      p_checkin: input.checkin,
      p_checkout: input.checkout,
      p_guests: input.guests,
      p_bed_scheme: input.bedScheme?.trim() || null,
    });
    if (error) throw error;
    return (data || []) as AvailableRoom[];
  },

  async createReservationWithRoom(input: CreateReservationWithRoomInput) {
    const { data, error } = await supabase.rpc('reception_create_reservation_with_room', {
      p_guest_id: input.guestId,
      p_room_id: input.roomId,
      p_checkin: input.checkin,
      p_checkout: input.checkout,
      p_guests: input.guests,
      p_bed_scheme: input.bedScheme,
      p_actor_user_id: input.actorUserId || null,
    });
    if (error) throw error;
    return data as {
      ok: boolean;
      reservation_id: string;
      reservation_code: string;
      guest_id: string;
      room_id: string;
      bed_scheme: string;
      checkin: string;
      checkout: string;
      guests: number;
      total: number;
    };
  },
};
