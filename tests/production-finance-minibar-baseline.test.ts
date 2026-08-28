import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync('supabase/migrations/20260829021000_production_finance_minibar_baseline.sql', 'utf8');

test('baseline projeta Reserva ativa em Stay e Folio sem substituir o lifecycle da Recepção', () => {
  assert.match(migration, /hotel_os_sync_financial_projection_from_reservation/);
  assert.match(migration, /new\.status='checkin_realizado'/);
  assert.match(migration, /new\.status='checkout_concluido'/);
  assert.match(migration, /trg_reservas_financial_projection/);
  assert.doesNotMatch(migration, /create or replace function public\.reception_room_(checkin|checkout|transfer|direct_checkin)/);
});

test('baseline é compatível com hotel_config atual e não exige tabela hoteis', () => {
  assert.match(migration, /hotel_id text not null default 'default_hotel'/);
  assert.doesNotMatch(migration, /references public\.hoteis/);
  assert.match(migration, /references public\.reservas\(id\)/);
  assert.match(migration, /references public\.quartos\(id\)/);
});

test('baseline entrega contratos usados por Financial Engine e Frigobar Core', () => {
  for (const contract of [
    'hotel_os_financial_add_charge',
    'hotel_os_financial_folio_snapshot',
    'hotel_os_financial_folio_snapshot_by_stay',
    'hotel_os_financial_receive_payment',
    'hotel_os_void_folio_item',
    'hotel_os_financial_can_checkout',
    'hotel_os_financial_close_folio',
    'hotel_os_minibar_room_snapshot',
    'hotel_os_minibar_consume',
    'hotel_os_minibar_restock',
  ]) assert.match(migration, new RegExp(contract));
});

test('consumo do frigobar permanece atômico com estoque e Folio na mesma RPC', () => {
  assert.match(migration, /hotel_os_apply_stock_movement/);
  assert.match(migration, /hotel_os_financial_add_charge/);
  assert.match(migration, /'FRIGOBAR'/);
  assert.match(migration, /idempotency_key text not null/);
});
