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

const latestCardVersionByChannel = new Map<string, Map<string, number>>();

function getRecordVersion(record: any, payload?: any): number {
  const value = record?.updated_at ?? payload?.sentAt ?? payload?.commit_timestamp;
  const parsed = value ? Date.parse(String(value)) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function acceptCardVersion(channelName: string, cardId: string, version: number): boolean {
  let versions = latestCardVersionByChannel.get(channelName);
  if (!versions) {
    versions = new Map<string, number>();
    latestCardVersionByChannel.set(channelName, versions);
  }
  const previous = versions.get(cardId);
  if (previous !== undefined && version < previous) {
    console.warn(`[REALTIME STALE EVENT IGNORED] card=${cardId} version=${version} previous=${previous}`);
    return false;
  }
  versions.set(cardId, Math.max(previous ?? 0, version));
  return true;
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

  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const recordId = String(payload.new?.id || payload.old?.id || '');
    if (!recordId) return;
    const record = payload.new || payload.old;
    const version = getRecordVersion(record, payload);
    if (eventType !== 'DELETE' && !acceptCardVersion(channelName, recordId, version)) return;
    console.info(`[REALTIME EVENT RECEIVED] kanban_cards -> ${eventType}:`, recordId);
    if (eventType === 'DELETE') {
      handlers.onCardDelete?.(recordId);
      return;
    }
    if (!payload.new) return;
    try {
      const card = mapDatabaseCardToKanbanCard(payload.new);
      if (eventType === 'INSERT') handlers.onCardInsert?.(card);
      else handlers.onCardUpdate?.(card);
    } catch (err) {
      console.error(`[REALTIME MAP ERROR] Erro ao mapear ${eventType} de card:`, err);
    }
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_update' }, (message: any) => {
    const card = message?.payload?.card as KanbanCard | undefined;
    if (!card?.id) return;
    const version = getRecordVersion(card, message?.payload);
    if (!acceptCardVersion(broadcastChannelName, card.id, version)) return;
    console.info('[REALTIME BROADCAST RECEIVED] Card UPDATE:', card.id);
    handlers.onCardUpdate?.(card);
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_insert' }, (message: any) => {
    const card = message?.payload?.card as KanbanCard | undefined;
    if (!card?.id) return;
    const version = getRecordVersion(card, message?.payload);
    if (!acceptCardVersion(broadcastChannelName, card.id, version)) return;
    console.info('[REALTIME BROADCAST RECEIVED] Card INSERT:', card.id);
    handlers.onCardInsert?.(card);
  });

  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'kanban_boards', filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const recordId = String(payload.new?.id || payload.old?.id || '');
    if (!recordId) return;
    console.info(`[REALTIME EVENT RECEIVED] kanban_boards -> ${eventType}:`, recordId);
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
    console.info(`[REALTIME EVENT RECEIVED] kanban_columns -> ${eventType}:`, recordId);
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
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.warn(`[KANBAN BROADCAST] Canal indisponível: ${status}`);
    }
  });

  return () => {
    latestCardVersionByChannel.delete(channelName);
    latestCardVersionByChannel.delete(broadcastChannelName);
    void supabase.removeChannel(channel);
    void supabase.removeChannel(broadcastChannel);
  };
}
