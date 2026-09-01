import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const catalog = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const registry = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const summary = readFileSync('src/workspace-engine/widgets/FinancialSummaryWidget.tsx', 'utf8');
const transactions = readFileSync('src/workspace-engine/widgets/FinancialTransactionsWidget.tsx', 'utf8');

test('catálogo registra widgets financeiros especializados e certificados', () => {
  assert.match(types, /'financial-summary'/);
  assert.match(types, /'financial-transactions'/);
  assert.match(catalog, /type: 'financial-summary'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'financial-transactions'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'stay-finance'[\s\S]*requiredRbacResource: 'frontdesk'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('financial-summary', FinancialSummaryWidget\)/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('financial-transactions', FinancialTransactionsWidget\)/);
});

test('runtime aplica RBAC oficial por recurso antes de renderizar widget sensível', () => {
  assert.match(runtime, /canAccessResource/);
  assert.match(runtime, /requiredRbacResource/);
  assert.match(runtime, /canAccessResource\(rbacMatrix, role, requiredResource\)/);
  assert.doesNotMatch(runtime, /\['admin','gerente','financeiro'\]/);
});

test('widgets financeiros leem somente projeções oficiais certificadas', () => {
  assert.match(summary, /useOperationalRevenueUi/);
  assert.match(summary, /hotel_os_transactions/);
  assert.doesNotMatch(summary, /localStorage|mockFinancialData|useHotel\(\)/);
  assert.match(transactions, /useOperationalTransactionsUi/);
  assert.match(transactions, /hotel_os_transactions/);
  assert.doesNotMatch(transactions, /localStorage|mockFinancialData|useHotel\(\)/);
});
