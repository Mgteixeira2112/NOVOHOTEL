import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widget = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');
const kanban = readFileSync('src/modules/recepcao/ReceptionRoomsKanban.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/widgets/roomMapWidgetPresentation.ts', 'utf8');

const forbiddenParallelSources = [
  /from ['\"][^'\"]*\/(repositories|services)\/[^'\"]*room[^'\"]*['\"]/i,
  /createClient\(/i,
];

test('Mapa de Quartos mantém projeção canônica e view model centralizado', () => {
  assert.match(widget, /selectCanonicalReceptionRoomCards/);
  assert.match(widget, /const canonicalCards = useMemo/);
  assert.match(kanban, /buildCanonicalReceptionRoomRows/);
  assert.match(kanban, /Cards permanentes: o quarto continua no mapa/);
});

test('Mapa de Quartos mantém operações no caminho oficial da Recepção', () => {
  assert.match(widget, /receptionStayService\.checkin/);
  assert.match(widget, /receptionStayService\.checkout/);
  assert.match(widget, /receptionStayService\.transferRoom/);
  assert.match(widget, /receptionGuestStayService\.directCheckin/);
  assert.match(widget, /Use Check-in para ocupar o quarto\./);
});

test('Mapa de Quartos mantém ações condicionadas ao contrato do widget', () => {
  assert.match(widget, /roomMapActionEnabled\(widget, 'checkin'\)/);
  assert.match(widget, /roomMapActionEnabled\(widget, 'checkout'\)/);
  assert.match(widget, /roomMapActionEnabled\(widget, 'transferRoom'\)/);
  assert.match(widget, /roomMapActionEnabled\(widget, 'editRoom'\)/);
  assert.match(widget, /roomMapActionEnabled\(widget, 'deleteRoom'\)/);
  assert.match(presentation, /export function roomMapActionEnabled/);
});

test('Mapa de Quartos preserva contrato v2 para Desktop, Mobile e KDS/TV', () => {
  assert.match(presentation, /version: 2/);
  assert.match(presentation, /desktop: RoomMapDesktopPresentation/);
  assert.match(presentation, /mobile: RoomMapMobilePresentation/);
  assert.match(presentation, /kds: RoomMapKdsPresentation/);
  assert.match(presentation, /mode: 'room-rack'/);
  assert.match(presentation, /mode: 'cards'/);
  assert.match(presentation, /mode: 'situation-board'/);
});

test('certificação do Mapa de Quartos não cria cliente ou repository paralelo', () => {
  for (const forbidden of forbiddenParallelSources) {
    assert.doesNotMatch(widget, forbidden);
    assert.doesNotMatch(kanban, forbidden);
    assert.doesNotMatch(presentation, forbidden);
  }
});
