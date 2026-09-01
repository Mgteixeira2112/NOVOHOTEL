import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const summary = readFileSync('src/workspace-engine/widgets/FinancialSummaryWidget.tsx', 'utf8');
const overview = readFileSync('src/workspace-engine/widgets/CertifiedFinancialOverviewWidget.tsx', 'utf8');
const accounts = readFileSync('src/workspace-engine/widgets/AdministrativeFinanceAccountWidgets.tsx', 'utf8');

const forbidden = [
  /mock/i,
  /create table/i,
  /alter table/i,
  /supabase\/migrations/i,
  /createClient\(/,
];

test('resumo financeiro continua usando somente a fonte operacional certificada', () => {
  assert.match(summary, /useOperationalRevenueUi/);
  assert.match(summary, /Receita operacional · hotel_os_transactions/);
});

test('visão financeira certificada combina apenas fontes oficiais auditadas', () => {
  assert.match(overview, /useOperationalRevenueUi/);
  assert.match(overview, /useAdministrativeFinanceUi/);
  assert.match(overview, /Somente fontes financeiras oficiais auditadas/);
  assert.match(overview, /DRE completa ainda não certificada/);
  assert.match(overview, /não usa estimativas nem fallbacks financeiros/);
});

test('contas a receber e pagar continuam no Financeiro Administrativo existente', () => {
  assert.match(accounts, /useAdministrativeFinanceUi/);
  assert.match(accounts, /ReceivablesCrmTab/);
  assert.match(accounts, /PayablesTab/);
  assert.match(accounts, /Operação indisponível até existir contrato oficial/);
  assert.match(accounts, /Link de pagamento indisponível até existir contrato financeiro oficial/);
});

test('certificação financeira não introduz mocks nem infraestrutura paralela', () => {
  for (const source of [summary, overview, accounts]) {
    for (const pattern of forbidden) assert.doesNotMatch(source, pattern);
  }
});
