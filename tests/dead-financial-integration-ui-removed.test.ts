import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const financialModule = readFileSync('src/components/admin/FinancialModule.tsx', 'utf8');

const retiredFiles = [
  'src/components/admin/financial/PixConfigTab.tsx',
  'src/components/admin/financial/CreditCardGatewaysTab.tsx',
  'src/components/admin/financial/PaymentLinkModal.tsx',
  'src/components/admin/financial/NewExpenseModal.tsx',
  'src/components/admin/financial/NewReceivableModal.tsx',
];

test('interfaces financeiras simuladas sem consumidor permanecem removidas', () => {
  for (const file of retiredFiles) assert.equal(existsSync(file), false, `arquivo legado retornou: ${file}`);
});

test('PIX e gateways continuam explicitamente indisponíveis sem contrato oficial', () => {
  assert.match(financialModule, /Integração financeira ainda não certificada/);
  assert.match(financialModule, /Nenhuma configuração será salva localmente/);
  assert.match(financialModule, /PIX, gateways e links de pagamento estão indisponíveis/);
  assert.doesNotMatch(financialModule, /PixConfigTab|CreditCardGatewaysTab|PaymentLinkModal|NewExpenseModal|NewReceivableModal/);
});
