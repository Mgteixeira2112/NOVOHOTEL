import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const hotelContext = readFileSync('src/context/HotelContext.tsx', 'utf8');
const supabaseService = readFileSync('src/services/supabase.ts', 'utf8');
const mockData = readFileSync('src/data/mockInitialData.ts', 'utf8');

test('HotelContext não mantém estado global payments órfão', () => {
  assert.doesNotMatch(hotelContext, /payments: Pagamento\[\]/);
  assert.doesNotMatch(hotelContext, /const \[payments, setPayments\]/);
  assert.doesNotMatch(hotelContext, /saveToStorage\('payments'/);
  assert.doesNotMatch(hotelContext, /INITIAL_PAYMENTS/);
  assert.doesNotMatch(hotelContext, /onPaymentChange/);
  assert.doesNotMatch(hotelContext, /setPayments/);
});

test('serviço Supabase não expõe leitura ou escrita da tabela pagamentos', () => {
  assert.doesNotMatch(supabaseService, /fetchPaymentsFromSupabase/);
  assert.doesNotMatch(supabaseService, /upsertPaymentToSupabase/);
  assert.doesNotMatch(supabaseService, /from\('pagamentos'\)/);
});

test('dados iniciais não criam pagamentos financeiros fictícios', () => {
  assert.doesNotMatch(mockData, /INITIAL_PAYMENTS/);
});
