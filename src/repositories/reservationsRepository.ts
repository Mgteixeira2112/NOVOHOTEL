import { fetchReservationsFromSupabase, upsertReservationToSupabase, deleteReservationFromSupabase } from '../services/supabase';
import type { Reserva } from '../types';

export const reservationsRepository = {
  list(): Promise<Reserva[]> {
    return fetchReservationsFromSupabase();
  },

  save(reservation: Reserva): Promise<Reserva> {
    return upsertReservationToSupabase(reservation);
  },

  remove(id: string): Promise<void> {
    return deleteReservationFromSupabase(id);
  },
};
