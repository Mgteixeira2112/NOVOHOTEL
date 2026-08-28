import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('FrigobarModule usa exclusivamente a API pública do Frigobar Core', () => {
  const module = read('src/components/admin/FrigobarModule.tsx');

  assert.match(module, /frigobarCore\.getRoomSnapshot/);
  assert.match(module, /frigobarCore\.listRestockSources/);
  assert.match(module, /frigobarCore\.registerConsumption/);
  assert.match(module, /frigobarCore\.restock/);
  assert.doesNotMatch(module, /localStorage/);
  assert.doesNotMatch(module, /mockFrigobarData/);
  assert.doesNotMatch(module, /addConsumoToReservation/);
  assert.doesNotMatch(module, /supabase\.from|supabase\.rpc/);
});

test('consumo e reposição permanecem operações distintas', () => {
  const module = read('src/components/admin/FrigobarModule.tsx');
  const core = read('src/frigobar-core/frigobarCore.ts');

  assert.match(module, /Consumo baixa estoque e lança no Folio na mesma transação/);
  assert.match(module, /reposta\(s\) no frigobar sem gerar cobrança/);
  assert.match(core, /registerConsumption/);
  assert.match(core, /restock/);
});

test('consulta de fontes de reposição fica encapsulada no Frigobar Core', () => {
  const repository = read('src/frigobar-core/repository.ts');
  const module = read('src/components/admin/FrigobarModule.tsx');

  assert.match(repository, /hotel_os_stock_locations/);
  assert.match(repository, /WAREHOUSE/);
  assert.match(repository, /BAR/);
  assert.doesNotMatch(module, /hotel_os_stock_locations/);
});
