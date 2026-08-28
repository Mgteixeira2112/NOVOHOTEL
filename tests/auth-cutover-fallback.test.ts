import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const context = readFileSync('src/context/HotelContext.tsx', 'utf8');
const login = readFileSync('src/components/auth/AdminLogin.tsx', 'utf8');

test('login guarda a senha apenas em memória até concluir 2FA', () => {
  assert.match(context, /pendingLoginPassword/);
  assert.doesNotMatch(context, /saveToStorage\(['"]pendingLoginPassword/);
});

test('sessão Supabase só é estabelecida após 2FA válido', () => {
  const completeStart = context.indexOf('const complete2FALogin');
  const validation = context.indexOf('validate2FACode', completeStart);
  const bridge = context.indexOf('establishSupabaseStaffSession', completeStart);
  assert.ok(completeStart >= 0 && validation >= 0 && bridge > validation);
});

test('falha transitória da ponte não bloqueia usuário legado ainda não migrado', () => {
  assert.match(context, /AUTH_BRIDGE_FALLBACK/);
  assert.match(context, /setIsAuthenticated\(true\)/);
});

test('logout limpa também a sessão Supabase', () => {
  assert.match(context, /clearSupabaseStaffSession/);
});

test('AdminLogin aguarda conclusão assíncrona do 2FA', () => {
  assert.match(login, /await complete2FALogin/);
});
