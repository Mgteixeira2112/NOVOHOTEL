import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('src/workspace-engine/workspaceDesktopButtonStrip.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

test('Workspace Desktop mantém muitos widgets em uma faixa compacta e legível', () => {
  assert.match(main, /workspaceDesktopButtonStrip\.css/);
  assert.match(css, /\[data-desktop-button-strip\] \[data-widget-display='button'\]/);
  assert.match(css, /min-width: 10rem !important;/);
  assert.match(css, /flex: 0 0 auto !important;/);
  assert.match(css, /min-height: 3\.25rem !important;/);
  assert.match(css, /> button > div > p/);
  assert.match(css, /display: none;/);
  assert.match(css, /text-overflow: ellipsis;/);
  assert.match(css, /white-space: nowrap;/);
});
