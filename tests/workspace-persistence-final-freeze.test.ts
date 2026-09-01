import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const store = readFileSync('src/workspace-engine/workspaceConfigStore.ts', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');
const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260901170000_finalize_workspace_persistence.sql', 'utf8');

test('salvar relê o JSON persistido e exige igualdade semântica', () => {
  assert.match(store, /workspaceDefinitionsEqual/);
  assert.match(store, /select\('definition'\)/);
  assert.match(store, /WORKSPACE_PERSISTENCE_DIVERGENCE/);
  assert.match(store, /current\[definition\.id\] = confirmedDefinition/);
  assert.match(store, /setPendingSync\(hotelId, definition\.id, false\)/);
});

test('composição completa continua no mesmo documento persistido', () => {
  for (const contract of ['widgets', 'presentation', 'surface', 'sidebar', 'desktop', 'mobile', 'kds', 'width', 'height', 'order']) {
    assert.match(types + editor, new RegExp(contract));
  }
  assert.match(store, /definition: normalized/);
});

test('exclusão somente altera cache e tela após confirmação remota', () => {
  const remoteDelete = store.indexOf(".from('workspace_engine_configs').delete()");
  const localDelete = store.indexOf('delete current[workspaceId]');
  assert.ok(remoteDelete >= 0 && localDelete > remoteDelete);
  assert.match(store, /WORKSPACE_DELETE_NOT_CONFIRMED/);
  assert.match(editor, /if \(!result\.persisted\)/);
  assert.match(editor, /Workspace não removido/);
});

test('cache local não é apresentado como estado confirmado do hotel', () => {
  assert.match(editor, /rascunho local/);
  assert.doesNotMatch(editor, /Alteração salva localmente/);
  assert.doesNotMatch(editor, /Remoção local concluída/);
});

test('RLS permite leitura à equipe e escrita somente à gestão autenticada', () => {
  assert.match(migration, /workspace_engine_configs_staff_select/);
  assert.match(migration, /hotel_os_is_authenticated_staff/);
  assert.match(migration, /workspace_engine_configs_manager_(insert|update|delete)/);
  assert.match(migration, /hotel_os_is_manager/);
  assert.match(migration, /revoke all on table public\.workspace_engine_configs from anon/);
});
