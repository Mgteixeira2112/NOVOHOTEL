import { createClient } from '@supabase/supabase-js';

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>)
      : {};

const supabaseUrl = env?.VITE_SUPABASE_URL || 'https://kdrptnryuqvksftwuxvv.supabase.co';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rsP8t4buqj2R7OnMCf0q6g_tuq0nWOh';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
