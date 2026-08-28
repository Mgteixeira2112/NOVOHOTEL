import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('widget de reservas é registrado separadamente do widget de hóspedes', () => {
  const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');
  assert.match(registry, /import \{ ReservationsWidget \} from '\.\/widgets\/ReservationsWidget'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('reservations-list', ReservationsWidget\)/);
});

test('reserva pode nascer sem quarto e ser vinculada depois', () => {
  const service = read('src/modules/recepcao/receptionGuestStayService.ts');
  const widget = read('src/workspace-engine/widgets/ReservationsWidget.tsx');
  const migration = read('supabase/migrations/20260828202500_reception_independent_reservations.sql');
  assert.match(service, /createUnassignedReservation/);
  assert.match(service, /bindReservationToRoom/);
  assert.match(service, /unbindReservationFromRoom/);
  assert.match(widget, /Criar reserva sem quarto/);
  assert.match(widget, /Vincular quarto/);
  assert.match(widget, /Desvincular/);
  assert.match(migration, /reception_create_unassigned_reservation/);
  assert.match(migration, /quarto_id, p_checkin/);
  assert.match(migration, /v_reservation_id, v_code, v_guest\.id, null/);
  assert.match(migration, /reception_bind_reservation_room/);
  assert.match(migration, /reception_unbind_reservation_room/);
});

test('reservas finalizadas tratam o quarto como histórico', () => {
  const widget = read('src/workspace-engine/widgets/ReservationsWidget.tsx');
  const roomMap = read('src/modules/recepcao/ReceptionRoomsKanban.tsx');
  assert.match(widget, /Quarto da hospedagem/);
  assert.match(widget, /checkout_concluido/);
  assert.match(roomMap, /\['checkin_realizado', 'confirmada', 'pendente'\]\.includes\(reservation\.status\)/);
});
