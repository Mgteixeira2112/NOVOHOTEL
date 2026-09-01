import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const factory = readFileSync('src/workspace-engine/workspaceOfficialFactory.ts', 'utf8');
const financeBlock = factory.match(/id: 'workspace-financeiro'[\s\S]*?(?=\n  \{\n    id: 'workspace-administrativo')/)?.[0] || '';

const retiredFiles = [
  'src/components/admin/FinancialModule.tsx',
  'src/components/admin/financial/PixConfigTab.tsx',
  'src/components/admin/financial/CreditCardGatewaysTab.tsx',
  'src/components/admin/financial/PaymentLinkModal.tsx',
  'src/components/admin/financial/NewExpenseModal.tsx',
  'src/components/admin/financial/NewReceivableModal.tsx',
];

test('interfaces financeiras simuladas e módulo legado permanecem removidos', () => {
  for (const file of retiredFiles) assert.equal(existsSync(file), false, `arquivo legado retornou: ${file}`);
});

test('PIX, gateways e links continuam fora do Workspace sem contrato oficial', () => {
  assert.doesNotMatch(financeBlock, /pix|gateway|payment-link/i);
});
