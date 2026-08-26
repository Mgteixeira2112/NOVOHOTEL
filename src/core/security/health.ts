import { supabase } from '../../services/supabase';

export type HealthComponent = 'API'|'DATABASE'|'REALTIME'|'STORAGE'|'BACKUP'|'NOTIFICATIONS'|'INTEGRATIONS';
export type HealthStatus = 'HEALTHY'|'DEGRADED'|'UNHEALTHY'|'UNKNOWN';

export interface HealthResult { component: HealthComponent; status: HealthStatus; latencyMs: number; message?: string; }

export async function checkDatabase(): Promise<HealthResult> {
  const started = performance.now();
  const { error } = await supabase.from('hotel_permissions').select('id').limit(1);
  const latencyMs = Math.round(performance.now() - started);
  return { component: 'DATABASE', status: error ? 'UNHEALTHY' : 'HEALTHY', latencyMs, message: error?.message };
}

export async function checkRealtime(): Promise<HealthResult> {
  const started = performance.now();
  const channel = supabase.channel(`health-${crypto.randomUUID()}`);
  const status = await new Promise<HealthStatus>((resolve) => {
    const timeout = window.setTimeout(() => resolve('DEGRADED'), 5000);
    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') {
        window.clearTimeout(timeout);
        resolve('HEALTHY');
      }
    });
  });
  await supabase.removeChannel(channel);
  return { component: 'REALTIME', status, latencyMs: Math.round(performance.now() - started) };
}
