import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const adminLayout = readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');
const financialModule = readFileSync('src/components/admin/FinancialModule.tsx', 'utf8');

test('AdminLayout renderiza Financeiro fixo sem Workspace Engine', () => {
  assert.doesNotMatch(adminLayout, /getWorkspaceDefinition\('workspace-financeiro'/);
  assert.doesNotMatch(adminLayout, /WidgetDrivenWorkspace/);
  assert.match(adminLayout, /import \{ FinancialModule \} from '\.\/FinancialModule'/);
  assert.match(adminLayout, /activeTab === 'financial' && <FinancialModule \/>/);
});

test('FinancialModule reutiliza a camada financeira administrativa oficial', () => {
  assert.match(financialModule, /useAdministrativeFinanceUi/);
  assert.match(financialModule, /ReceivablesCrmTab/);
  assert.match(financialModule, /PayablesTab/);
  assert.doesNotMatch(financialModule, /workspace-engine/);
  assert.doesNotMatch(financialModule, /WorkspaceDefinition/);
});
