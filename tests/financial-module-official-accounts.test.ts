import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const moduleSource = readFileSync('src/components/admin/FinancialModule.tsx', 'utf8');
const adapterSource = readFileSync('src/components/admin/financial/administrativeFinanceUiAdapter.ts', 'utf8');

test('FinancialModule lê contas administrativas pelo hook oficial', () => {
  assert.match(moduleSource, /useAdministrativeFinanceUi/);
  assert.match(moduleSource, /payables: expenses/);
  assert.match(moduleSource, /settleReceivable/);
  assert.match(moduleSource, /settlePayable/);
});

test('FinancialModule não usa mais mock ou localStorage para contas a pagar e receber', () => {
  assert.doesNotMatch(moduleSource, /INITIAL_EXPENSES/);
  assert.doesNotMatch(moduleSource, /INITIAL_RECEIVABLES/);
  assert.doesNotMatch(moduleSource, /ITAJUBA_PMS_EXPENSES_V1/);
  assert.doesNotMatch(moduleSource, /ITAJUBA_PMS_RECEIVABLES_V1/);
  assert.doesNotMatch(moduleSource, /setExpenses/);
  assert.doesNotMatch(moduleSource, /setReceivables/);
});

test('ações sem contrato oficial não recriam persistência local', () => {
  assert.match(moduleSource, /handleUnsupportedAccountMutation/);
  assert.doesNotMatch(moduleSource, /desp-' \+ Date\.now/);
  assert.doesNotMatch(moduleSource, /rec-' \+ Date\.now/);
  assert.doesNotMatch(moduleSource, /rec-wh-' \+ Date\.now/);
});

test('adapter de contas a pagar expõe o saldo restante para liquidação', () => {
  assert.match(adapterSource, /paid_amount/);
  assert.match(adapterSource, /Math\.max\(0, total - paid\)/);
});
