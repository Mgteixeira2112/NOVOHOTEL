import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface RealtimeSubscriptionOptions {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  filter?: string;
}

export function subscribeToTable<TPayload>(
  client: SupabaseClient,
  options: RealtimeSubscriptionOptions,
  callback: (payload: TPayload) => void,
): RealtimeChannel {
  const channel = client.channel(`hotel-os:${options.schema ?? 'public'}:${options.table}`);
  channel.on(
    'postgres_changes',
    {
      event: options.event ?? '*',
      schema: options.schema ?? 'public',
      table: options.table,
      ...(options.filter ? { filter: options.filter } : {}),
    },
    (payload) => callback(payload as TPayload),
  );
  void channel.subscribe();
  return channel;
}

export async function unsubscribe(client: SupabaseClient, channel: RealtimeChannel): Promise<void> {
  await client.removeChannel(channel);
}
