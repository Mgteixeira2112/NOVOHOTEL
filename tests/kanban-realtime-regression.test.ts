import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/services/kanbanV2.ts', 'utf8');

test('Kanban mantém criação resiliente com id estável no cliente', () => {
  assert.match(source, /id:\s*`card_\$\{Date\.now\(\)\}_/);
  assert.ok(source.includes("await supabase.from('kanban_cards').insert(newCard);"));
  assert.ok(source.includes(".update({ updated_at: new Date().toISOString() })"));
  assert.ok(source.includes(".eq('id', newCard.id)"));
});

test('Kanban mantém movimentação de status persistida no Supabase', () => {
  assert.ok(source.includes(".update({ column_id: columnId, updated_at: updatedAt })"));
  assert.ok(source.includes(".eq('id', cardId).select('*').single()"));
});

test('Kanban continua ouvindo INSERT, UPDATE e DELETE em tempo real', () => {
  assert.ok(source.includes("event: 'INSERT'"));
  assert.ok(source.includes("event: 'UPDATE'"));
  assert.ok(source.includes("event: 'DELETE'"));
  assert.ok(source.includes('const upsertIntoView ='));
  assert.ok(source.includes('handlers.onInsert(card);'));
  assert.ok(source.includes('handlers.onUpdate(card);'));
});
