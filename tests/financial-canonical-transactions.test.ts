import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serviceSource = readFileSync('src/services/financialReportingService.ts', 'utf8');
const hookSource = readFileSync('src/components/admin/financial/useOperationalTransactionsUi.ts', 'utf8');

test('extrato operacional lê o ledger canônico existente', () => {
  assert.match(serviceSource, /loadOperationalTransactions/);
  assert.match(serviceSource, /hotel_os_transactions/);
  assert.match(serviceSource, /transaction_type/);
  assert.match(serviceSource, /external_reference/);
  assert.match(serviceSource, /created_at/);
  assert.match(serviceSource, /\.order\('created_at', \{ ascending: false \}\)/);
});

test('fonte canônica do extrato não usa fallback local ou mock', () => {
  assert.doesNotMatch(serviceSource, /INITIAL_PAYMENTS|mockInitialData|localStorage|HotelContext/);
  assert.doesNotMatch(hookSource, /INITIAL_PAYMENTS|mockInitialData|localStorage|HotelContext/);
});

test('hook do extrato resolve hotel pela identidade oficial', () => {
  assert.match(hookSource, /hotelIdentityService\.getActiveHotelId/);
  assert.match(hookSource, /loadOperationalTransactions/);
  assert.match(hookSource, /setTransactions\(\[\]\)/);
  assert.match(hookSource, /OPERATIONAL_TRANSACTIONS_LOAD_FAILED/);
});
