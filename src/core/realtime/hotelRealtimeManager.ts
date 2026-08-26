import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Cache LRU de deduplicação de eventos Realtime para evitar processamento duplicado
class EventDeduplicator {
  private seenEvents = new Set<string>();
  private maxItems = 500;

  isDuplicate(eventId: string): boolean {
    if (this.seenEvents.has(eventId)) {
      return true;
    }
    if (this.seenEvents.size >= this.maxItems) {
      // Remove os 100 itens mais antigos
      const iterator = this.seenEvents.values();
      for (let i = 0; i < 100; i++) {
        const next = iterator.next();
        if (next.done) break;
        this.seenEvents.delete(next.value);
      }
    }
    this.seenEvents.add(eventId);
    return false;
  }

  clear() {
    this.seenEvents.clear();
  }
}

export const eventDeduplicator = new EventDeduplicator();

export interface RealtimeChangeEvent<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  commit_timestamp?: string;
  new: T;
  old: Partial<T>;
}

export interface HotelRealtimeHandlers {
  onReservationChange?: (event: RealtimeChangeEvent) => void;
  onRoomChange?: (event: RealtimeChangeEvent) => void;
  onBlockChange?: (event: RealtimeChangeEvent) => void;
  onGuestChange?: (event: RealtimeChangeEvent) => void;
  onPaymentChange?: (event: RealtimeChangeEvent) => void;
}

/**
 * Centraliza a subscrição Realtime para as entidades operacionais do Hotel OS (Reservas, Quartos, Bloqueios, Hóspedes e Pagamentos).
 * Garante cleanup estrito e previne duplicações de eventos.
 */
export function subscribeToHotelRealtime(
  hotelId: string,
  handlers: HotelRealtimeHandlers
): () => void {
  const channelName = `hotel-os-live:${hotelId || 'default'}`;
  
  const handleEvent = (table: string, callback?: (event: RealtimeChangeEvent) => void) => {
    return (payload: any) => {
      if (!callback) return;
      const recordId = payload.new?.id || payload.old?.id;
      const eventKey = `${table}:${payload.eventType}:${recordId}:${payload.commit_timestamp || payload.new?.updated_at || Date.now()}`;
      
      if (eventDeduplicator.isDuplicate(eventKey)) {
        return;
      }

      callback({
        eventType: payload.eventType,
        table,
        schema: payload.schema || 'public',
        commit_timestamp: payload.commit_timestamp,
        new: payload.new,
        old: payload.old,
      });
    };
  };

  const channel: RealtimeChannel = supabase.channel(channelName);

  if (handlers.onReservationChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservas' },
      handleEvent('reservas', handlers.onReservationChange)
    );
  }

  if (handlers.onRoomChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quartos' },
      handleEvent('quartos', handlers.onRoomChange)
    );
  }

  if (handlers.onBlockChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bloqueios' },
      handleEvent('bloqueios', handlers.onBlockChange)
    );
  }

  if (handlers.onGuestChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'hospedes' },
      handleEvent('hospedes', handlers.onGuestChange)
    );
  }

  if (handlers.onPaymentChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pagamentos' },
      handleEvent('pagamentos', handlers.onPaymentChange)
    );
  }

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Subscrição Realtime centralizada para o módulo KDS (Cozinha e Bares).
 * Atualiza itens de preparo e pedidos instantaneamente quando despachados no PDV.
 */
export function subscribeToKdsRealtime(
  sector: string,
  onUpdate: () => void
): () => void {
  const channelName = `kds-live:${sector || 'ALL'}`;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const debouncedUpdate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onUpdate();
    }, 150);
  };

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pdv_kds_items' },
      (payload: any) => {
        const itemSector = payload.new?.sector || payload.old?.sector;
        if (!sector || !itemSector || itemSector === sector) {
          debouncedUpdate();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pdv_pedidos' },
      () => {
        debouncedUpdate();
      }
    )
    .subscribe();

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    void supabase.removeChannel(channel);
  };
}
