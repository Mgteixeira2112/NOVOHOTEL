import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/components/admin/financial/useAdministrativeFinanceUi.ts', 'utf8');

test('hook financeiro administrativo usa somente identidade e serviços oficiais', () => {
  assert.match(source, /hotelIdentityService\.getActiveHotelId/);
  assert.match(source, /loadAdministrativeFinanceUiSnapshot/);
  assert.match(source, /settleFinancialAccount/);
  assert.match(source, /RECEIVABLE/);
  assert.match(source, /PAYABLE/);
  assert.doesNotMatch(source, /mockFinancialData|INITIAL_EXPENSES|INITIAL_RECEIVABLES|localStorage/i);
});

test('hook recarrega a fonte oficial após liquidação', () => {
  const reloadCalls = source.match(/await reload\(\)/g) ?? [];
  assert.ok(reloadCalls.length >= 2);
});
