import { supabase } from '../../lib/supabase';
import { KANBAN_TENANT_ID, KanbanV2Card } from '../../services/kanbanV2';

const STORAGE_KEY = 'ITAJUBA_PMS_KANBAN_STORE_V2';
const EVENT_BUS_NAME = 'itajuba_kanban_event';
let active = false;

const isRelatedDemand = (card: any) =>
  card?.metadata && typeof card.metadata.source_card_id === 'string' && card.metadata.source_card_id.length > 0;

const normalize = (card: any): KanbanV2Card => ({
  ...card,
  id: String(card.id),
  hotel_id: String(card.hotel_id || KANBAN_TENANT_ID),
  board_id: String(card.board_id || ''),
  column_id: String(card.column_id || ''),
  ordem: Number(card.ordem ?? 0),
  checklist: Array.isArray(card.checklist) ? card.checklist : [],
  comments: Array.isArray(card.comments) ? card.comments : [],
  tags: Array.isArray(card.tags) ? card.tags : [],
  metadata: card.metadata && typeof card.metadata === 'object' ? card.metadata : {},
});

const mirrorIntoWorkspaceCache = (card: KanbanV2Card | null, deletedId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : { boards: [], columns: [], cards: [] };
    const cards = Array.isArray(store.cards) ? store.cards : [];
    store.cards = deletedId
      ? cards.filter((item: any) => String(item.id) !== deletedId)
      : card
        ? [...cards.filter((item: any) => String(item.id) !== card.id), card]
        : cards;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVENT_BUS_NAME, { detail: store }));
  } catch {}
};

export const subscribeRelatedDemands = (handlers: {
  onUpsert: (card: KanbanV2Card) => void;
  onDelete: (cardId: string) => void;
}) => {
  const channel = supabase
    .channel(`related-demands-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'kanban_cards',
      filter: `hotel_id=eq.${KANBAN_TENANT_ID}`,
    }, payload => {
      if (payload.eventType === 'DELETE') {
        const oldCard = payload.old as any;
        if (oldCard?.id) {
          handlers.onDelete(String(oldCard.id));
          mirrorIntoWorkspaceCache(null, String(oldCard.id));
        }
        return;
      }

      const card = normalize(payload.new as any);
      if (isRelatedDemand(card) && !card.is_archived) {
        handlers.onUpsert(card);
        mirrorIntoWorkspaceCache(card);
      } else {
        handlers.onDelete(card.id);
      }
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
};

export const ensureRelatedDemandRealtimeBridge = () => {
  if (active || typeof window === 'undefined') return;
  active = true;
  void subscribeRelatedDemands({ onUpsert: () => undefined, onDelete: () => undefined });
};
