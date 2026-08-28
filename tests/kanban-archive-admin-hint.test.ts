import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanArchiveAdminHint.tsx', 'utf8');

test('archive hint explains automatic archive and administrative restoration', () => {
  expect(source).toContain('cinco minutos');
  expect(source).toContain('restaurá-los pela auditoria');
});
