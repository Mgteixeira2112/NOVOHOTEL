import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const menu = readFileSync('src/components/navigation/WorkspaceUserMenu.tsx', 'utf8');
const workspace = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');

test('todos os Workspaces usam o menu de usuário compartilhado ao lado de Sair', () => {
  assert.match(workspace, /import \{ WorkspaceUserMenu \}/);
  assert.match(workspace, /<WorkspaceUserMenu \/>/);
  assert.match(workspace, /<LogOut[\s\S]*Sair/);
});

test('troca de usuário é autorizada pela identidade Supabase Auth e não pelo usuário simulado', () => {
  assert.match(menu, /supabase\.auth\.getUser\(\)/);
  assert.match(menu, /authenticatedPrincipal/);
  assert.match(menu, /principalIsAdmin = authenticatedPrincipal\?\.tipo_usuario === 'admin'/);
  assert.match(menu, /if \(!principalIsAdmin\) return/);
});

test('modo de teste altera somente o contexto operacional e preserva a sessão JWT', () => {
  assert.match(menu, /setCurrentUser\(nextUser\)/);
  assert.doesNotMatch(menu, /supabase\.auth\.signInWithPassword/);
  assert.doesNotMatch(menu, /supabase\.auth\.setSession/);
  assert.match(menu, /A troca não altera o usuário do Supabase Auth/);
});

test('somente usuários ativos aparecem no seletor administrativo', () => {
  assert.match(menu, /users\.filter\(user => user\.ativo\)/);
  assert.match(menu, /Trocar usuário para testes/);
});
