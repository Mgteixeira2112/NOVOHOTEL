import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const hotelContext = readFileSync('src/context/HotelContext.tsx', 'utf8');

test('kanbanSyncEngine legado não existe mais', () => {
  assert.equal(existsSync('src/services/kanbanSyncEngine.ts'), false);
});

test('HotelContext não referencia o engine kanban legado', () => {
  assert.doesNotMatch(hotelContext, /kanbanSyncEngine/);
  assert.doesNotMatch(hotelContext, /generatePMSSyncCards/);
});
