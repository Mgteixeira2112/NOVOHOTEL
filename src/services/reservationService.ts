import { reservationsRepository } from '../repositories/reservationsRepository';
import { availabilityService } from './availabilityService';
import type { Reserva } from '../types';
import type { BookingMode } from '../domain/hotelOsCore';

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

  searchAvailability(input: Parameters<typeof availabilityService.search>[0]) {
    return availabilityService.search(input);
  },

  calculatePrice(input: Parameters<typeof availabilityService.calculatePrice>[0]) {
    return availabilityService.calculatePrice(input);
  },

  createHold(input: Parameters<typeof availabilityService.createHold>[0] & { bookingMode?: BookingMode }) {
    return availabilityService.createHold(input);
  },

  confirmHold(reservationId: string) {
    return availabilityService.confirm(reservationId);
  },
};
