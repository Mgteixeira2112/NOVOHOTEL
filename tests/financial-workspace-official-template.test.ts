import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const factory = readFileSync('src/workspace-engine/workspaceOfficialFactory.ts', 'utf8');
const registry = readFileSync('src/workspace-engine/registry.ts', 'utf8');

const financeBlock = factory.match(/id: 'workspace-financeiro'[\s\S]*?(?=\n  \{\n    id: 'workspace-administrativo')/)?.[0] || '';

test('Factory mantém Workspace Financeiro como template oficial de gestão', () => {
  assert.match(factory, /\| 'workspace-financeiro'/);
  assert.match(financeBlock, /name: 'Financeiro'/);
  assert.match(financeBlock, /layout: 'management'/);
  assert.match(financeBlock, /defaultScope: 'mine'/);
  assert.match(registry, /createOfficialWorkspaceDefinitions\(\)/);
});

test('Workspace Financeiro usa somente widgets financeiros certificados para gestão', () => {
  for (const type of [
    'financial-overview',
    'financial-summary',
    'financial-receivables',
    'financial-payables',
    'financial-transactions',
  ]) {
    assert.match(financeBlock, new RegExp(`type: '${type}'`));
  }

  assert.doesNotMatch(financeBlock, /stay-finance|mockFinancialData|pix|gateway|payment-link/i);
});
