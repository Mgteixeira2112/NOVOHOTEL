import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanArchiveCountdown.tsx', 'utf8');

test('completed cards expose the five minute archive grace period', () => {
  expect(source).toContain('Arquiva em até');
  expect(source).toContain('Arquivamento pendente');
});
