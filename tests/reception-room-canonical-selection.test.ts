import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalReceptionRoomCardId, isCanonicalReceptionRoomCard, selectCanonicalReceptionRoomCards } from '../src/modules/recepcao/receptionRoomProjectionSelection';

test('card canônico da Recepção usa identidade determinística por quarto', () => {
  assert.equal(canonicalReceptionRoomCardId('rm-302'), 'room-rec-rm-302');
});

test('seleção canônica ignora projeções legadas do mesmo quarto', () => {
  const cards = [
    { id: 'auto-res-res-legado-1', board_id: 'kanban-board-recepcao-quartos', column_id: 'room-col-sujo' },
    { id: 'room-rec-rm-302', board_id: 'kanban-board-recepcao-quartos', column_id: 'room-col-sujo' },
    { id: 'auto-res-res-legado-2', board_id: 'kanban-board-recepcao-quartos', column_id: 'room-col-sujo' },
  ] as any[];

  assert.equal(isCanonicalReceptionRoomCard(cards[1], 'rm-302'), true);
  assert.equal(isCanonicalReceptionRoomCard(cards[0], 'rm-302'), false);
  assert.deepEqual(selectCanonicalReceptionRoomCards(cards, ['rm-302']).map(card => card.id), ['room-rec-rm-302']);
});

test('seleção canônica não usa número do quarto como fallback ambíguo', () => {
  const cards = [
    { id: 'legacy-by-number', room_number: '302', board_id: 'kanban-board-recepcao-quartos', column_id: 'room-col-sujo' },
  ] as any[];

  assert.deepEqual(selectCanonicalReceptionRoomCards(cards, ['rm-302']), []);
});
