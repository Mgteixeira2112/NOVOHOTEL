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
  const value = record?.updated_at ?? payload?.commit_timestamp;
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
  // Equal versions are ignored. This prevents duplicate/stale deliveries from
  // replacing a card with an older payload that happens to share the same timestamp.
  if (previous !== undefined && version > 0 && version <= previous) return false;
  if (version > 0) versions.set(cardId, version);
  return true;
}

function mapRealtimeCard(record: any, hotelId: string): KanbanCard | null {
  if (!record || String(record.hotel_id) !== String(hotelId)) return null;
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
  handlers.onStatusChange?.('CONNECTING');
  const channel: RealtimeChannel = supabase.channel(channelName);
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
    const card = mapRealtimeCard(payload.new, hotelId);
    if (!card) return;
    console.info(`[REALTIME EVENT RECEIVED] kanban_cards -> ${eventType}:`, card.id, card.column_id, card.updated_at);
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

  // Recovery-only reconciliation. It never writes and never uses the removed
  // legacy is_archived field. PostgreSQL remains the source of truth.
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

  return () => {
    disposed = true;
    window.clearInterval(reconcileTimer);
    latestCardVersionByHotel.delete(hotelId);
    void supabase.removeChannel(channel);
  };
}
