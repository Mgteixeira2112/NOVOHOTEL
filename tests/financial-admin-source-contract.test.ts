import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('financeiro administrativo lê somente as fontes oficiais previstas', () => {
  const repository = read('src/repositories/financeRepository.ts');
  assert.match(repository, /hotel_os_accounts_receivable/);
  assert.match(repository, /hotel_os_accounts_payable/);
  assert.match(repository, /hotel_os_financial_transactions/);
  assert.match(repository, /hotel_os_settle_financial_account/);
  assert.doesNotMatch(repository, /mockFinancialData|localStorage|sessionStorage/);
});

test('snapshot administrativo falha fechado quando o schema oficial não está disponível', () => {
  const service = read('src/services/financeService.ts');
  assert.match(service, /getAdministrativeFinanceReadiness/);
  assert.match(service, /ready: false as const/);
  assert.match(service, /missingSources/);
  assert.match(service, /receivables: \[\]/);
  assert.match(service, /payables: \[\]/);
  assert.match(service, /transactions: \[\]/);
  assert.doesNotMatch(service, /mockFinancialData|localStorage|INITIAL_/);
});
