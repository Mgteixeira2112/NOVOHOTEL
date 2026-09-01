import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/modules/recepcao/ReceptionRoomsKanban.tsx'),
  'utf8',
);

test('ReceptionRoomsKanban consumes canonical room rows', () => {
  assert.match(source, /import \{ buildCanonicalReceptionRoomRows \} from '\.\/receptionRoomViewModel';/);
  assert.match(source, /buildCanonicalReceptionRoomRows\(rooms, cards, reservations, guests, columns\)/);
  assert.doesNotMatch(source, /function linkedReservation\(/);
});

test('ReceptionRoomsKanban derives transfer availability from canonical room rows', () => {
  assert.match(source, /!roomRows\.some\(row => row\.room\.id === item\.id && !!row\.reservation\)/);
});
