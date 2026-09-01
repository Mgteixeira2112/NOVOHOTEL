import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const hotelContext = readFileSync('src/context/HotelContext.tsx', 'utf8');
const settings = readFileSync('src/components/admin/SettingsModule.tsx', 'utf8');
const supabaseService = readFileSync('src/services/supabase.ts', 'utf8');

test('sync global não carrega payments da tabela legada', () => {
  const syncBlock = hotelContext.slice(hotelContext.indexOf('const syncFromSupabase'), hotelContext.indexOf('// Exportar / Enviar'));
  assert.doesNotMatch(syncBlock, /fetchPaymentsFromSupabase/);
  assert.doesNotMatch(syncBlock, /remotePay/);
});

test('seed global não exporta tabela pagamentos', () => {
  const seedBlock = supabaseService.slice(supabaseService.indexOf('export async function seedAllDataToSupabase'));
  assert.doesNotMatch(seedBlock, /data\.payments/);
  assert.doesNotMatch(seedBlock, /exportTable\('pagamentos'/);
});

test('Settings não apresenta pagamentos legado como tabela operacional', () => {
  assert.doesNotMatch(settings, /localCount: payments\.length/);
  assert.doesNotMatch(settings, /key: 'pagamentos'/);
});
