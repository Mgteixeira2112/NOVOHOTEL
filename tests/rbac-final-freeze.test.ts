import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const context = readFileSync('src/context/HotelContext.tsx', 'utf8');
const login = readFileSync('src/components/auth/AdminLogin.tsx', 'utf8');
const auth = readFileSync('src/services/supabaseAuthBridge.ts', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const permissions = readFileSync('src/core/permissions/permissionService.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260901163000_finalize_rbac_auth_boundary.sql', 'utf8');

test('localStorage não decide autenticação nem identidade operacional', () => {
  assert.match(context, /useState<boolean>\(false\)/);
  assert.doesNotMatch(context, /loadFromStorage\('is_authenticated'/);
  assert.doesNotMatch(context, /loadFromStorage<Usuario \| null>\('current_user'/);
  assert.doesNotMatch(context, /saveToStorage\('is_authenticated'/);
  assert.doesNotMatch(context, /saveToStorage\('current_user'/);
  assert.doesNotMatch(app, /LEGACY_AUTH_STORAGE_KEY/);
});

test('login exige sessão Supabase e perfil resolvido por auth.uid', () => {
  assert.match(login, /await loginValidatePassword\(email, senha\)/);
  assert.match(context, /await authenticateSupabaseStaff\(email, senha\)/);
  assert.match(auth, /hotel_os_current_user_profile/);
  assert.match(migration, /u\.auth_user_id = auth\.uid\(\)/);
  assert.doesNotMatch(context, /const expectedPassword = user\.senha \|\| 'admin'/);
});

test('não existe login local alternativo capaz de autenticar sem JWT', () => {
  assert.doesNotMatch(context, /const login = \(email:/);
  assert.doesNotMatch(context, /\n\s*login,\n/);
  assert.match(context, /clearSupabaseStaffSession/);
});

test('RLS de usuários separa leitura própria e gestão administrativa', () => {
  assert.match(migration, /drop policy if exists "Acesso Total Anon usuarios"/);
  assert.match(migration, /usuarios_self_or_manager_select/);
  assert.match(migration, /usuarios_manager_delete/);
  assert.match(migration, /revoke all on table public\.usuarios from anon/);
});

test('matriz oficial preserva perfis operacionais, financeiro e KDS', () => {
  for (const role of ['admin', 'gerente', 'recepcionista', 'governanca', 'financeiro', 'pdv_only', 'cozinha_only', 'tablet_quarto']) {
    assert.match(permissions, new RegExp(`${role}:`));
  }
  assert.match(permissions, /kds: \['admin', 'gerente', 'cozinha_only', 'pdv_only'\]/);
});
