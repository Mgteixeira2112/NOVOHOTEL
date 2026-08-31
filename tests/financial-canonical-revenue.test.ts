import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serviceSource = readFileSync('src/services/financialReportingService.ts', 'utf8');
const hookSource = readFileSync('src/components/admin/financial/useOperationalRevenueUi.ts', 'utf8');

test('receita operacional lê o ledger canônico do Financial Engine', () => {
  assert.match(serviceSource, /hotel_os_transactions/);
  assert.match(serviceSource, /transaction_type/);
  assert.match(serviceSource, /payment/);
  assert.match(serviceSource, /refund/);
  assert.match(serviceSource, /status === 'approved'/);
  assert.match(serviceSource, /\['approved', 'refunded'\]/);
});

test('receita operacional não usa HotelContext, mock ou persistência local', () => {
  assert.doesNotMatch(serviceSource, /HotelContext|INITIAL_PAYMENTS|mockInitialData|localStorage|sessionStorage/);
  assert.doesNotMatch(hookSource, /HotelContext|INITIAL_PAYMENTS|mockInitialData|localStorage|sessionStorage/);
});

test('hook resolve hotel canônico e não fabrica valores quando a leitura falha', () => {
  assert.match(hookSource, /hotelIdentityService\.getActiveHotelId/);
  assert.match(hookSource, /loadOperationalRevenueSummary/);
  assert.match(hookSource, /setSummary\(EMPTY_SUMMARY\)/);
  assert.match(hookSource, /setError/);
});
