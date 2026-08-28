import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync('supabase/migrations/20260829023000_supabase_auth_bridge.sql', 'utf8');
const edge = readFileSync('supabase/functions/auth-migrate-user/index.ts', 'utf8');
const client = readFileSync('src/services/supabaseAuthBridge.ts', 'utf8');

test('Supabase Auth bridge vincula usuarios a auth.uid com identidade única', () => {
  assert.match(migration, /auth_user_id uuid/);
  assert.match(migration, /uq_usuarios_auth_user_id/);
  assert.match(migration, /u\.auth_user_id = auth\.uid\(\)/);
});

test('Supabase Auth bridge não ativa RLS restritiva antes do corte de frontend', () => {
  assert.doesNotMatch(migration, /create policy/i);
  assert.doesNotMatch(migration, /enable row level security/i);
});

test('migração de credencial é server-side e limpa senha legada', () => {
  assert.match(edge, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(edge, /admin\.auth\.admin\.createUser/);
  assert.match(edge, /senha: null/);
  assert.match(edge, /INVALID_CREDENTIALS/);
  assert.doesNotMatch(edge, /password:\s*legacyUser\.senha/);
});

test('ponte retorna apenas material de sessão e nunca senha legada', () => {
  assert.match(edge, /access_token: signIn\.session\.access_token/);
  assert.match(edge, /refresh_token: signIn\.session\.refresh_token/);
  assert.doesNotMatch(edge, /senha: legacyUser\.senha/);
});

test('cliente instala sessão JWT no cliente Supabase compartilhado', () => {
  assert.match(client, /supabase\.functions\.invoke<SupabaseAuthBridgeSession>\('auth-migrate-user'/);
  assert.match(client, /supabase\.auth\.setSession/);
  assert.match(client, /supabase\.auth\.signOut/);
});

test('RLS futura tem guard de cobertura total dos usuários ativos', () => {
  assert.match(migration, /hotel_os_auth_migration_status/);
  assert.match(migration, /activeUsers/);
  assert.match(migration, /linkedUsers/);
  assert.match(migration, /readyForRls/);
});
