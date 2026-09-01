import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/components/admin/FinancialModule.tsx', 'utf8');

test('FinancialModule não persiste PIX, gateways ou links em localStorage', () => {
  assert.doesNotMatch(source, /ITAJUBA_PMS_PIX_KEYS_V1/);
  assert.doesNotMatch(source, /ITAJUBA_PMS_PIX_PSP_V1/);
  assert.doesNotMatch(source, /ITAJUBA_PMS_GATEWAYS_V1/);
  assert.doesNotMatch(source, /ITAJUBA_PMS_PAY_LINKS_V1/);
  assert.doesNotMatch(source, /INITIAL_PIX_KEYS|INITIAL_PIX_PSP|INITIAL_GATEWAY_CONFIGS|INITIAL_PAYMENT_LINKS/);
});

test('configurações sem fonte oficial não renderizam interfaces mutáveis', () => {
  assert.doesNotMatch(source, /<PixConfigTab/);
  assert.doesNotMatch(source, /<CreditCardGatewaysTab/);
  assert.doesNotMatch(source, /<PaymentLinkModal/);
  assert.match(source, /Configuração PIX indisponível/);
  assert.match(source, /Gateways de pagamento indisponíveis/);
});

test('atalhos de link de pagamento permanecem bloqueados até contrato oficial', () => {
  assert.match(source, /handleUnsupportedPaymentConfiguration/);
  assert.match(source, /onOpenNewPaymentLink=\{handleUnsupportedPaymentConfiguration\}/);
  assert.match(source, /onOpenPaymentLink=\{handleUnsupportedPaymentConfiguration\}/);
  assert.match(source, /contrato financeiro oficial de leitura e escrita/);
});
