import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('Alertas usa o normalizador operacional canônico e ignora quartos inativos', () => {
  const source = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
  assert.match(source, /normalizeRoomOperationalStatus/);
  assert.match(source, /ROOM_OPERATIONAL_STATUS/);
  assert.match(source, /room\.ativo !== false/);
  assert.match(source, /status_governanca \|\| room\.status_housekeeping/);
  assert.match(source, /ROOM_OPERATIONAL_STATUS\[alertStatus\]\.label/);
});

test('Resumo operacional conta apenas quartos ativos e disponibilidade canônica', () => {
  const source = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
  assert.match(source, /const activeRooms = rooms\.filter\(room => room\.ativo !== false\)/);
  assert.match(source, /normalizeRoomOperationalStatus\(item\.status\) === 'disponivel'/);
  assert.match(source, /activeRoomIds\.has\(item\.quarto_id\)/);
  assert.match(source, /\{activeRooms\.length\}/);
});

test('widget não mantém normalização paralela de status', () => {
  const source = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
  assert.doesNotMatch(source, /const normalize =/);
  assert.doesNotMatch(source, /\.trim\(\)\.toLowerCase\(\)/);
});
