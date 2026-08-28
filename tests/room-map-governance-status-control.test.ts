import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widgetSource = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');
const viewSource = readFileSync('src/modules/recepcao/ReceptionRoomsKanban.tsx', 'utf8');

test('Mapa de Quartos acompanha a liberação oficial da Governança', () => {
  assert.match(widgetSource, /kanban-board-governanca/);
  assert.match(widgetSource, /gov-col-liberado/);
  assert.match(widgetSource, /from\('kanban_cards'\)/);
  assert.match(widgetSource, /statusChangeAllowedRoomIds=\{governanceReleasedRoomIds\}/);
});

test('seletor de status só aparece para quarto liberado pela Governança', () => {
  assert.match(viewSource, /statusChangeAllowedRoomIds\?: string\[\]/);
  assert.match(viewSource, /statusChangeAllowedRoomIds\.includes\(room\.id\)/);
  assert.match(viewSource, /showStatus && canChangeOperationalStatus/);
});
