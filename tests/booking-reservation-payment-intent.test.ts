import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contextSource = readFileSync('src/context/HotelContext.tsx', 'utf8');
const bookingSource = readFileSync('src/components/booking/BookingModal.tsx', 'utf8');
const createReservationSource = contextSource.split('const createReservation =', 2)[1].split('const updateReservationStatus =', 1)[0];

test('criação de reserva registra somente intenção de pagamento pendente', () => {
  assert.match(createReservationSource, /const paymentIntent: Pagamento/);
  assert.match(createReservationSource, /status: 'pendente'/);
  assert.match(createReservationSource, /forma_pagamento: params\.pagamento\.metodo/);
  assert.doesNotMatch(createReservationSource, /status: 'aprovado'/);
  assert.doesNotMatch(createReservationSource, /codigo_transacao:/);
  assert.doesNotMatch(createReservationSource, /pagamento_id:/);
});

test('criação de reserva não persiste pagamento no caminho legado', () => {
  assert.doesNotMatch(createReservationSource, /setPayments\(/);
  assert.doesNotMatch(createReservationSource, /upsertPaymentToSupabase/);
  assert.doesNotMatch(contextSource, /upsertPaymentToSupabase,/);
});

test('booking não afirma processamento bancário inexistente', () => {
  assert.doesNotMatch(bookingSource, /Processando no Banco Central/);
  assert.doesNotMatch(bookingSource, /Simula autorização rápida do gateway de pagamento/);
  assert.match(bookingSource, /Confirmando reserva/);
});
