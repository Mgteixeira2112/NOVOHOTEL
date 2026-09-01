import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const controls = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');

test('Fábrica configura somente o contrato oficial da sidebar Desktop', () => {
  assert.match(controls, /const sidebar = presentation\.sidebar \|\| \{\}/);
  assert.match(controls, /updateSidebar/);
  assert.match(controls, /data-workspace-sidebar-controls/);
  assert.match(controls, /sidebar\.enabled === true/);
  assert.match(controls, /WorkspaceSidebarItemSize/);
  assert.match(controls, /WorkspaceSidebarVisualStyle/);
});

test('runtime captura somente widgets Desktop resolvidos como botão quando sidebar está ativa', () => {
  assert.match(runtime, /desktopSidebarActive = viewport === 'desktop' && sidebar\?\.enabled === true/);
  assert.match(runtime, /entries\.filter\(\(\{ presentation \}\) => presentation\.display === 'button'\)/);
  assert.match(runtime, /!isDesktopSidebarEntry\(presentation\) && hasDesktopSpatialPosition\(widget\)/);
  assert.match(runtime, /!isDesktopSidebarEntry\(presentation\) && !hasDesktopSpatialPosition\(widget\)/);
  assert.match(runtime, /desktopFlowEntries\.forEach\(entry =>/);
});

test('sidebar reutiliza abertura oficial do widget e escala conteúdo por tamanho', () => {
  assert.match(runtime, /data-workspace-sidebar="desktop"/);
  assert.match(runtime, /data-workspace-sidebar-item=\{widget\.id\}/);
  assert.match(runtime, /openWidgetPanel\(widget\.id\)/);
  assert.match(runtime, /itemSize !== 'compact'/);
  assert.match(runtime, /itemSize === 'large'/);
});

test('Mobile e KDS permanecem fora do caminho da sidebar', () => {
  assert.match(runtime, /desktopSidebarActive = viewport === 'desktop'/);
  assert.match(runtime, /viewport === 'desktop'[\s\S]*renderDesktopSurface\(\)[\s\S]*renderDesktopSpatialWidgets\(\)[\s\S]*entries\.map/);
  assert.match(runtime, /renderDesktopSidebar\(\)/);
});
