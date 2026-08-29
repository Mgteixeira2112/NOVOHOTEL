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

test('todos os botões Desktop ficam em uma única faixa horizontal dentro da superfície', () => {
  assert.match(runtime, /const desktopButtons = viewport === 'desktop' \? entries\.filter\(entry => entry\.presentation\.display === 'button'\) : \[\]/);
  assert.match(runtime, /const desktopEntries = viewport === 'desktop' \? entries\.filter\(entry => entry\.presentation\.display !== 'button'\) : entries/);
  assert.match(runtime, /flex w-full flex-nowrap gap-2 overflow-x-auto/);
  assert.match(runtime, /desktopButtons\.map/);
  assert.match(runtime, /buttonSurfaceIndex/);
});

test('painéis full continuam sem cabeçalho e casca externa redundantes dentro da fusão', () => {
  assert.match(runtime, /suppressHeader: true, connectedPanel: true/);
  assert.match(runtime, /connectedPanelClass/);
  assert.match(runtime, /\[&>\*\]:!rounded-none/);
  assert.match(runtime, /\[&>\*\]:!border-0/);
  assert.match(runtime, /\[&>\*\]:!shadow-none/);
});
