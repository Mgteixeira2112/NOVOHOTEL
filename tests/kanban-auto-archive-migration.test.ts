import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20260828002000_kanban_auto_archive_completed.sql', 'utf8');

test('migration mantém tolerância de cinco minutos, auditoria e agendamento', () => {
  assert.equal(sql.includes("interval '5 minutes'"), true);
  assert.equal(sql.includes("coalesce(c.is_archived, false) = false"), true);
  assert.equal(sql.includes("'auto_archive'"), true);
  assert.equal(sql.includes("'* * * * *'"), true);
  assert.equal(sql.includes('archive_completed_kanban_cards'), true);
});
