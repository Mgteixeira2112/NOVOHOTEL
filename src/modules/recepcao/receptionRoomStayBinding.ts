import { KanbanV2Card } from '../../services/kanbanV2';
import { Reserva } from '../../types';

function cardMetadata(card: KanbanV2Card) {
  return card.metadata && typeof card.metadata === 'object'
    ? card.metadata as Record<string, unknown>
    : {};
}

export function canonicalReceptionReservationId(card: KanbanV2Card) {
  if (typeof card.reservation_id === 'string' && card.reservation_id.trim()) {
    return card.reservation_id;
  }

  const metadataReservationId = cardMetadata(card).reservation_id;
  return typeof metadataReservationId === 'string' && metadataReservationId.trim()
    ? metadataReservationId
    : null;
}

export function resolveCanonicalReceptionReservation(card: KanbanV2Card, reservations: Reserva[]) {
  const reservationId = canonicalReceptionReservationId(card);
  if (!reservationId) return null;
  return reservations.find(reservation => reservation.id === reservationId) || null;
}
