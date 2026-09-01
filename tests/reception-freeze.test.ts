import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stayService = readFileSync('src/modules/recepcao/receptionStayService.ts', 'utf8');
const guestStayService = readFileSync('src/modules/recepcao/receptionGuestStayService.ts', 'utf8');
const roomMapWidget = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');
const roomViewModel = readFileSync('src/modules/recepcao/receptionRoomViewModel.ts', 'utf8');
const projectionSelection = readFileSync('src/modules/recepcao/receptionRoomProjectionSelection.ts', 'utf8');
const receptionKanban = readFileSync('src/modules/recepcao/ReceptionKanbanBoard.tsx', 'utf8');

const forbiddenNewInfrastructure = [
  /receptionV3/i,
  /newReceptionEngine/i,
  /parallelReception/i,
];

test('Recepção mantém check-in, check-out e transferência nos RPCs oficiais existentes', () => {
  assert.match(stayService, /reception_room_checkin/);
  assert.match(stayService, /reception_room_checkout/);
  assert.match(stayService, /reception_room_transfer/);
  assert.match(roomMapWidget, /receptionStayService\.checkin/);
  assert.match(roomMapWidget, /receptionStayService\.checkout/);
  assert.match(roomMapWidget, /receptionStayService\.transferRoom/);
});

test('Recepção mantém hóspedes, disponibilidade, reservas e check-in direto no service existente', () => {
  assert.match(guestStayService, /createGuest/);
  assert.match(guestStayService, /updateGuest/);
  assert.match(guestStayService, /reception_find_available_rooms/);
  assert.match(guestStayService, /reception_create_reservation_with_room/);
  assert.match(guestStayService, /reception_room_direct_checkin/);
  assert.match(roomMapWidget, /receptionGuestStayService\.directCheckin/);
});

test('Recepção preserva projeção canônica e view model centralizado já certificados', () => {
  assert.match(roomMapWidget, /selectCanonicalReceptionRoomCards/);
  assert.match(projectionSelection, /canonical/i);
  assert.match(roomViewModel, /buildCanonicalReceptionRoomRows/);
});

test('Recepção preserva o Kanban existente sem introduzir infraestrutura paralela', () => {
  assert.match(receptionKanban, /ReceptionKanbanBoard/);
  for (const forbidden of forbiddenNewInfrastructure) {
    assert.doesNotMatch(stayService, forbidden);
    assert.doesNotMatch(guestStayService, forbidden);
    assert.doesNotMatch(roomMapWidget, forbidden);
    assert.doesNotMatch(receptionKanban, forbidden);
  }
});
