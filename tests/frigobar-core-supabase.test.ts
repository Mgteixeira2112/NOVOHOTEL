import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('Frigobar Core usa somente Supabase e não localStorage', () => {
  const repository = read('src/frigobar-core/repository.ts');
  const facade = read('src/frigobar-core/frigobarCore.ts');
  assert.match(repository, /hotel_os_minibar_consume/);
  assert.match(repository, /hotel_os_minibar_restock/);
  assert.match(repository, /hotel_os_minibar_room_snapshot/);
  assert.doesNotMatch(repository + facade, /localStorage|mockFrigobarData|FrigobarContext/);
});

test('consumo de frigobar é atômico entre estoque e Financial Engine', () => {
  const migration = read('supabase/migrations/20260829010000_frigobar_core_supabase.sql');
  assert.match(migration, /hotel_os_apply_stock_movement/);
  assert.match(migration, /hotel_os_financial_add_charge/);
  assert.match(migration, /'FRIGOBAR'/);
  assert.match(migration, /unique\(hotel_id,idempotency_key\)/);
});

test('Frigobar reaproveita o estoque centralizado e cria localização por quarto', () => {
  const migration = read('supabase/migrations/20260829010000_frigobar_core_supabase.sql');
  assert.match(migration, /hotel_os_stock_locations/);
  assert.match(migration, /hotel_os_stock_items/);
  assert.match(migration, /location_type='MINIBAR'/);
  assert.match(migration, /room_id text references public\.quartos/);
  assert.doesNotMatch(migration, /create table if not exists public\.frigobar_products/);
});

test('preço de venda é capturado no momento do consumo', () => {
  const migration = read('supabase/migrations/20260829010000_frigobar_core_supabase.sql');
  assert.match(migration, /unit_price numeric\(12,2\)/);
  assert.match(migration, /v_product\.preco/);
  assert.match(migration, /round\(p_quantity\*v_product\.preco,2\)/);
});
