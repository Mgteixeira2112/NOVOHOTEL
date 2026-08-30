import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { addLocalDays, localDateKey } from '../src/workspace-engine/widgets/localDate';

const read = (path: string) => fs.readFileSync(path, 'utf8');

test('localDateKey usa componentes locais em vez de converter o calendário para UTC', () => {
  const instant = new Date(2026, 7, 29, 23, 30, 0, 0);
  assert.equal(localDateKey(instant), '2026-08-29');
});

test('addLocalDays atravessa virada de mês sem aritmética UTC', () => {
  assert.equal(addLocalDays('2026-08-31', 1), '2026-09-01');
  assert.equal(addLocalDays('2026-09-01', -1), '2026-08-31');
});

test('Chegadas e Saídas usam calendário local e validam sincronização após ação', () => {
  const source = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
  assert.match(source, /const today = localDateKey\(\)/);
  assert.doesNotMatch(source, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
  assert.match(source, /const synced = await syncFromSupabase\(\)/);
  assert.match(source, /if \(!synced\.success\) throw new Error/);
  assert.match(source, /receptionStayService\.checkin/);
  assert.match(source, /receptionStayService\.checkout/);
});

test('Reservas inicia entrada e saída pelo calendário local', () => {
  const source = read('src/workspace-engine/widgets/ReservationsWidget.tsx');
  assert.match(source, /localDateKey, tomorrowLocalDateKey/);
  assert.match(source, /checkin: localDateKey\(\)/);
  assert.match(source, /checkout: tomorrowLocalDateKey\(\)/);
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/);
});

test('Calendário de ocupação navega exclusivamente por datas locais', () => {
  const source = read('src/workspace-engine/widgets/OccupancyCalendarWidget.tsx');
  assert.match(source, /addLocalDays, localDateKey/);
  assert.match(source, /useState\(\(\) => localDateKey\(\)\)/);
  assert.match(source, /addLocalDays\(startDate, daysVisible\)/);
  assert.match(source, /setStartDate\(localDateKey\(\)\)/);
  assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)/);
  assert.doesNotMatch(source, /DAY_MS/);
});
