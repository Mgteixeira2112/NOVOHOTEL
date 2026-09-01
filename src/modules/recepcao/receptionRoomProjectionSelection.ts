import { KanbanV2Card } from '../../services/kanbanV2';

export function canonicalReceptionRoomCardId(roomId: string) {
  return `room-rec-${roomId}`;
}

export function isCanonicalReceptionRoomCard(card: KanbanV2Card, roomId: string) {
  return card.id === canonicalReceptionRoomCardId(roomId);
}

export function selectCanonicalReceptionRoomCards(cards: KanbanV2Card[], roomIds: string[]) {
  const allowedIds = new Set(roomIds.map(canonicalReceptionRoomCardId));
  return cards.filter(card => allowedIds.has(card.id));
}
