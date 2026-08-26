import { availabilityRepository, type AvailabilitySearch } from '../repositories/availabilityRepository';

export const availabilityService = {
  search(input: AvailabilitySearch) {
    if (input.checkout <= input.checkin) throw new Error('Check-out deve ser posterior ao check-in');
    if (input.adults < 1) throw new Error('A quantidade de adultos deve ser maior que zero');
    if (input.children < 0) throw new Error('Quantidade de crianças inválida');
    return availabilityRepository.search(input);
  },
  calculatePrice(input: Parameters<typeof availabilityRepository.calculatePrice>[0]) {
    if (input.checkout <= input.checkin) throw new Error('Check-out deve ser posterior ao check-in');
    return availabilityRepository.calculatePrice(input);
  },
  createHold(input: Parameters<typeof availabilityRepository.createHold>[0]) {
    if (input.checkout <= input.checkin) throw new Error('Check-out deve ser posterior ao check-in');
    return availabilityRepository.createHold(input);
  },
  confirm(reservationId: string) {
    return availabilityRepository.confirm(reservationId);
  },
};
