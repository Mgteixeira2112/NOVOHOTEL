import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonicalKanbanAutomationId } from '../src/domain/kanbanAutomation';

const bootstrap = readFileSync('src/services/kanbanLocalBootstrapService.ts', 'utf8');
const workspace = readFileSync('src/components/admin/KanbanWorkspaceModule.tsx', 'utf8');
const engine = readFileSync('src/services/kanbanV2.ts', 'utf8');

test('bootstrap ignora cards demonstrativos e preserva cards reais por ID canônico', () => {
  assert.ok(bootstrap.includes("card.id.startsWith('card-init-')"));
  assert.ok(bootstrap.includes(".select('id')"));
  assert.ok(bootstrap.includes('!remoteIds.has(canonicalKanbanAutomationId(card))'));
  assert.ok(bootstrap.includes("ignoreDuplicates: true"));

  assert.equal(
    canonicalKanbanAutomationId({ id: 'rec_card_legacy', reservation_id: 'reservation-1' }),
    'auto-res-reservation-1',
  );
});

test('bootstrap marca cards promovidos sem sobrescrever existentes', () => {
  assert.ok(bootstrap.includes('primary_database_bootstrap: true'));
  assert.ok(bootstrap.includes("onConflict: 'id'"));
  assert.ok(bootstrap.includes('canonicalKanbanAutomationId(card)'));
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
  assert.match(engine, /event\s*:\s*['"]INSERT['"]/);
  assert.match(engine, /event\s*:\s*['"]UPDATE['"]/);
  assert.match(engine, /await\s+supabase\.from\(['"]kanban_cards['"]\)\.insert\(newCard\)/);
});
