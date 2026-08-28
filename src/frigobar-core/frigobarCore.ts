import { minibarRepository } from './repository';
import type { RegisterMinibarConsumptionInput, RestockMinibarInput } from './types';

function assertPositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('MINIBAR_INVALID_QUANTITY');
  }
}

function assertIdempotencyKey(key: string) {
  if (!key.trim()) throw new Error('MINIBAR_IDEMPOTENCY_KEY_REQUIRED');
}

export const frigobarCore = {
  getRoomSnapshot(hotelId: string, roomId: string) {
    return minibarRepository.getRoomSnapshot(hotelId, roomId);
  },

  registerConsumption(input: RegisterMinibarConsumptionInput) {
    assertPositiveQuantity(input.quantity);
    assertIdempotencyKey(input.idempotencyKey);
    return minibarRepository.registerConsumption(input);
  },

  restock(input: RestockMinibarInput) {
    assertPositiveQuantity(input.quantity);
    assertIdempotencyKey(input.idempotencyKey);
    if (input.fromLocationId === input.roomId) throw new Error('MINIBAR_INVALID_RESTOCK_SOURCE');
    return minibarRepository.restock(input);
  },
};
