import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20260828002000_kanban_auto_archive_completed.sql', 'utf8');

test('automatic archive migration keeps the five minute grace period and audit trail', () => {
  expect(sql).toContain("interval '5 minutes'");
  expect(sql).toContain("coalesce(c.is_archived, false) = false");
  expect(sql).toContain("'auto_archive'");
  expect(sql).toContain("'* * * * *'");
  expect(sql).toContain('archive_completed_kanban_cards');
});
