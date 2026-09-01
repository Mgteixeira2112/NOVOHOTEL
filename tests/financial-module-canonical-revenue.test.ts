import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/components/admin/FinancialModule.tsx', 'utf8');

test('FinancialModule usa receita operacional canônica nos KPIs', () => {
  assert.match(source, /useOperationalRevenueUi/);
  assert.match(source, /const totalRevenue = grossPayments/);
  assert.match(source, /const netRevenue = netReceived - estimatedGatewayFees/);
  assert.match(source, /total_transacoes: paymentCount/);
  assert.match(source, /receita_pix: pixRevenue/);
  assert.match(source, /receita_cartao_credito: cardCreditRevenue/);
  assert.match(source, /receita_cartao_debito: cardDebitRevenue/);
});

test('KPIs financeiros não voltam a calcular receita a partir de HotelContext.payments', () => {
  assert.doesNotMatch(source, /const approvedPayments = payments\.filter/);
  assert.doesNotMatch(source, /approvedPayments\.reduce/);
  assert.doesNotMatch(source, /approvedPayments\.length/);
});

test('extrato financeiro usa transações operacionais canônicas', () => {
  assert.match(source, /useOperationalTransactionsUi/);
  assert.match(source, /<TransactionsAuditTab[\s\S]*transactions=\{operationalTransactions\}/);
  assert.doesNotMatch(source, /<TransactionsAuditTab[\s\S]*payments=\{payments\}/);
  assert.match(source, /Receita operacional indisponível/);
  assert.match(source, /Extrato operacional indisponível/);
});
