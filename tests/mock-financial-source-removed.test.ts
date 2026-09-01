import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

test('fonte financeira simulada permanece removida do código de produção', () => {
  assert.equal(
    existsSync('src/data/mockFinancialData.ts'),
    false,
    'src/data/mockFinancialData.ts não pode voltar: o Financeiro deve usar apenas contratos oficiais',
  );
});
