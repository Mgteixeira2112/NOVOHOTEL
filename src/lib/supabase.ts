import { createClient } from '@supabase/supabase-js';

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>)
      : {};

// Mantém o cliente leve usado pelos módulos realtime, mas aponta para o mesmo
// projeto principal do Hotel OS. Variáveis VITE_SUPABASE_* continuam tendo
// precedência em ambientes que injetem configuração no build.
export const DEFAULT_SUPABASE_URL = 'https://awyxubhwtdgwnssvajnr.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_rsP8t4buqj2R7OnMCf0q6g_tuq0nWOh';

const supabaseUrl = env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
