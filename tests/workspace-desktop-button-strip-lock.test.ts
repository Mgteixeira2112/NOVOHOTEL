import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('src/workspace-engine/workspaceDesktopButtonStrip.css', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');

test('blindagem: todos os atalhos Desktop ficam antes de qualquer painel', () => {
  assert.match(css, /\[data-desktop-connected-surface\]\s*\{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;/);
  assert.match(css, /\[data-desktop-button-strip\],[\s\S]*\[data-desktop-button-strip\] > div\s*\{[\s\S]*display: contents;/);
  assert.match(css, /\[data-desktop-button-strip\] \[data-widget-display='button'\]\s*\{[\s\S]*order: -1;/);
  assert.match(css, /\[data-desktop-panel-grid\]\s*\{[\s\S]*order: 0;[\s\S]*width: 100%;[\s\S]*flex: 0 0 100%;/);
});

test('blindagem: atalhos Desktop permanecem em uma única linha sem scroll', () => {
  assert.match(css, /min-width: 0 !important;/);
  assert.match(css, /flex: 1 1 0 !important;/);
  assert.doesNotMatch(css, /overflow-x:\s*(auto|scroll)/);
  assert.doesNotMatch(css, /scrollbar-width/);
  assert.match(css, /text-overflow: ellipsis;/);
  assert.match(css, /white-space: nowrap;/);
});

test('blindagem: runtime mantém os marcadores da composição visual aprovada', () => {
  assert.match(runtime, /data-desktop-connected-surface/);
  assert.match(runtime, /data-desktop-button-strip/);
  assert.match(runtime, /data-desktop-panel-grid/);
  assert.match(runtime, /data-widget-display=\{isButton \? 'button'/);
  assert.match(runtime, /renderDesktopSurface\(\)/);
});
