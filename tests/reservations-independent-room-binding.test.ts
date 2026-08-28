import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('widget de reservas é registrado separadamente do widget de hóspedes', () => {
  const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');
  assert.match(registry, /import \{ ReservationsWidget \} from '\.\/widgets\/ReservationsWidget'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('reservations-list', ReservationsWidget\)/);
});

test('reserva nasce com quarto compatível por capacidade, camas e período', () => {
  const service = read('src/modules/recepcao/receptionGuestStayService.ts');
  const widget = read('src/workspace-engine/widgets/ReservationsWidget.tsx');
  const migration = read('supabase/migrations/20260828214000_reception_reservation_room_compatibility.sql');

  assert.match(service, /createReservationWithRoom/);
  assert.doesNotMatch(service, /createUnassignedReservation/);
  assert.doesNotMatch(service, /bindReservationToRoom/);
  assert.doesNotMatch(service, /unbindReservationFromRoom/);

  assert.match(widget, /Esquema de camas/);
  assert.match(widget, /Quarto compatível e disponível/);
  assert.match(widget, /room\.capacidade/);
  assert.match(widget, /room\.cama/);
  assert.match(widget, /activeReservationStatuses/);
  assert.doesNotMatch(widget, /Criar reserva sem quarto/);
  assert.doesNotMatch(widget, /Vincular quarto/);

  assert.match(migration, /add column if not exists cama_solicitada text/);
  assert.match(migration, /reception_create_reservation_with_room/);
  assert.match(migration, /v_room\.capacidade/);
  assert.match(migration, /v_room\.cama/);
  assert.match(migration, /reserva conflitante no período/);
  assert.match(migration, /v_room\.id/);
});

test('fluxo transitório de reserva sem quarto é removido do banco', () => {
  const migration = read('supabase/migrations/20260828214000_reception_reservation_room_compatibility.sql');
  assert.match(migration, /drop function if exists public\.reception_create_unassigned_reservation/);
  assert.match(migration, /drop function if exists public\.reception_bind_reservation_room/);
  assert.match(migration, /drop function if exists public\.reception_unbind_reservation_room/);
});

test('reservas finalizadas tratam o quarto como histórico', () => {
  const widget = read('src/workspace-engine/widgets/ReservationsWidget.tsx');
  const roomMap = read('src/modules/recepcao/ReceptionRoomsKanban.tsx');
  assert.match(widget, /Quarto da hospedagem/);
  assert.match(widget, /checkout_concluido/);
  assert.match(roomMap, /\['checkin_realizado', 'confirmada', 'pendente'\]\.includes\(reservation\.status\)/);
});
