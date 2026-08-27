import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bridge = readFileSync('src/components/admin/KanbanLocalAutomationBridge.tsx', 'utf8');
const layout = readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');
const engine = readFileSync('src/services/kanbanV2.ts', 'utf8');
const bootstrap = readFileSync('src/services/kanbanLocalBootstrapService.ts', 'utf8');

test('ponte global usa o mesmo event bus do motor legado', () => {
  assert.ok(bridge.includes("const EVENT_BUS_NAME = 'itajuba_kanban_event'"));
  assert.ok(engine.includes("const EVENT_BUS_NAME = 'itajuba_kanban_event'"));
  assert.ok(bridge.includes("window.addEventListener(EVENT_BUS_NAME"));
});

test('ponte fica montada em todo o painel administrativo, não apenas na aba Kanban', () => {
  assert.ok(layout.includes("import { KanbanLocalAutomationBridge }"));
  assert.ok(layout.includes('<KanbanLocalAutomationBridge />'));
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
  assert.ok(bridge.includes('auto-res-'));
  assert.ok(bridge.includes('auto-gov-room-'));
  assert.ok(bridge.includes('auto-man-room-'));
  assert.ok(bridge.includes('auto-minibar-room-'));
  assert.ok(bootstrap.includes('auto-res-'));
  assert.ok(bootstrap.includes('auto-gov-room-'));
  assert.ok(bootstrap.includes('auto-man-room-'));
  assert.ok(bootstrap.includes('auto-minibar-room-'));
});

test('alterações automáticas são promovidas por upsert e portanto geram INSERT/UPDATE realtime', () => {
  assert.ok(bridge.includes(".from('kanban_cards')"));
  assert.ok(bridge.includes(".upsert(persistentPayload(card), { onConflict: 'id' })"));
  assert.ok(engine.includes("event: 'INSERT'"));
  assert.ok(engine.includes("event: 'UPDATE'"));
});

test('snapshot impede reenvio de cards automáticos que não mudaram', () => {
  assert.ok(bridge.includes('snapshotRef.current.get(id) === nextFingerprint'));
  assert.ok(bridge.includes('snapshotRef.current.set(id, nextFingerprint)'));
});
