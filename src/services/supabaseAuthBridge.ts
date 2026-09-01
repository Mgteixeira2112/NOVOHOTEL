import { supabase } from '../lib/supabase';
import type { Usuario } from '../types';

export interface SupabaseAuthBridgeSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user_id: string;
  migrated: boolean;
}

export async function establishSupabaseStaffSession(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) throw new Error('AUTH_CREDENTIALS_REQUIRED');

  const { data, error } = await supabase.functions.invoke<SupabaseAuthBridgeSession>('auth-migrate-user', {
    body: { email: normalizedEmail, password },
  });

  if (error || !data?.access_token || !data?.refresh_token) {
    throw new Error('AUTH_MIGRATION_FAILED');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError || !sessionData.session) throw new Error('AUTH_SESSION_FAILED');
  return { session: sessionData.session, migrated: Boolean(data.migrated) };
}

export async function authenticateSupabaseStaff(email: string, password: string): Promise<Usuario> {
  await establishSupabaseStaffSession(email, password);

  const { data, error } = await supabase.rpc('hotel_os_current_user_profile');
  const profile = Array.isArray(data) ? data[0] : data;
  if (error || !profile?.id || profile.ativo === false) {
    await clearSupabaseStaffSession().catch(() => undefined);
    throw new Error('AUTH_PROFILE_UNAVAILABLE');
  }

  return profile as Usuario;
}

export async function clearSupabaseStaffSession() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function hasSupabaseStaffSession() {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user?.id);
}
