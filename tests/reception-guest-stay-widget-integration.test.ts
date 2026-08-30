import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('Hóspedes mantém CRUD oficial e exige sincronização após persistência', () => {
  const source = read('src/workspace-engine/widgets/ReceptionGuestStayWidgets.tsx');
  assert.match(source, /receptionGuestStayService\.createGuest\(form\)/);
  assert.match(source, /receptionGuestStayService\.updateGuest\(editingGuestId, form\)/);
  assert.match(source, /const synced = await syncFromSupabase\(\)/);
  assert.match(source, /Dados salvos, mas a lista não conseguiu atualizar/);
});

test('Hóspedes hospedados exibe datas canônicas e valida atualização após checkout', () => {
  const source = read('src/workspace-engine/widgets/ReceptionGuestStayWidgets.tsx');
  assert.match(source, /const stayCheckin = \(reservation: Reserva\) => reservation\.data_checkin \|\| reservation\.checkin \|\| ''/);
  assert.match(source, /const stayCheckout = \(reservation: Reserva\) => reservation\.data_checkout \|\| reservation\.checkout \|\| ''/);
  assert.match(source, /Check-out concluído, mas a lista não conseguiu atualizar/);
  assert.match(source, /receptionStayService\.checkout/);
});

test('Mapa de quartos reutiliza calendário local blindado e valida refresh pós-operação', () => {
  const source = read('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx');
  assert.match(source, /import \{ addLocalDays, localDateKey \} from '\.\/localDate'/);
  assert.match(source, /useState\(localDateKey\(\)\)/);
  assert.match(source, /useState\(addLocalDays\(localDateKey\(\), 1\)\)/);
  assert.match(source, /const synced = await syncFromSupabase\(\)/);
  assert.match(source, /if \(!synced\.success\) throw new Error/);
  assert.doesNotMatch(source, /const dateInput =/);
});
