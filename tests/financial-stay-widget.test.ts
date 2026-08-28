import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('financeiro da hospedagem é widget oficial da Recepção', () => {
  const types = read('src/workspace-engine/types.ts');
  const catalog = read('src/workspace-engine/widgetCatalog.ts');
  const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');

  assert.match(types, /'stay-finance'/);
  assert.match(types, /'finance'/);
  assert.match(catalog, /type: 'stay-finance'/);
  assert.match(catalog, /sectors: \['recepcao'\]/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('stay-finance', StayFinanceWidget\)/);
});

test('widget financeiro usa Financial Engine sem persistência paralela', () => {
  const widget = read('src/workspace-engine/widgets/StayFinanceWidget.tsx');

  assert.match(widget, /financialEngine\.getFolioByStay/);
  assert.match(widget, /financialEngine\.addCharge/);
  assert.match(widget, /financialEngine\.receivePayment/);
  assert.match(widget, /financialEngine\.voidCharge/);
  assert.doesNotMatch(widget, /from\('hotel_os_folios'\)/);
  assert.doesNotMatch(widget, /from\('hotel_os_folio_items'\)/);
  assert.doesNotMatch(widget, /localStorage/);
});

test('resolução de stay fica no serviço de Recepção e não cria regra financeira', () => {
  const service = read('src/modules/recepcao/receptionStayService.ts');
  const widget = read('src/workspace-engine/widgets/StayFinanceWidget.tsx');

  assert.match(service, /findActiveStayId/);
  assert.match(service, /\.from\('hotel_os_stays'\)/);
  assert.match(service, /\.eq\('status', 'CHECKED_IN'\)/);
  assert.match(widget, /receptionStayService\.findActiveStayId/);
});

test('widget limita lançamentos manuais e pagamentos ao Folio aberto', () => {
  const widget = read('src/workspace-engine/widgets/StayFinanceWidget.tsx');

  assert.match(widget, /source: 'MANUAL'/);
  assert.match(widget, /folio\.status !== 'open'/);
  assert.match(widget, /folio\.balance <= 0/);
  assert.match(widget, /Motivo obrigatório para o estorno/);
});
