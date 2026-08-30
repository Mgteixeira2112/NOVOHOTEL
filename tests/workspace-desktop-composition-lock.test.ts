import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');

test('composição Desktop mantém superfície contínua sem alterar o Masonry global', () => {
  assert.match(runtime, /data-desktop-connected-surface/);
  assert.match(runtime, /data-desktop-connected-item/);
  assert.match(runtime, /data-desktop-button-strip/);
  assert.match(runtime, /md:auto-rows-\[8px\]/);
  assert.match(runtime, /gridRowEnd: `span \$\{rows\}`/);
  assert.doesNotMatch(runtime, /grid-auto-rows:\s*23px/);
  assert.doesNotMatch(runtime, /gap:\s*1px/);
});

test('botões Desktop ficam em faixa horizontal na ordem da composição sem depender de painel full', () => {
  assert.match(runtime, /const desktopSegments: Array<\{ kind: 'panels' \| 'buttons'/);
  assert.match(runtime, /entry\.presentation\.display === 'button' \? 'buttons' : 'panels'/);
  assert.match(runtime, /previous\?\.kind === kind/);
  assert.match(runtime, /flex w-full flex-nowrap gap-2 overflow-x-auto/);
  assert.match(runtime, /segment\.items\.map/);
  assert.doesNotMatch(runtime, /buttonSurfaceIndex/);
  assert.doesNotMatch(runtime, /const desktopButtons/);
});

test('painéis de qualquer largura continuam sem cabeçalho e casca externa redundantes dentro da fusão', () => {
  assert.match(runtime, /masonrySpanClass\(presentation\.width\)/);
  assert.match(runtime, /suppressHeader: true, connectedPanel: true/);
  assert.match(runtime, /connectedPanelClass/);
  assert.match(runtime, /\[&>\*\]:!rounded-none/);
  assert.match(runtime, /\[&>\*\]:!border-0/);
  assert.match(runtime, /\[&>\*\]:!shadow-none/);
});
