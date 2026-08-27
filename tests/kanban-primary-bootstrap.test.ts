import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootstrap = readFileSync('src/services/kanbanLocalBootstrapService.ts', 'utf8');
const workspace = readFileSync('src/components/admin/KanbanWorkspaceModule.tsx', 'utf8');
const engine = readFileSync('src/services/kanbanV2.ts', 'utf8');

test('bootstrap ignora cards demonstrativos e preserva cards reais por ID', () => {
  assert.ok(bootstrap.includes("card.id.startsWith('card-init-')"));
  assert.ok(bootstrap.includes(".select('id')"));
  assert.ok(bootstrap.includes("!remoteIds.has(card.id)"));
  assert.ok(bootstrap.includes("ignoreDuplicates: true"));
});

test('bootstrap marca cards promovidos sem sobrescrever existentes', () => {
  assert.ok(bootstrap.includes('primary_database_bootstrap: true'));
  assert.ok(bootstrap.includes("onConflict: 'id'"));
});

test('workspace só monta Kanban após bootstrap seguro', () => {
  const bootstrapCall = workspace.indexOf('bootstrapLegacyKanbanCards()');
  const readyGuard = workspace.indexOf("bootstrapState === 'error'");
  const kanbanRender = workspace.lastIndexOf('<KanbanModule');

  assert.ok(bootstrapCall >= 0);
  assert.ok(readyGuard > bootstrapCall);
  assert.ok(kanbanRender > readyGuard);
  assert.ok(workspace.includes('Nenhum cache local foi apagado'));
});

test('motor realtime estável não foi substituído pelo bootstrap', () => {
  assert.ok(engine.includes("event: 'INSERT'"));
  assert.ok(engine.includes("event: 'UPDATE'"));
  assert.ok(engine.includes("await supabase.from('kanban_cards').insert(newCard);"));
});
