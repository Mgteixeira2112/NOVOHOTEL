import { reservationsRepository } from '../repositories/reservationsRepository';
import type { Reserva } from '../types';

export const reservationService = {
  async listReservations(): Promise<Reserva[]> {
    return reservationsRepository.list();
  },

  async saveReservation(reservation: Reserva): Promise<Reserva> {
    return reservationsRepository.save(reservation);
  },

  async deleteReservation(id: string): Promise<void> {
    return reservationsRepository.remove(id);
  },
};
