import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const moduleSource = readFileSync('src/components/admin/FinancialModule.tsx', 'utf8');
const tabSource = readFileSync('src/components/admin/financial/TransactionsAuditTab.tsx', 'utf8');

test('FinancialModule usa o hook oficial de transações operacionais', () => {
  assert.match(moduleSource, /useOperationalTransactionsUi/);
  assert.match(moduleSource, /transactions:\s*operationalTransactions/);
  assert.match(moduleSource, /transactions=\{operationalTransactions\}/);
});

test('FinancialModule não usa payments ou guests no extrato', () => {
  assert.doesNotMatch(moduleSource, /const \{ payments,/);
  assert.doesNotMatch(moduleSource, /payments=\{payments\}/);
  assert.doesNotMatch(moduleSource, /guests=\{guests\}/);
});

test('TransactionsAuditTab recebe OperationalTransaction e não modelos legados', () => {
  assert.match(tabSource, /OperationalTransaction/);
  assert.match(tabSource, /transactions:\s*OperationalTransaction\[\]/);
  assert.doesNotMatch(tabSource, /Pagamento/);
  assert.doesNotMatch(tabSource, /Reserva/);
  assert.doesNotMatch(tabSource, /Hospede/);
});

test('extrato representa payments como entrada e refunds como saída', () => {
  assert.match(tabSource, /transaction\.transactionType === 'refund'/);
  assert.match(tabSource, /tipo:\s*isRefund \? 'saida' : 'entrada'/);
  assert.match(tabSource, /transaction\.externalReference \|\| transaction\.id/);
});
