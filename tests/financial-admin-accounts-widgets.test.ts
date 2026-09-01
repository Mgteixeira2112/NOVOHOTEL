import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widgets = readFileSync('src/workspace-engine/widgets/AdministrativeFinanceAccountWidgets.tsx', 'utf8');
const catalog = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const registry = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');

test('contas financeiras entram no Workspace por adapters sobre o contrato administrativo oficial', () => {
  assert.match(widgets, /useAdministrativeFinanceUi/);
  assert.match(widgets, /settleReceivable/);
  assert.match(widgets, /settlePayable/);
  assert.match(widgets, /ReceivablesCrmTab/);
  assert.match(widgets, /PayablesTab/);
  assert.doesNotMatch(widgets, /supabase|localStorage|sessionStorage|hotel_os_accounts_receivable|hotel_os_accounts_payable/);
});

test('criação, exclusão e link de pagamento continuam bloqueados sem contrato oficial', () => {
  assert.match(widgets, /unsupportedMutation/);
  assert.match(widgets, /unsupportedPaymentLink/);
  assert.doesNotMatch(widgets, /insert\(|delete\(|upsert\(/);
});

test('catálogo e runtime protegem contas administrativas pelo RBAC financeiro', () => {
  assert.match(catalog, /type: 'financial-receivables'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'financial-payables'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('financial-receivables', FinancialReceivablesWidget\)/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('financial-payables', FinancialPayablesWidget\)/);
});
