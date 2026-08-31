import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/components/admin/financial/administrativeFinanceUiAdapter.ts', 'utf8');

test('adapter administrativo usa somente snapshot financeiro oficial', () => {
  assert.match(source, /loadAdministrativeFinanceSnapshot/);
  assert.match(source, /adaptAdministrativeReceivable/);
  assert.match(source, /adaptAdministrativePayable/);
  assert.doesNotMatch(source, /mockFinancialData|localStorage|INITIAL_EXPENSES|INITIAL_RECEIVABLES/);
});

test('adapter preserva valores reais sem fabricar saldo financeiro', () => {
  assert.match(source, /valor_total: total/);
  assert.match(source, /valor_pago: paid/);
  assert.match(source, /Math\.max\(0, total - paid\)/);
  assert.match(source, /valor: toNumber\(row\.amount\)/);
});

test('adapter traduz somente estados de apresentação conhecidos', () => {
  assert.match(source, /case 'PAID'/);
  assert.match(source, /case 'PARTIALLY_PAID'/);
  assert.match(source, /case 'OVERDUE'/);
  assert.match(source, /return 'pendente'/);
});
