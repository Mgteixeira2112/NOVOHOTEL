import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('Financial Engine exposes one public contract for folio operations', () => {
  const engine = read('src/financial-engine/financialEngine.ts');
  const index = read('src/financial-engine/index.ts');
  assert.match(index, /financialEngine/);
  assert.match(engine, /getFolioByStay/);
  assert.match(engine, /addCharge/);
  assert.match(engine, /receivePayment/);
  assert.match(engine, /voidCharge/);
  assert.match(engine, /canCheckout/);
  assert.match(engine, /closeFolio/);
});

test('financial repository persists only through canonical Supabase RPCs', () => {
  const repository = read('src/financial-engine/repository.ts');
  assert.match(repository, /hotel_os_financial_add_charge/);
  assert.match(repository, /hotel_os_financial_receive_payment/);
  assert.match(repository, /hotel_os_financial_folio_snapshot/);
  assert.match(repository, /hotel_os_financial_can_checkout/);
  assert.doesNotMatch(repository, /localStorage/);
});

test('financial migration guarantees source and payment idempotency', () => {
  const migration = read('supabase/migrations/20260829000500_financial_engine_v1.sql');
  assert.match(migration, /source_key text/);
  assert.match(migration, /uq_hotel_os_folio_item_source_key/);
  assert.match(migration, /idempotency_key text/);
  assert.match(migration, /uq_hotel_os_transaction_idempotency/);
  assert.match(migration, /where folio_id=p_folio_id and source=p_source and source_key=p_source_key/);
});

test('checkout financial policy refuses an open balance', () => {
  const migration = read('supabase/migrations/20260829000500_financial_engine_v1.sql');
  assert.match(migration, /hotel_os_financial_can_checkout/);
  assert.match(migration, /OUTSTANDING_BALANCE/);
  assert.match(migration, /eligible',false/);
  assert.match(migration, /eligible',true,'reason','OK/);
});

test('legacy folio service delegates to Financial Engine instead of maintaining a second path', () => {
  const legacy = read('src/services/folioService.ts');
  assert.match(legacy, /financialEngine\.addCharge/);
  assert.match(legacy, /financialEngine\.receivePayment/);
  assert.match(legacy, /financialEngine\.voidCharge/);
  assert.doesNotMatch(legacy, /folioRepository/);
});
