import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widget = readFileSync('src/workspace-engine/widgets/CertifiedFinancialOverviewWidget.tsx', 'utf8');
const catalog = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const registry = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');

test('visão financeira usa somente hooks financeiros oficiais certificados', () => {
  assert.match(widget, /useOperationalRevenueUi/);
  assert.match(widget, /useAdministrativeFinanceUi/);
  assert.doesNotMatch(widget, /localStorage|mockFinancialData|supabase|estimatedGatewayFees|0\.029|0\.015/);
});

test('visão financeira não se apresenta como DRE completa sem contrato contábil', () => {
  assert.match(widget, /DRE completa ainda não certificada/);
  assert.match(widget, /não usa estimativas nem fallbacks financeiros/);
});

test('widget de visão financeira é protegido pelo recurso RBAC financial', () => {
  assert.match(catalog, /type: 'financial-overview'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('financial-overview', CertifiedFinancialOverviewWidget\)/);
});
