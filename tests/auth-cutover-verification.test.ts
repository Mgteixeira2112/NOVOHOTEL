import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bridge = readFileSync('src/components/auth/SupabaseAuthSessionBridge.tsx', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const edge = readFileSync('supabase/functions/auth-migrate-user/index.ts', 'utf8');
const rollout = readFileSync('supabase/migrations/20260829024000_auth_rollout_gate.sql', 'utf8');
const verification = readFileSync('supabase/migrations/20260829025000_auth_frontend_verification_gate.sql', 'utf8');

test('credenciais de transição ficam apenas em memória', () => {
  assert.match(bridge, /useRef<\{ email: string; password: string \} \| null>/);
  assert.doesNotMatch(bridge, /localStorage|sessionStorage/);
});

test('sessão Supabase só é tentada após autenticação local concluída', () => {
  assert.match(bridge, /!wasAuthenticated && isAuthenticated && credentialsRef\.current/);
  assert.match(bridge, /establishSupabaseStaffSession/);
  assert.match(bridge, /AUTH_BRIDGE_FALLBACK/);
});

test('logout local encerra também a sessão Supabase', () => {
  assert.match(bridge, /wasAuthenticated && !isAuthenticated/);
  assert.match(bridge, /clearSupabaseStaffSession/);
});

test('navegador novo começa deslogado', () => {
  assert.match(app, /LEGACY_AUTH_STORAGE_KEY/);
  assert.match(app, /setItem\(LEGACY_AUTH_STORAGE_KEY, 'false'\)/);
});

test('RLS exige cobertura, verificação de frontend e cutover explícito', () => {
  assert.match(rollout, /frontend_cutover_enabled boolean not null default false/);
  assert.match(verification, /auth_frontend_verified_at/);
  assert.match(verification, /frontendVerifiedUsers/);
  assert.match(verification, /frontendVerificationComplete/);
  assert.match(verification, /readyForRls/);
});

test('Edge Function marca usuário como verificado apenas após sign-in Supabase válido', () => {
  const signInIndex = edge.indexOf('signInWithPassword');
  const verifiedIndex = edge.indexOf('auth_frontend_verified_at');
  assert.ok(signInIndex >= 0 && verifiedIndex > signInIndex);
});
