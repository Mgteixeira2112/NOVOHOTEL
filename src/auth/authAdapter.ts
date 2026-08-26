import { supabase } from '../lib/supabase';

export type AuthUser = {
  id: string;
  email?: string;
};

export type AuthSession = {
  access_token: string;
  user: AuthUser;
};

/**
 * Single boundary for authentication during the Hotel OS migration.
 * Legacy password authentication must not be added here; new callers should
 * use Supabase Auth through this adapter.
 */
export const authAdapter = {
  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'Não foi possível autenticar.');
    }

    return {
      access_token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email ?? undefined },
    };
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session || !data.session.user) return null;

    return {
      access_token: data.session.access_token,
      user: { id: data.session.user.id, email: data.session.user.email ?? undefined },
    };
  },

  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(
        session && session.user
          ? { access_token: session.access_token, user: { id: session.user.id, email: session.user.email ?? undefined } }
          : null,
      );
    });
  },
};
