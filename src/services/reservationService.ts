import { reservationsRepository } from '../repositories/reservationsRepository';
import type { Reserva } from '../types';

export const reservationService = {
  async listReservations(): Promise<Reserva[]> {
    return reservationsRepository.list();
  },

  async saveReservation(reservation: Reserva): Promise<boolean> {
    return reservationsRepository.save(reservation);
  },

  async deleteReservation(id: string): Promise<boolean> {
    return reservationsRepository.remove(id);
  },
};
