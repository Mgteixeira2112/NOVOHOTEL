import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const context = readFileSync('src/context/HotelContext.tsx', 'utf8');
const types = readFileSync('src/types/index.ts', 'utf8');
const supabase = readFileSync('src/services/supabase.ts', 'utf8');
const realtime = readFileSync('src/core/realtime/hotelRealtimeManager.ts', 'utf8');
const mock = readFileSync('src/data/mockInitialData.ts', 'utf8');

test('createReservation não fabrica objeto Pagamento de compatibilidade', () => {
  assert.doesNotMatch(context, /paymentIntent/);
  assert.doesNotMatch(context, /pagamento: Pagamento/);
  assert.match(context, /return \{ reserva: reservation, hospede: guest \}/);
});

test('contrato de Reserva não mantém pagamento_id legado', () => {
  assert.doesNotMatch(types, /pagamento_id/);
  assert.doesNotMatch(mock, /pagamento_id/);
  assert.doesNotMatch(supabase, /pagamento_id/);
});

test('aplicação não exige nem assina realtime da tabela pagamentos', () => {
  assert.doesNotMatch(realtime, /onPaymentChange/);
  assert.doesNotMatch(realtime, /table: 'pagamentos'/);
  assert.doesNotMatch(supabase, /'pagamentos',/);
});

test('tipo Pagamento legado foi removido', () => {
  assert.doesNotMatch(types, /export interface Pagamento/);
});
