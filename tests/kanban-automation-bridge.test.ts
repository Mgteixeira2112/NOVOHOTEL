import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bridge = readFileSync('src/components/admin/KanbanLocalAutomationBridge.tsx', 'utf8');
const layout = readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');
const engine = readFileSync('src/services/kanbanV2.ts', 'utf8');
const bootstrap = readFileSync('src/services/kanbanLocalBootstrapService.ts', 'utf8');

test('ponte global usa o mesmo event bus do motor legado', () => {
  assert.match(bridge, /EVENT_BUS_NAME\s*=\s*['"]itajuba_kanban_event['"]/);
  assert.match(engine, /EVENT_BUS_NAME\s*=\s*['"]itajuba_kanban_event['"]/);
  assert.match(bridge, /addEventListener\(EVENT_BUS_NAME/);
});

test('ponte fica montada em todo o painel administrativo, não apenas na aba Kanban', () => {
  assert.match(layout, /import\s*\{\s*KanbanLocalAutomationBridge\s*\}/);
  assert.match(layout, /<KanbanLocalAutomationBridge\s*\/>/);
});

test('ponte persiste somente automações e ignora cards demonstrativos', () => {
  assert.ok(bridge.includes("card.id.startsWith('card-init-')"));
  assert.ok(bridge.includes("card.id.startsWith('gov_card_')"));
  assert.ok(bridge.includes("card.id.startsWith('man_card_')"));
  assert.ok(bridge.includes("card.id.startsWith('rec_card_')"));
  assert.ok(bridge.includes("card.id.startsWith('mb_card_')"));
  assert.ok(bridge.includes('card.reservation_id'));
});

test('automações recebem IDs determinísticos por reserva ou quarto', () => {
  for (const prefix of ['auto-res-', 'auto-gov-room-', 'auto-man-room-', 'auto-minibar-room-']) {
    assert.ok(bridge.includes(prefix), `ponte deve conter prefixo ${prefix}`);
    assert.ok(bootstrap.includes(prefix), `bootstrap deve conter prefixo ${prefix}`);
  }
});

test('alterações automáticas são promovidas por upsert e portanto geram INSERT/UPDATE realtime', () => {
  assert.match(bridge, /from\(['"]kanban_cards['"]\)/);
  assert.match(bridge, /upsert\(persistentPayload\(card\),\s*\{\s*onConflict:\s*['"]id['"]\s*\}\)/);
  assert.match(engine, /event\s*:\s*['"]INSERT['"]/);
  assert.match(engine, /event\s*:\s*['"]UPDATE['"]/);
});

test('snapshot impede reenvio de cards automáticos que não mudaram', () => {
  assert.match(bridge, /snapshotRef\.current\.get\(id\)\s*===\s*nextFingerprint/);
  assert.match(bridge, /snapshotRef\.current\.set\(id,\s*nextFingerprint\)/);
});
