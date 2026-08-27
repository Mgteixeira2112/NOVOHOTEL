export interface KanbanAutomationCardLike {
  id: string;
  titulo?: string | null;
  departamento?: string | null;
  room_number?: string | null;
  location?: string | null;
  reservation_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function safeKanbanAutomationIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function kanbanAutomationRoomNumber(card: KanbanAutomationCardLike): string | null {
  if (typeof card.room_number === 'string' && card.room_number) return card.room_number;
  const match = typeof card.location === 'string' ? card.location.match(/(\d{2,4})/) : null;
  return match?.[1] || null;
}

export function isKanbanAutomationCard(card: KanbanAutomationCardLike): boolean {
  if (!card?.id || card.id.startsWith('card-init-')) return false;
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata : {};

  return Boolean(
    card.id.startsWith('gov_card_')
    || card.id.startsWith('man_card_')
    || card.id.startsWith('rec_card_')
    || card.id.startsWith('mb_card_')
    || card.id.startsWith('auto-gov-room-')
    || card.id.startsWith('auto-man-room-')
    || card.id.startsWith('auto-res-')
    || card.id.startsWith('auto-minibar-room-')
    || metadata.pms_synced === true
    || metadata.type === 'frigobar_restock'
    || metadata.automation_source === true
    || Boolean(metadata.automation_type)
    || Boolean(card.reservation_id)
  );
}

export function canonicalKanbanAutomationId(card: KanbanAutomationCardLike): string {
  if (typeof card.reservation_id === 'string' && card.reservation_id) {
    return `auto-res-${safeKanbanAutomationIdPart(card.reservation_id)}`;
  }

  const room = kanbanAutomationRoomNumber(card);
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata : {};
  const title = String(card.titulo || '').toLowerCase();

  const isMinibar = metadata.type === 'frigobar_restock'
    || metadata.automation_type === 'frigobar_restock'
    || card.id.startsWith('mb_card_')
    || title.includes('frigobar');
  if (room && isMinibar) return `auto-minibar-room-${safeKanbanAutomationIdPart(room)}`;

  if (room && (card.departamento === 'manutencao' || card.id.startsWith('man_card_'))) {
    return `auto-man-room-${safeKanbanAutomationIdPart(room)}`;
  }

  const isGovernance = card.id.startsWith('gov_card_')
    || metadata.pms_synced === true
    || metadata.automation_type === 'room_cleaning';
  if (room && card.departamento === 'governanca' && isGovernance) {
    return `auto-gov-room-${safeKanbanAutomationIdPart(room)}`;
  }

  return card.id;
}
