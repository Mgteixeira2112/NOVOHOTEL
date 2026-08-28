import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mapSource = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');
const viewSource = readFileSync('src/modules/recepcao/ReceptionRoomsKanban.tsx', 'utf8');

test('check-in pode iniciar em quarto disponível sem reserva prévia', () => {
  assert.match(viewSource, /onStartCheckin\?: \(room: Quarto\) => void/);
  assert.match(viewSource, /card\.column_id === 'room-col-disponivel' && !!onStartCheckin/);
  assert.match(viewSource, /reservation \? onCheckin\(reservation\) : onStartCheckin\?\.\(room\)/);
});

test('Mapa de Quartos cria vínculo e executa check-in real', () => {
  assert.match(mapSource, /receptionGuestStayService\.createReservationForGuest/);
  assert.match(mapSource, /receptionStayService\.checkin\(created\.reservation_id/);
  assert.match(mapSource, /onStartCheckin=\{startCheckin\}/);
  assert.match(mapSource, /CONFIRMAR CHECK-IN/);
});

test('check-out continua restrito a hospedagem ativa', () => {
  assert.match(viewSource, /disabled=\{!reservation \|\| !checkedIn \|\| reservationBusy\}/);
});
