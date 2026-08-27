import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/services/kanbanCardGovernanceService.ts', 'utf8');
const stableEngine = readFileSync('src/services/kanbanV2.ts', 'utf8');

test('governança delega criação, edição e movimento ao motor estável', () => {
  assert.ok(source.includes('await kanbanV2.createCard(input)'));
  assert.ok(source.includes('await kanbanV2.updateCard(currentCard.id, updates)'));
  assert.ok(source.includes('await kanbanV2.moveCard(KANBAN_TENANT_ID, currentCard.id, targetColumnId)'));
});

test('exclusão operacional é lógica e não chama delete físico', () => {
  assert.ok(source.includes("kanbanV2.updateCard(currentCard.id, { is_archived: true })"));
  assert.ok(source.includes("eventType: 'deleted'"));
  assert.equal(source.includes("from('kanban_cards').delete()"), false);
});

test('camada de auditoria é best-effort e preserva compatibilidade sem migration', () => {
  assert.ok(source.includes("from('kanban_card_events').insert"));
  assert.ok(source.includes("from('kanban_cards').update(payload)"));
  assert.ok(source.includes('Falhas aqui nunca bloqueiam o fluxo operacional'));
});

test('motor realtime original permanece com criação e movimentação protegidas', () => {
  assert.ok(stableEngine.includes("await supabase.from('kanban_cards').insert(newCard);"));
  assert.ok(stableEngine.includes(".update({ column_id: columnId, updated_at: updatedAt })"));
  assert.ok(stableEngine.includes("event: 'INSERT'"));
  assert.ok(stableEngine.includes("event: 'UPDATE'"));
});
