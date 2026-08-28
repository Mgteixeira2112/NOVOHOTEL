import { supabase } from '../lib/supabase';
import { KanbanV2Card } from './kanbanV2';

interface KanbanRealtimeHandlers {
  onInsert: (card: KanbanV2Card) => void;
  onUpdate: (card: KanbanV2Card) => void;
  onDelete: (card: KanbanV2Card) => void;
  onStatus: (status: string) => void;
}

const normalizeCard = (row: any): KanbanV2Card => ({
  ...row,
  id: String(row.id),
  hotel_id: String(row.hotel_id || 'default_hotel'),
  board_id: String(row.board_id),
  column_id: String(row.column_id),
  ordem: Number(row.ordem ?? 0),
  checklist: Array.isArray(row.checklist) ? row.checklist : [],
  comments: Array.isArray(row.comments) ? row.comments : [],
  tags: Array.isArray(row.tags) ? row.tags : [],
  metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
});

const makeInstanceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Assinatura Realtime exclusiva por consumidor.
 * Evita colisão entre múltiplos Widgets Kanban usando o mesmo cliente Supabase.
 */
export const subscribeKanbanRealtime = (
  hotelId: string,
  handlers: KanbanRealtimeHandlers,
) => {
  const instanceId = makeInstanceId();
  const channelName = `kanban-v2-${hotelId}-${instanceId}`;
  handlers.onStatus('CONNECTING');

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onInsert(normalizeCard(payload.new)))
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onUpdate(normalizeCard(payload.new)))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onDelete(normalizeCard(payload.old)))
    .subscribe(status => {
      if (status === 'SUBSCRIBED') handlers.onStatus('SUBSCRIBED');
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') handlers.onStatus('DISCONNECTED');
    });

  return () => {
    void supabase.removeChannel(channel);
  };
};
