import { KanbanV2Card, KanbanV2Column } from '../../services/kanbanV2';
import { Hospede, Quarto, Reserva } from '../../types';
import { canonicalReceptionRoomCardId } from './receptionRoomProjectionSelection';
import { resolveCanonicalReceptionReservation } from './receptionRoomStayBinding';

export type CanonicalReceptionRoomRow = {
  room: Quarto;
  card: KanbanV2Card;
  reservation: Reserva | null;
  guest: Hospede | undefined;
  column: KanbanV2Column | undefined;
};

export function buildCanonicalReceptionRoomRows(
  rooms: Quarto[],
  cards: KanbanV2Card[],
  reservations: Reserva[],
  guests: Hospede[],
  columns: KanbanV2Column[],
): CanonicalReceptionRoomRow[] {
  const cardsById = new Map(cards.map(card => [card.id, card]));

  return rooms.flatMap(room => {
    const card = cardsById.get(canonicalReceptionRoomCardId(room.id));
    if (!card) return [];

    const reservation = resolveCanonicalReceptionReservation(card, reservations);
    const guest = reservation
      ? guests.find(item => item.id === reservation.hospede_id)
      : undefined;
    const column = columns.find(item => item.id === card.column_id);

    return [{ room, card, reservation, guest, column }];
  });
}
