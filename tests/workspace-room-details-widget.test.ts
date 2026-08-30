import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/workspace-engine/widgets/RoomDetailsWidget.tsx', 'utf8');
const registration = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');

test('detalhes do quarto usa somente dados oficiais já presentes no HotelContext', () => {
  assert.match(source, /const \{ rooms, reservations, guests \} = useHotel\(\)/);
  assert.match(source, /item\.status === 'checkin_realizado'/);
  assert.match(source, /item\.quarto_id === room\.id/);
  assert.match(source, /item\.id === reservation\.hospede_id/);
  assert.doesNotMatch(source, /supabase/);
  assert.doesNotMatch(source, /localStorage/);
});

test('detalhes do quarto respeita contexto configurado e possui fallback selecionável', () => {
  assert.match(source, /widget\.filters\?\.roomId/);
  assert.match(source, /room\.ativo !== false/);
  assert.match(source, /!configuredRoomId && availableRooms\.length > 0/);
  assert.match(source, /Nenhum quarto ativo disponível para exibição/);
});

test('detalhes do quarto usa status operacional canônico e campos canônicos de período', () => {
  assert.match(source, /normalizeRoomOperationalStatus/);
  assert.match(source, /ROOM_OPERATIONAL_STATUS/);
  assert.match(source, /data_checkin \|\| reservation\?\.checkin/);
  assert.match(source, /data_checkout \|\| reservation\?\.checkout/);
});

test('room-details fica registrado como renderer builtin', () => {
  assert.match(registration, /registerWorkspaceWidgetRenderer\('room-details', RoomDetailsWidget\)/);
});
