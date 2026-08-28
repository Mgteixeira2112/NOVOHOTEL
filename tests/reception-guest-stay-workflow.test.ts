import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('registra widgets de hóspedes, reservas e hospedagens ativas', () => {
  const types = read('src/workspace-engine/types.ts');
  const catalog = read('src/workspace-engine/widgetCatalog.ts');
  const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');
  assert.match(types, /\| 'guests'/);
  assert.match(types, /\| 'active-stays'/);
  assert.match(catalog, /type: 'guests'/);
  assert.match(catalog, /type: 'reservations-list'/);
  assert.match(catalog, /type: 'active-stays'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('guests'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('active-stays'/);
});

test('persiste vínculo hóspede-quarto por RPC do Supabase', () => {
  const migration = read('supabase/migrations/20260828193000_reception_guest_reservation_workflow.sql');
  const service = read('src/modules/recepcao/receptionGuestStayService.ts');
  assert.match(migration, /reception_create_reservation_for_guest/);
  assert.match(migration, /O quarto possui reserva conflitante/);
  assert.match(migration, /insert into public\.reservas/);
  assert.match(service, /supabase\.rpc\('reception_create_reservation_for_guest'/);
  assert.match(service, /supabase\.from\('hospedes'\)\.insert/);
});

test('operacionaliza chegadas, saídas e checkout de hospedagem ativa', () => {
  const info = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
  const stay = read('src/workspace-engine/widgets/ReceptionGuestStayWidgets.tsx');
  assert.match(info, /receptionStayService\.checkin/);
  assert.match(info, /receptionStayService\.checkout/);
  assert.match(stay, /Vincular hóspede ao quarto/);
  assert.match(stay, /Hóspedes hospedados/);
  assert.match(stay, /receptionStayService\.checkout/);
});
