import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const editor = readFileSync('src/components/admin/RoomMapWidgetEditor.tsx', 'utf8');
const runtime = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/widgets/roomMapWidgetPresentation.ts', 'utf8');
const roomMap = readFileSync('src/modules/recepcao/ReceptionRoomsKanban.tsx', 'utf8');
const factory = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');

test('Fábrica oferece personalização própria para o Mapa de Quartos', () => {
  assert.match(factory, /RoomMapWidgetEditor/);
  assert.match(factory, /widget\.type === 'room-map'/);
  assert.match(editor, /Personalização do Widget Mapa de Quartos/);
  assert.match(editor, /Estados exibidos/);
  assert.match(editor, /Informações nos cards/);
  assert.match(editor, /Ações operacionais/);
  assert.match(editor, /Ações administrativas/);
});

test('configuração do Mapa persiste no settings do próprio widget', () => {
  assert.match(presentation, /roomMapPresentation/);
  assert.match(presentation, /visibleStatusIds/);
  assert.match(presentation, /showGuest/);
  assert.match(presentation, /showReservationDates/);
  assert.match(presentation, /showRoomType/);
  assert.match(presentation, /showFloor/);
  assert.match(presentation, /showStatus/);
});

test('runtime filtra estados e respeita ações configuradas', () => {
  assert.match(runtime, /displayedColumns/);
  assert.match(runtime, /displayedCards/);
  assert.match(runtime, /roomMapActionEnabled\(widget, 'checkin'\)/);
  assert.match(runtime, /roomMapActionEnabled\(widget, 'checkout'\)/);
  assert.match(runtime, /roomMapActionEnabled\(widget, 'transferRoom'\)/);
  assert.match(runtime, /roomMapActionEnabled\(widget, 'editRoom'\)/);
  assert.match(runtime, /roomMapActionEnabled\(widget, 'deleteRoom'\)/);
});

test('componente visual oculta ações e informações sem alterar serviços de dados', () => {
  assert.match(roomMap, /allowCheckin/);
  assert.match(roomMap, /allowCheckout/);
  assert.match(roomMap, /allowTransferRoom/);
  assert.match(roomMap, /allowEditRoom/);
  assert.match(roomMap, /allowDeleteRoom/);
  assert.match(roomMap, /showGuest/);
  assert.match(roomMap, /showReservationDates/);
  assert.match(roomMap, /showStatus/);
});

test('novos Mapas fora da Recepção começam sem ações de hospedagem', () => {
  assert.match(presentation, /sector === 'recepcao'/);
  assert.match(presentation, /checkin: false/);
  assert.match(presentation, /checkout: false/);
  assert.match(presentation, /transferRoom: false/);
  assert.match(presentation, /editRoom: false/);
  assert.match(presentation, /deleteRoom: false/);
});
