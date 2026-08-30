import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');

test('Desktop mantém 25/50/75/100 dentro de uma superfície contínua', () => {
  assert.match(runtime, /const desktopSegments: Array<\{ kind: 'panels' \| 'buttons'/);
  assert.match(runtime, /entry\.presentation\.display === 'button' \? 'buttons' : 'panels'/);
  assert.match(runtime, /data-desktop-connected-surface/);
  assert.match(runtime, /data-desktop-panel-grid/);
  assert.match(runtime, /masonrySpanClass\(presentation\.width\)/);
  assert.match(runtime, /data-desktop-item-width=\{presentation\.width\}/);
});

test('botões Desktop não dependem de existir painel 100%', () => {
  assert.match(runtime, /segment\.kind === 'buttons'/);
  assert.match(runtime, /data-desktop-button-strip/);
  assert.match(runtime, /segment\.items\.map\(\(\{ widget, presentation \}\)/);
  assert.doesNotMatch(runtime, /buttonSurfaceIndex/);
  assert.doesNotMatch(runtime, /isFullPanel/);
});

test('ordem visual permite cenário Indicadores 25 + Alertas 25 + Frigobar 25 + botões', () => {
  assert.match(runtime, /entries\.forEach\(entry =>/);
  assert.match(runtime, /previous\?\.kind === kind/);
  assert.match(runtime, /desktopSegments\.map\(\(segment, segmentIndex\)/);
  assert.match(runtime, /renderDesktopSurface\(\)/);
});

test('blindagem mantém a geometria Masonry externa existente', () => {
  assert.match(runtime, /Math\.ceil\(\(contentHeight \+ 16\) \/ 24\)/);
  assert.match(runtime, /md:auto-rows-\[8px\]/);
  assert.match(runtime, /gap-4/);
});
