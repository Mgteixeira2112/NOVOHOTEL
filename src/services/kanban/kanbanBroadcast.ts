import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { KanbanCard } from '../../types/kanban';

const channels = new Map<string, RealtimeChannel>();

function getChannelName(hotelId: string): string {
  return `hotel-kanban-broadcast:${hotelId}`;
}

async function getReadyChannel(hotelId: string): Promise<RealtimeChannel | null> {
  if (!hotelId) return null;
  const name = getChannelName(hotelId);
  let channel = channels.get(name);
  if (!channel) {
    channel = supabase.channel(name);
    channels.set(name, channel);
    const status = await channel.subscribe();
    if (status !== 'SUBSCRIBED') {
      console.warn(`[KANBAN BROADCAST] Falha ao conectar canal ${name}: ${status}`);
      return null;
    }
  }
  return channel;
}

export async function broadcastKanbanCardChange(
  hotelId: string,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  card?: KanbanCard,
  cardId?: string
): Promise<void> {
  const channel = await getReadyChannel(hotelId);
  if (!channel) return;

  const payload = {
    eventType,
    card: card ?? null,
    cardId: cardId ?? card?.id ?? null,
    sentAt: new Date().toISOString()
  };

  const result = await channel.send({
    type: 'broadcast',
    event: `kanban_card_${eventType.toLowerCase()}`,
    payload
  });

  if (result !== 'ok') {
    console.warn(`[KANBAN BROADCAST] Evento ${eventType} não confirmado:`, result);
  }
}

export async function closeKanbanBroadcastChannel(hotelId: string): Promise<void> {
  const name = getChannelName(hotelId);
  const channel = channels.get(name);
  if (!channel) return;
  channels.delete(name);
  await supabase.removeChannel(channel);
}
