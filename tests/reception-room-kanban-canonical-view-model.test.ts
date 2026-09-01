import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/modules/recepcao/ReceptionRoomsKanban.tsx'),
  'utf8',
);

describe('ReceptionRoomsKanban canonical view model boundary', () => {
  it('consumes the canonical room rows instead of selecting reservations locally', () => {
    expect(source).toContain("import { buildCanonicalReceptionRoomRows } from './receptionRoomViewModel';");
    expect(source).toContain('buildCanonicalReceptionRoomRows(rooms, cards, reservations, guests, columns)');
    expect(source).not.toContain('function linkedReservation(');
    expect(source).not.toContain("['checkin_realizado', 'confirmada', 'pendente']");
    expect(source).not.toContain('reservation.quarto_id === room.id');
  });

  it('derives transfer availability from canonical room rows', () => {
    expect(source).toContain('!roomRows.some(row => row.room.id === item.id && !!row.reservation)');
  });
});
