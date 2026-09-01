import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/widgets/ReceptionRoomMapWidget.tsx', 'utf8');

test('runtime do Mapa entrega apenas cards canônicos ao componente visual', () => {
  assert.match(runtime, /selectCanonicalReceptionRoomCards/);
  assert.match(runtime, /const canonicalCards = useMemo/);
  assert.match(runtime, /rooms\.map\(room => room\.id\)/);
  assert.match(runtime, /cards=\{displayedCards\}/);
  assert.match(runtime, /canonicalCards\.filter\(card => visibleStatusSet\.has\(card\.column_id\)\)/);
});

test('filtro visual deixa de operar diretamente sobre todos os cards carregados', () => {
  assert.doesNotMatch(runtime, /visibleStatusSet \? cards\.filter\(card => visibleStatusSet\.has\(card\.column_id\)\) : cards/);
});
