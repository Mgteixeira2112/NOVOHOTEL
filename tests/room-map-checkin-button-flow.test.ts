import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mapSource = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');
const viewSource = readFileSync('src/modules/recepcao/ReceptionRoomsKanban.tsx', 'utf8');
const serviceSource = readFileSync('src/modules/recepcao/receptionGuestStayService.ts', 'utf8');
const migrationSource = readFileSync('supabase/migrations/20260828233000_atomic_direct_room_checkin.sql', 'utf8');

test('check-in pode iniciar em quarto disponível sem reserva prévia', () => {
  assert.match(viewSource, /onStartCheckin\?: \(room: Quarto\) => void/);
  assert.match(viewSource, /card\.column_id === 'room-col-disponivel' && !!onStartCheckin/);
  assert.match(viewSource, /reservation \? onCheckin\(reservation\) : onStartCheckin\?\.\(room\)/);
});

test('Mapa de Quartos usa check-in direto atômico sem reserva intermediária', () => {
  assert.match(mapSource, /receptionGuestStayService\.directCheckin/);
  assert.doesNotMatch(mapSource, /createReservationForGuest\(\{/);
  assert.doesNotMatch(mapSource, /receptionStayService\.checkin\(created\.reservation_id/);
  assert.match(mapSource, /A reserva só será criada se o check-in puder ser concluído integralmente/);
  assert.match(mapSource, /onStartCheckin=\{startCheckin\}/);
  assert.match(mapSource, /CONFIRMAR CHECK-IN/);
});

test('serviço de recepção expõe RPC atômico de check-in direto', () => {
  assert.match(serviceSource, /async directCheckin/);
  assert.match(serviceSource, /reception_room_direct_checkin/);
  assert.match(migrationSource, /create or replace function public\.reception_room_direct_checkin/);
  assert.match(migrationSource, /status,\n    checkin_horario/);
  assert.match(migrationSource, /'checkin_realizado'/);
  assert.match(migrationSource, /control_owner, 'recepcao'/);
  assert.match(migrationSource, /for update/);
});

test('check-out continua restrito a hospedagem ativa', () => {
  assert.match(viewSource, /disabled=\{!reservation \|\| !checkedIn \|\| reservationBusy\}/);
});
