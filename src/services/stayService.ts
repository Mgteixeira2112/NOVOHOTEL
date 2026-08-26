import { stayRepository } from '../repositories/stayRepository';

export const stayService = {
  checkIn(input: Parameters<typeof stayRepository.checkIn>[0]) {
    return stayRepository.checkIn(input);
  },
  walkIn(input: Parameters<typeof stayRepository.walkIn>[0]) {
    return stayRepository.walkIn(input);
  },
  checkOut(stayId: string, allowBalance = false) {
    return stayRepository.checkOut(stayId, allowBalance);
  },
  changeRoom(stayId: string, newRoomId: string, reason: string) {
    return stayRepository.changeRoom(stayId, newRoomId, reason);
  },
  extend(stayId: string, expectedCheckOut: string) {
    return stayRepository.extend(stayId, expectedCheckOut);
  },
};
