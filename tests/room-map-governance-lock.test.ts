import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const service = readFileSync('src/modules/recepcao/receptionRoomKanbanService.ts', 'utf8');

test('Mapa de Quartos consulta a liberação da Governança antes de mover o quarto', () => {
  assert.match(service, /kanban-board-governanca/);
  assert.match(service, /gov-col-liberado/);
  assert.match(service, /assertGovernanceReleased\(roomId\)/);
});

test('validação da Governança acontece antes de mover o card do Mapa', () => {
  const guard = service.indexOf('await assertGovernanceReleased(roomId)');
  const move = service.indexOf('kanbanCardGovernance.moveCard');
  const roomUpdate = service.indexOf(".from('quartos')");
  assert.ok(guard >= 0);
  assert.ok(move > guard);
  assert.ok(roomUpdate > guard);
});

test('Mapa bloqueia alteração quando Governança não está liberada', () => {
  assert.match(service, /Governança.*não liberou o quarto/);
});
