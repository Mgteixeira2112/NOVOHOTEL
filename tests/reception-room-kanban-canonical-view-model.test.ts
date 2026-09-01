import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/modules/recepcao/ReceptionRoomsKanban.tsx'),
  'utf8',
);

describe('ReceptionRoomsKanban canonical view model boundary', () => {
  it('consumes the canonical room rows instead of selecting reservations locally', () => {
    assert.ok(source.includes("import { buildCanonicalReceptionRoomRows } from './receptionRoomViewModel';"));
    assert.ok(source.includes('buildCanonicalReceptionRoomRows(rooms, cards, reservations, guests, columns)'));
    assert.ok(!source.includes('function linkedReservation('));
    assert.ok(!source.includes("['checkin_realizado', 'confirmada', 'pendente']"));
    assert.ok(!source.includes('reservation.quarto_id === room.id'));
  });

  it('derives transfer availability from canonical room rows', () => {
    assert.ok(source.includes('!roomRows.some(row => row.room.id === item.id && !!row.reservation)'));
  });
});
