import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');

test('runtime Desktop separa widgets livres do fluxo automático', () => {
  assert.match(runtime, /desktopSpatialEntries = viewport === 'desktop'/);
  assert.match(runtime, /entries\.filter\(\(\{ widget \}\) => hasDesktopSpatialPosition\(widget\)\)/);
  assert.match(runtime, /desktopFlowEntries = viewport === 'desktop'/);
  assert.match(runtime, /entries\.filter\(\(\{ widget \}\) => !hasDesktopSpatialPosition\(widget\)\)/);
  assert.match(runtime, /desktopFlowEntries\.forEach\(entry =>/);
  assert.match(runtime, /renderDesktopSurface\(\)/);
});

test('superfície visual só é ativada quando há posição espacial Desktop', () => {
  assert.match(runtime, /desktopSpatialActive = viewport === 'desktop' && desktopSpatialEntries\.length > 0/);
  assert.match(runtime, /workspaceSurfaceStyle\(definition\.presentation\?\.surface\)/);
  assert.match(runtime, /desktopSpatialMinHeight/);
  assert.match(runtime, /style=\{desktopSpatialSurfaceStyle\}/);
  assert.match(runtime, /data-workspace-spatial-runtime=\{desktopSpatialActive \? 'true' : undefined\}/);
});

test('widgets livres reutilizam renderer oficial e geometria testada', () => {
  assert.match(runtime, /desktopSpatialStyle\(widget, presentation\.width\)/);
  assert.match(runtime, /data-desktop-spatial-widget=\{widget\.id\}/);
  assert.match(runtime, /renderWidget\(widget, presentation\)/);
  assert.doesNotMatch(runtime, /position:\s*'absolute'.*WidgetDrivenWorkspace/s);
});

test('Mobile e KDS continuam no caminho existente por entries map', () => {
  assert.match(runtime, /viewport === 'desktop'[\s\S]*renderDesktopSurface\(\)[\s\S]*renderDesktopSpatialWidgets\(\)[\s\S]*entries\.map\(\(\{ widget, presentation \}\) =>/);
  assert.match(runtime, /isKds \? kdsSpanClass\(presentation\.width, kdsOrientation\) : ''/);
});
