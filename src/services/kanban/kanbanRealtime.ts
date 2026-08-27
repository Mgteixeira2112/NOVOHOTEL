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

/**
 * Mantém a última versão recebida por entidade dentro desta conexão.
 * Realtime pode entregar eventos repetidos/atrasados; nunca devemos aplicar
 * uma versão anterior sobre uma alteração mais nova.
 */
const latestCardVersionByChannel = new Map<string, Map<string, number>>();

function getRecordVersion(record: any, payload: any): number {
  const value = record?.updated_at ?? payload?.commit_timestamp;
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
  handlers.onStatusChange?.('CONNECTING');
  const channel: RealtimeChannel = supabase.channel(channelName);

  channel.on('postgres_changes', {
    event: '*', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}`,
  }, (payload: any) => {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const recordId = String(payload.new?.id || payload.old?.id || '');
    if (!recordId) return;
    const record = payload.new || payload.old;
    const version = getRecordVersion(record, payload);

    // DELETE não possui updated_at confiável; aplica-se normalmente.
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

  // Colunas são relacionadas a boards; não existe hotel_id garantido nesta tabela.
  // O isolamento é feito pelo board_id no consumidor. Não adicionar filtro inexistente.
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
    if (status === 'SUBSCRIBED') {
      console.info(`[REALTIME CONNECTED] Hotel: ${hotelId}`);
      handlers.onStatusChange?.('SUBSCRIBED');
    } else if (status === 'TIMED_OUT') {
      console.warn(`[REALTIME TIMED_OUT] Hotel: ${hotelId}`);
      handlers.onStatusChange?.('TIMED_OUT');
    } else if (status === 'CLOSED') {
      console.warn(`[REALTIME DISCONNECTED] Hotel: ${hotelId}`);
      handlers.onStatusChange?.('CLOSED');
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`[REALTIME ERROR] Hotel: ${hotelId}`, err);
      handlers.onStatusChange?.('CHANNEL_ERROR');
    }
  });

  return () => {
    console.info(`[KANBAN REALTIME CLEANUP] Removendo canal ${channelName}`);
    latestCardVersionByChannel.delete(channelName);
    void supabase.removeChannel(channel);
  };
}
