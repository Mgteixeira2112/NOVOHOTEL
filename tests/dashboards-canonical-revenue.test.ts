import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync('src/components/admin/DashboardModule.tsx', 'utf8');
const executive = readFileSync('src/components/admin/ExecutiveDashboardModule.tsx', 'utf8');

test('DashboardModule usa a receita operacional canônica', () => {
  assert.match(dashboard, /useOperationalRevenueUi/);
  assert.match(dashboard, /const totalRevenue = grossPayments/);
  assert.doesNotMatch(dashboard, /payments\s*\.filter/);
  assert.doesNotMatch(dashboard, /payments,\s*
/);
  assert.match(dashboard, /Receita operacional indisponível/);
});

test('ExecutiveDashboard não usa payments legado como fallback financeiro', () => {
  assert.doesNotMatch(executive, /payments\.filter/);
  assert.doesNotMatch(executive, /localFallback\.revenue/);
  assert.doesNotMatch(executive, /rooms, reservations, payments/);
  assert.match(executive, /value=\{m \? money\(m\.total_revenue, m\.currency\) : '—'\}/);
});
