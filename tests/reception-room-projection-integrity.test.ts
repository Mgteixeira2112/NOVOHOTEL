import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  'supabase/migrations/20260901014500_reception_room_projection_integrity.sql',
  'utf8',
);

test('saneamento preserva o card canônico e arquiva projeções concorrentes', () => {
  assert.match(migration, /room-rec-/);
  assert.match(migration, /legacy\.id <> 'room-rec-' \|\| legacy\.room_id/);
  assert.match(migration, /is_archived = true/);
  assert.match(migration, /superseded_by_card_id/);
});

test('novas projeções ativas da Recepção exigem identidade determinística', () => {
  assert.match(migration, /enforce_reception_room_projection_identity/);
  assert.match(migration, /new\.id <> 'room-rec-' \|\| new\.room_id/);
  assert.match(migration, /Reception room projection must use canonical id/);
});

test('banco impede mais de uma projeção ativa por quarto no board da Recepção', () => {
  assert.match(migration, /create unique index if not exists uq_kanban_cards_active_reception_room/);
  assert.match(migration, /board_id = 'kanban-board-recepcao-quartos'/);
  assert.match(migration, /coalesce\(is_archived, false\) = false/);
  assert.match(migration, /deleted_at is null/);
});
