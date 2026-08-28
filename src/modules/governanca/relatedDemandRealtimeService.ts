import { supabase } from '../../lib/supabase';
import { KANBAN_TENANT_ID, KanbanV2Card } from '../../services/kanbanV2';

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
        if (oldCard?.id) handlers.onDelete(String(oldCard.id));
        return;
      }

      const card = normalize(payload.new as any);
      if (isRelatedDemand(card) && !card.is_archived) handlers.onUpsert(card);
      else handlers.onDelete(card.id);
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
};
