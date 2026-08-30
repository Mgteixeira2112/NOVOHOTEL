import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('src/workspace-engine/workspaceDesktopButtonStrip.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

test('Workspace Desktop mantém os botões em uma única linha centralizada e sem scroll', () => {
  assert.match(main, /workspaceDesktopButtonStrip\.css/);
  assert.match(css, /\[data-desktop-button-strip\] \[data-widget-display='button'\]/);
  assert.match(css, /justify-content: center;/);
  assert.match(css, /flex-wrap: nowrap !important;/);
  assert.match(css, /overflow-x: hidden !important;/);
  assert.match(css, /min-width: 0 !important;/);
  assert.match(css, /flex: 1 1 8rem !important;/);
  assert.doesNotMatch(css, /overflow-x: auto/);
  assert.doesNotMatch(css, /scrollbar-width/);
  assert.match(css, /text-overflow: ellipsis;/);
  assert.match(css, /white-space: nowrap;/);
});
