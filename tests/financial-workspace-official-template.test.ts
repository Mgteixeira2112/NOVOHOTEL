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

test('Workspace Financeiro possui estratégia própria para Desktop, Mobile e KDS', () => {
  assert.match(financeBlock, /devices:\s*\{\s*mobile: 'custom',\s*kds: 'disabled'\s*\}/);
  assert.match(financeBlock, /financeiro-overview[\s\S]*width: 'full'[\s\S]*visual: 'highlight'/);
  assert.match(financeBlock, /financeiro-receivables[\s\S]*width: 'medium'[\s\S]*mobile:\s*\{\s*display: 'summary',\s*width: 'full'/);
  assert.match(financeBlock, /financeiro-payables[\s\S]*width: 'medium'[\s\S]*mobile:\s*\{\s*display: 'summary',\s*width: 'full'/);
  assert.match(financeBlock, /financeiro-transactions[\s\S]*mobile:\s*\{\s*display: 'button',\s*width: 'full'/);
  assert.match(factory, /presentation: template\.presentation \? \{/);
  assert.match(factory, /devices: template\.presentation\.devices \? \{ \.\.\.template\.presentation\.devices \} : undefined/);
});