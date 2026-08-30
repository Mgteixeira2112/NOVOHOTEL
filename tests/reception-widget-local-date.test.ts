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
