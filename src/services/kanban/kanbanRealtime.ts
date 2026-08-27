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
  if (previous !== undefined && version > 0 && version < previous) return false;
  if (version > 0) versions.set(cardId, version);
  return true;
}

function mapRealtimeCard(record: any, hotelId: string): KanbanCard | null {
  if (!record) return null;
  if (String(record.hotel_id) !== String(hotelId)) return null;
  const cardId = String(record.id || '');
  if (!cardId) return null;
  const version = getRecordVersion(record);
  if (!acceptCardVersion(hotelId, cardId, version)) return null;
  return mapDatabaseCardToKanbanCard(record);
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
  let disposed = false;

  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'kanban_cards',
    filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    if (disposed) return;
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    if (eventType === 'DELETE') {
      const recordId = String(payload.old?.id || '');
      if (!recordId) return;
      latestCardVersionByHotel.get(hotelId)?.delete(recordId);
      handlers.onCardDelete?.(recordId);
      return;
    }

    // Use the committed Realtime payload directly. This removes the extra
    // SELECT round-trip that previously raced with RLS/cache and could make
    // clients re-read an older version immediately after a move.
    const card = mapRealtimeCard(payload.new, hotelId);
    if (!card) return;
    console.info(`[REALTIME EVENT RECEIVED] kanban_cards -> ${eventType}:`, card.id, card.column_id);
    if (eventType === 'INSERT') handlers.onCardInsert?.(card);
    else handlers.onCardUpdate?.(card);
  });

  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'kanban_boards',
    filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    if (disposed) return;
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
    event: '*',
    schema: 'public',
    table: 'kanban_columns',
  }, (payload: any) => {
    if (disposed) return;
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

  // Lightweight reconciliation remains only as a recovery mechanism. It no
  // longer queries the removed/legacy is_archived column and never writes data.
  const reconcileTimer = window.setInterval(async () => {
    if (disposed) return;
    try {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('id, updated_at')
        .eq('hotel_id', hotelId);
      if (error || !data) return;

      for (const row of data) {
        const version = getRecordVersion(row);
        const previous = latestCardVersionByHotel.get(hotelId)?.get(String(row.id));
        if (previous === undefined || version > previous) {
          const { data: current, error: currentError } = await supabase
            .from('kanban_cards')
            .select('*')
            .eq('hotel_id', hotelId)
            .eq('id', String(row.id))
            .maybeSingle();
          if (currentError || !current || disposed) continue;
          const card = mapRealtimeCard(current, hotelId);
          if (card) {
            console.info('[KANBAN RECONCILIATION] Alteração persistida detectada:', card.id, card.column_id);
            handlers.onCardUpdate?.(card);
          }
        }
      }
    } catch (error) {
      console.warn('[KANBAN RECONCILIATION] Falha temporária:', error);
    }
  }, 5000);

  channel.subscribe((status, err) => {
    console.info(`[KANBAN REALTIME STATUS] ${status} for channel ${channelName}`, err || '');
    if (status === 'SUBSCRIBED') handlers.onStatusChange?.('SUBSCRIBED');
    else if (status === 'TIMED_OUT') handlers.onStatusChange?.('TIMED_OUT');
    else if (status === 'CLOSED') handlers.onStatusChange?.('CLOSED');
    else if (status === 'CHANNEL_ERROR') handlers.onStatusChange?.('CHANNEL_ERROR');
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_update' }, (message: any) => {
    if (disposed) return;
    const card = mapRealtimeCard(message?.payload?.card, hotelId);
    if (card) handlers.onCardUpdate?.(card);
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_insert' }, (message: any) => {
    if (disposed) return;
    const card = mapRealtimeCard(message?.payload?.card, hotelId);
    if (card) handlers.onCardInsert?.(card);
  });

  broadcastChannel.on('broadcast', { event: 'kanban_card_delete' }, (message: any) => {
    if (disposed) return;
    const cardId = String(message?.payload?.cardId || '');
    if (!cardId) return;
    latestCardVersionByHotel.get(hotelId)?.delete(cardId);
    handlers.onCardDelete?.(cardId);
  });

  broadcastChannel.subscribe((status, err) => {
    console.info(`[KANBAN BROADCAST STATUS] ${status} for channel ${broadcastChannelName}`, err || '');
  });

  return () => {
    disposed = true;
    window.clearInterval(reconcileTimer);
    latestCardVersionByHotel.delete(hotelId);
    void supabase.removeChannel(channel);
    void supabase.removeChannel(broadcastChannel);
  };
}
