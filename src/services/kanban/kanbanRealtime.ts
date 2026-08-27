import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../../types/kanban';
import { 
  mapDatabaseCardToKanbanCard, 
  mapDatabaseBoardToKanbanBoard, 
  mapDatabaseColumnToKanbanColumn 
} from './kanbanMapper';

// Deduplicador de eventos com cache LRU para evitar reprocessamento em rajadas de rede
class KanbanEventDeduplicator {
  private seenEvents = new Set<string>();
  private maxItems = 600;

  isDuplicate(eventKey: string): boolean {
    if (this.seenEvents.has(eventKey)) {
      return true;
    }
    if (this.seenEvents.size >= this.maxItems) {
      const iterator = this.seenEvents.values();
      for (let i = 0; i < 150; i++) {
        const next = iterator.next();
        if (next.done) break;
        this.seenEvents.delete(next.value);
      }
    }
    this.seenEvents.add(eventKey);
    return false;
  }

  clear() {
    this.seenEvents.clear();
  }
}

const eventDeduplicator = new KanbanEventDeduplicator();

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
 * Cria a subscrição Realtime centralizada para o módulo Kanban e Operações de um Hotel específico.
 * Garante filtragem estrita por hotel_id, parsing seguro via Mapper e isolamento de eventos.
 */
export function subscribeToKanbanRealtime(
  hotelId: string,
  handlers: KanbanRealtimeHandlers
): () => void {
  if (!hotelId) {
    console.warn('[KANBAN REALTIME] hotelId não informado. Ignorando subscrição.');
    return () => {};
  }

  const channelName = `hotel-kanban-sync:${hotelId}`;
  handlers.onStatusChange?.('CONNECTING');

  const channel: RealtimeChannel = supabase.channel(channelName);

  // 1. Ouvir alterações em kanban_cards (filtrado por hotel_id)
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'kanban_cards',
      filter: `hotel_id=eq.${hotelId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const recordId = payload.new?.id || payload.old?.id;
      const timestamp = payload.commit_timestamp || payload.new?.updated_at || Date.now();
      const eventKey = `cards:${eventType}:${recordId}:${timestamp}`;

      if (eventDeduplicator.isDuplicate(eventKey)) {
        return;
      }

      console.info(`[REALTIME EVENT RECEIVED] kanban_cards -> ${eventType}:`, recordId);

      if (eventType === 'DELETE') {
        const deletedId = payload.old?.id || recordId;
        if (deletedId && handlers.onCardDelete) {
          console.info(`[DELETE CARD RECEIVED] id: ${deletedId}`);
          handlers.onCardDelete(String(deletedId));
        }
      } else if (eventType === 'INSERT') {
        if (payload.new && handlers.onCardInsert) {
          try {
            const card = mapDatabaseCardToKanbanCard(payload.new);
            console.info(`[INSERT CARD RECEIVED] id: ${card.id} ("${card.title}")`);
            handlers.onCardInsert(card);
          } catch (err) {
            console.error('[REALTIME MAP ERROR] Erro ao mapear INSERT de card:', err);
          }
        }
      } else if (eventType === 'UPDATE') {
        if (payload.new && handlers.onCardUpdate) {
          try {
            const card = mapDatabaseCardToKanbanCard(payload.new);
            console.info(`[UPDATE CARD RECEIVED] id: ${card.id} ("${card.title}")`);
            handlers.onCardUpdate(card);
          } catch (err) {
            console.error('[REALTIME MAP ERROR] Erro ao mapear UPDATE de card:', err);
          }
        }
      }
    }
  );

  // 2. Ouvir alterações em kanban_boards (filtrado por hotel_id)
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'kanban_boards',
      filter: `hotel_id=eq.${hotelId}`,
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const recordId = payload.new?.id || payload.old?.id;
      const timestamp = payload.commit_timestamp || payload.new?.atualizado_em || Date.now();
      const eventKey = `boards:${eventType}:${recordId}:${timestamp}`;

      if (eventDeduplicator.isDuplicate(eventKey)) {
        return;
      }

      console.info(`[REALTIME EVENT RECEIVED] kanban_boards -> ${eventType}:`, recordId);

      if (eventType === 'DELETE') {
        const deletedId = payload.old?.id || recordId;
        if (deletedId && handlers.onBoardDelete) {
          handlers.onBoardDelete(String(deletedId));
        }
      } else if (eventType === 'INSERT') {
        if (payload.new && handlers.onBoardInsert) {
          try {
            const board = mapDatabaseBoardToKanbanBoard(payload.new, []);
            handlers.onBoardInsert(board);
          } catch (err) {
            console.error('[REALTIME MAP ERROR] Erro ao mapear INSERT de board:', err);
          }
        }
      } else if (eventType === 'UPDATE') {
        if (payload.new && handlers.onBoardUpdate) {
          try {
            const board = mapDatabaseBoardToKanbanBoard(payload.new, []);
            handlers.onBoardUpdate(board);
          } catch (err) {
            console.error('[REALTIME MAP ERROR] Erro ao mapear UPDATE de board:', err);
          }
        }
      }
    }
  );

  // 3. Ouvir alterações em kanban_columns
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'kanban_columns',
    },
    (payload: any) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const recordId = payload.new?.id || payload.old?.id;
      const timestamp = payload.commit_timestamp || payload.new?.atualizado_em || Date.now();
      const eventKey = `columns:${eventType}:${recordId}:${timestamp}`;

      if (eventDeduplicator.isDuplicate(eventKey)) {
        return;
      }

      console.info(`[REALTIME EVENT RECEIVED] kanban_columns -> ${eventType}:`, recordId);

      if (eventType === 'DELETE') {
        const deletedId = payload.old?.id || recordId;
        if (deletedId && handlers.onColumnDelete) {
          handlers.onColumnDelete(String(deletedId));
        }
      } else if (eventType === 'INSERT') {
        if (payload.new && handlers.onColumnInsert) {
          try {
            const column = mapDatabaseColumnToKanbanColumn(payload.new);
            handlers.onColumnInsert(column);
          } catch (err) {
            console.error('[REALTIME MAP ERROR] Erro ao mapear INSERT de coluna:', err);
          }
        }
      } else if (eventType === 'UPDATE') {
        if (payload.new && handlers.onColumnUpdate) {
          try {
            const column = mapDatabaseColumnToKanbanColumn(payload.new);
            handlers.onColumnUpdate(column);
          } catch (err) {
            console.error('[REALTIME MAP ERROR] Erro ao mapear UPDATE de coluna:', err);
          }
        }
      }
    }
  );

  // Iniciar subscrição com acompanhamento de status
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
    void supabase.removeChannel(channel);
  };
}
