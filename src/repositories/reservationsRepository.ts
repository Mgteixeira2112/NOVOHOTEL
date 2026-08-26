import { fetchReservationsFromSupabase, upsertReservationToSupabase, deleteReservationFromSupabase } from '../services/supabase';
import type { Reserva } from '../types';

export const reservationsRepository = {
  async list(): Promise<Reserva[]> {
    return (await fetchReservationsFromSupabase()) ?? [];
  },

  async save(reservation: Reserva): Promise<boolean> {
    return upsertReservationToSupabase(reservation);
  },

  async remove(id: string): Promise<boolean> {
    return deleteReservationFromSupabase(id);
  },
};
