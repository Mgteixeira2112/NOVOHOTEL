import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const binding = readFileSync('src/modules/recepcao/receptionRoomStayBinding.ts', 'utf8');

test('vínculo de reserva da Recepção usa reservation_id persistido no card canônico', () => {
  assert.match(binding, /card\.reservation_id/);
  assert.match(binding, /metadataReservationId/);
  assert.match(binding, /reservation\.id === reservationId/);
});

test('helper não escolhe reserva por status, data ou quarto', () => {
  assert.doesNotMatch(binding, /checkin_realizado/);
  assert.doesNotMatch(binding, /confirmada/);
  assert.doesNotMatch(binding, /pendente/);
  assert.doesNotMatch(binding, /quarto_id/);
  assert.doesNotMatch(binding, /sort\(/);
});

test('ausência de binding persistido não cria fallback local', () => {
  assert.match(binding, /if \(!reservationId\) return null/);
});
