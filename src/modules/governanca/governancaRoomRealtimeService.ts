import { supabase } from '../../lib/supabase';
import { KANBAN_TENANT_ID, KanbanV2Card } from '../../services/kanbanV2';

function normalize(card: any): KanbanV2Card {
  return {
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
  } as KanbanV2Card;
}

async function fetchGovernancaRoomCard(roomId?: string | null, roomNumber?: string | null) {
  let query = supabase
    .from('kanban_cards')
    .select('*')
    .eq('hotel_id', KANBAN_TENANT_ID)
    .eq('board_id', 'kanban-board-governanca')
    .eq('is_archived', false)
    .limit(1);

  if (roomId) query = query.eq('room_id', roomId);
  else if (roomNumber) query = query.eq('room_number', roomNumber);
  else return null;

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return normalize(data);
}

export const subscribeGovernancaRoomRealtime = (handlers: {
  onUpsert: (card: KanbanV2Card) => void;
}) => {
  const channel = supabase
    .channel(`governanca-room-status-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'quartos',
    }, payload => {
      const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as any;
      const roomId = row?.id ? String(row.id) : null;
      const roomNumber = row?.numero ? String(row.numero) : null;
      if (!roomId && !roomNumber) return;

      void fetchGovernancaRoomCard(roomId, roomNumber).then(card => {
        if (card) handlers.onUpsert(card);
      });
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
};
