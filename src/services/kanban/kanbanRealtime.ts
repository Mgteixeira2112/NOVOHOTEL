import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../../types/kanban';
import { mapDatabaseCardToKanbanCard, mapDatabaseBoardToKanbanBoard, mapDatabaseColumnToKanbanColumn } from './kanbanMapper';

export type KanbanRealtimeStatus = 'CONNECTING' | 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

export interface KanbanRealtimeHandlers {
  onCardInsert?: (card: KanbanCard) => void;
  onCardUpdate?: (card: KanbanCard) => void;
  onCardDelete?: (cardId: string) => void;
  onBoardInsert?: (board: KanbanBoard) => void;
  onBoardUpdate?: (board: KanbanBoard) => void;
  onBoardDelete?: (boardId: string) => void;
  onColumnInsert?: (column: KanbanColumn) => void;
  onColumnUpdate?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onStatusChange?: (status: KanbanRealtimeStatus) => void;
}

const latestCardVersionByHotel = new Map<string, Map<string, number>>();

function getRecordVersion(record: any, payload?: any): number {
  const value = record?.updated_at ?? payload?.sentAt ?? payload?.commit_timestamp;
  const parsed = value ? Date.parse(String(value)) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function acceptCardVersion(hotelId: string, cardId: string, version: number): boolean {
  let versions = latestCardVersionByHotel.get(hotelId);
  if (!versions) {
    versions = new Map<string, number>();
    latestCardVersionByHotel.set(hotelId, versions);
  }
  const previous = versions.get(cardId);
  if (previous !== undefined && version > 0 && version < previous) {
    console.warn(`[REALTIME STALE EVENT IGNORED] hotel=${hotelId} card=${cardId} version=${version} previous=${previous}`);
    return false;
  }
  if (version > 0) versions.set(cardId, Math.max(previous ?? 0, version));
  return true;
}

/**
 * Reconcile every card notification against PostgreSQL before changing React state.
 * Realtime is used as the trigger, while PostgreSQL remains the source of truth.
 * This prevents a delayed Broadcast/postgres payload or the initial hydration race
 * from restoring an older column_id after a successful move.
 */
async function fetchAuthoritativeCard(hotelId: string, cardId: string): Promise<KanbanCard | null> {
  const { data, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('id', cardId)
    .maybeSingle();

  if (error) {
    console.error(`[REALTIME RECONCILE ERROR] Card ${cardId}:`, error);
    return null;
  }
  if (!data) return null;

  const card = mapDatabaseCardToKanbanCard(data);
  const version = getRecordVersion(data);
  if (!acceptCardVersion(hotelId, cardId, version)) return null;
  return card;
}

export function subscribeToKanbanRealtime(hotelId: string, handlers: KanbanRealtimeHandlers): () => void {
  if (!hotelId) {
    console.warn('[KANBAN REALTIME] hotelId não informado. Ignorando subscrição.');
    return () => {};
  }

  const channelName = `hotel-kanban-sync:${hotelId}`;
  const broadcastChannelName = `hotel-kanban-broadcast:${hotelId}`;
  handlers.onStatusChange?.('CONNECTING');
  const channel: RealtimeChannel = supabase.channel(channelName);
  const broadcastChannel: RealtimeChannel = supabase.channel(broadcastChannelName);

  const handleCardDatabaseEvent = async (payload: any) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const recordId = String(payload.new?.id || payload.old?.id || '');
    if (!recordId) return;

    if (eventType === 'DELETE') {
      handlers.onCardDelete?.(recordId);
      return;
    }

    // Do not trust payload.new as the final state. Fetch the current row after
    // PostgreSQL has committed it, so delayed events cannot roll the UI back.
    const authoritativeCard = await fetchAuthoritativeCard(hotelId, recordId);
    if (!authoritativeCard) return;

    console.info(`[REALTIME EVENT RECEIVED] kanban_cards -> ${eventType}:`, recordId);
    if (eventType === 'INSERT') handlers.onCardInsert?.(authoritativeCard);
    else handlers.onCardUpdate?.(authoritativeCard);
  };

  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    void handleCardDatabaseEvent(payload);
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_update' }, (message: any) => {
    const card = message?.payload?.card as KanbanCard | undefined;
    if (!card?.id) return;
    void fetchAuthoritativeCard(hotelId, card.id).then((authoritativeCard) => {
      if (!authoritativeCard) return;
      console.info('[REALTIME BROADCAST RECONCILED] Card UPDATE:', card.id);
      handlers.onCardUpdate?.(authoritativeCard);
    });
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_insert' }, (message: any) => {
    const card = message?.payload?.card as KanbanCard | undefined;
    if (!card?.id) return;
    void fetchAuthoritativeCard(hotelId, card.id).then((authoritativeCard) => {
      if (!authoritativeCard) return;
      console.info('[REALTIME BROADCAST RECONCILED] Card INSERT:', card.id);
      handlers.onCardInsert?.(authoritativeCard);
    });
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_delete' }, (message: any) => {
    const cardId = String(message?.payload?.cardId || '');
    if (!cardId) return;
    console.info('[REALTIME BROADCAST RECEIVED] Card DELETE:', cardId);
    handlers.onCardDelete?.(cardId);
  });

  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'kanban_boards', filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const recordId = String(payload.new?.id || payload.old?.id || '');
    if (!recordId) return;
    if (eventType === 'DELETE') handlers.onBoardDelete?.(recordId);
    else if (payload.new) {
      try {
        const board = mapDatabaseBoardToKanbanBoard(payload.new, []);
        if (eventType === 'INSERT') handlers.onBoardInsert?.(board);
        else handlers.onBoardUpdate?.(board);
      } catch (err) {
        console.error(`[REALTIME MAP ERROR] Erro ao mapear ${eventType} de board:`, err);
      }
    }
  });

  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'kanban_columns',
  }, (payload: any) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const recordId = String(payload.new?.id || payload.old?.id || '');
    if (!recordId) return;
    if (eventType === 'DELETE') handlers.onColumnDelete?.(recordId);
    else if (payload.new) {
      try {
        const column = mapDatabaseColumnToKanbanColumn(payload.new);
        if (eventType === 'INSERT') handlers.onColumnInsert?.(column);
        else handlers.onColumnUpdate?.(column);
      } catch (err) {
        console.error(`[REALTIME MAP ERROR] Erro ao mapear ${eventType} de coluna:`, err);
      }
    }
  });

  channel.subscribe((status, err) => {
    console.info(`[KANBAN REALTIME STATUS] ${status} for channel ${channelName}`, err || '');
    if (status === 'SUBSCRIBED') handlers.onStatusChange?.('SUBSCRIBED');
    else if (status === 'TIMED_OUT') handlers.onStatusChange?.('TIMED_OUT');
    else if (status === 'CLOSED') handlers.onStatusChange?.('CLOSED');
    else if (status === 'CHANNEL_ERROR') handlers.onStatusChange?.('CHANNEL_ERROR');
  });

  broadcastChannel.subscribe((status, err) => {
    console.info(`[KANBAN BROADCAST STATUS] ${status} for channel ${broadcastChannelName}`, err || '');
  });

  return () => {
    latestCardVersionByHotel.delete(hotelId);
    void supabase.removeChannel(channel);
    void supabase.removeChannel(broadcastChannel);
  };
}