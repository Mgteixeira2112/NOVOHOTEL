import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('src/workspace-engine/workspaceDesktopButtonStrip.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

test('Workspace Desktop reúne todos os botões no topo em uma única linha sem scroll', () => {
  assert.match(main, /workspaceDesktopButtonStrip\.css/);
  assert.match(css, /\[data-desktop-connected-surface\]/);
  assert.match(css, /display: flex;/);
  assert.match(css, /flex-wrap: wrap;/);
  assert.match(css, /\[data-desktop-button-strip\],/);
  assert.match(css, /\[data-desktop-button-strip\] > div/);
  assert.match(css, /display: contents;/);
  assert.match(css, /order: -1;/);
  assert.match(css, /min-width: 0 !important;/);
  assert.match(css, /flex: 1 1 0 !important;/);
  assert.match(css, /\[data-desktop-panel-grid\]/);
  assert.match(css, /flex: 0 0 100%;/);
  assert.doesNotMatch(css, /overflow-x: auto/);
  assert.doesNotMatch(css, /scrollbar-width/);
  assert.match(css, /text-overflow: ellipsis;/);
  assert.match(css, /white-space: nowrap;/);
});
