import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const adminLayout = readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

test('AdminLayout resolve Financeiro pelo Workspace oficial e não pelo módulo legado', () => {
  assert.match(adminLayout, /getWorkspaceDefinition\('workspace-financeiro'/);
  assert.match(adminLayout, /<WidgetDrivenWorkspace definition=\{financialWorkspace\}/);
  assert.doesNotMatch(adminLayout, /import \{ FinancialModule \}/);
  assert.doesNotMatch(adminLayout, /<FinancialModule \/>/);
});
