import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync('supabase/migrations/20260829023000_supabase_auth_bridge.sql', 'utf8');
const edge = readFileSync('supabase/functions/auth-migrate-user/index.ts', 'utf8');
const client = readFileSync('src/services/supabaseAuthBridge.ts', 'utf8');

describe('Supabase Auth bridge hardening', () => {
  it('links usuarios to auth.uid through a unique identity column', () => {
    expect(migration).toContain('auth_user_id uuid');
    expect(migration).toContain('uq_usuarios_auth_user_id');
    expect(migration).toContain('u.auth_user_id = auth.uid()');
  });

  it('does not activate restrictive RLS before the frontend cutover', () => {
    expect(migration).not.toMatch(/create policy/i);
    expect(migration).not.toMatch(/enable row level security/i);
  });

  it('migrates credentials server-side and clears the legacy password', () => {
    expect(edge).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(edge).toContain('admin.auth.admin.createUser');
    expect(edge).toContain('senha: null');
    expect(edge).toContain('INVALID_CREDENTIALS');
    expect(edge).not.toMatch(/password:\s*legacyUser\.senha/);
  });

  it('returns only session material and never returns the legacy password', () => {
    expect(edge).toContain('access_token: signIn.session.access_token');
    expect(edge).toContain('refresh_token: signIn.session.refresh_token');
    expect(edge).not.toContain('senha: legacyUser.senha');
  });

  it('installs the returned JWT session in the shared Supabase client', () => {
    expect(client).toContain("supabase.functions.invoke<SupabaseAuthBridgeSession>('auth-migrate-user'");
    expect(client).toContain('supabase.auth.setSession');
    expect(client).toContain('supabase.auth.signOut');
  });
});
