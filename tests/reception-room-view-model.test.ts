import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/modules/recepcao/receptionRoomViewModel.ts', 'utf8');

test('view model do Mapa monta linhas somente a partir do card canônico do quarto', () => {
  assert.match(source, /canonicalReceptionRoomCardId\(room\.id\)/);
  assert.match(source, /cardsById\.get\(canonicalReceptionRoomCardId\(room\.id\)\)/);
  assert.doesNotMatch(source, /room_number/);
});

test('view model resolve a hospedagem pelo binding persistido no card', () => {
  assert.match(source, /resolveCanonicalReceptionReservation\(card, reservations\)/);
  assert.doesNotMatch(source, /checkin_realizado/);
  assert.doesNotMatch(source, /confirmada/);
  assert.doesNotMatch(source, /pendente/);
  assert.doesNotMatch(source, /quarto_id/);
});

test('hóspede e coluna são derivados somente depois da reserva canônica ser resolvida', () => {
  assert.match(source, /guests\.find\(item => item\.id === reservation\.hospede_id\)/);
  assert.match(source, /columns\.find\(item => item\.id === card\.column_id\)/);
});
