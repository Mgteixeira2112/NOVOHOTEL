import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync('src/workspace-engine/WorkspaceRuntime.tsx', 'utf8');
const canvasSource = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const catalogSource = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const editorSource = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');
const storeSource = readFileSync('src/workspace-engine/workspaceConfigStore.ts', 'utf8');

test('WorkspaceRuntime usa sempre o canvas dirigido pela composição de widgets', () => {
  assert.match(runtimeSource, /<WidgetDrivenWorkspace definition=\{definition\}/);
  assert.doesNotMatch(runtimeSource, /getWorkspaceAdapter/);
  assert.doesNotMatch(runtimeSource, /GenericOperationalWorkspace/);
  assert.doesNotMatch(runtimeSource, /GovernancaWorkspace/);
  assert.doesNotMatch(runtimeSource, /ReceptionWorkspaceShared/);
});

test('canvas renderiza somente widgets ativos, visíveis e na ordem da apresentação resolvida', () => {
  assert.match(canvasSource, /normalizeWorkspaceWidgets\(definition\.widgets\)/);
  assert.match(canvasSource, /widget\.enabled !== false && widget\.permissions\?\.view !== false/);
  assert.match(canvasSource, /resolveWidgetPresentation\(definition, widget, viewport\)/);
  assert.match(canvasSource, /entries\.map\(\(\{ widget, presentation \}\) =>/);
  assert.match(canvasSource, /data-widget-id=\{widget\.id\}/);
});

test('normalização preserva widgets desativados, apresentação e ordem configurada', () => {
  assert.doesNotMatch(catalogSource, /filter\(widget => widget\.enabled !== false\)/);
  assert.match(catalogSource, /enabled: widget\.enabled !== false/);
  assert.match(catalogSource, /presentation: normalizeWidgetPresentation/);
  assert.match(catalogSource, /sort\(\(a, b\) => \(a\.order \?\? 0\) - \(b\.order \?\? 0\)\)/);
});

test('roteador operacional reage às alterações salvas pela Fábrica', () => {
  assert.match(appSource, /subscribeWorkspaceConfig/);
  assert.match(appSource, /setWorkspaceRevision\(current => current \+ 1\)/);
  assert.match(appSource, /resolveWorkspaceForSectors\(sectorIds, hotelId\)/);
});

test('Fábrica altera composição e persistência dispara atualização do runtime', () => {
  assert.match(editorSource, /updateWidget\(widget\.id, \{ enabled: widget\.enabled === false \}\)/);
  assert.match(editorSource, /widgets: selected\.widgets\.filter\(widget => widget\.id !== widgetId\)/);
  assert.match(editorSource, /widgets: widgets\.map\(\(widget, order\) => \(\{ \.\.\.widget, order: \(order \+ 1\) \* 10 \}\)\)/);
  assert.match(storeSource, /replaceMemoryOverrides/);
  assert.match(storeSource, /dispatchWorkspaceConfigChanged/);
});

test('Workspace usa Supabase como única persistência e não usa localStorage', () => {
  assert.doesNotMatch(storeSource, /localStorage/);
  assert.doesNotMatch(storeSource, /sessionStorage/);
  assert.match(storeSource, /workspace_engine_configs/);
  assert.match(storeSource, /const overridesByHotel = new Map/);
});

test('runtime só recebe nova definição depois de persistência confirmada pelo Supabase', () => {
  const upsertIndex = storeSource.indexOf("supabase.from('workspace_engine_configs').upsert");
  const memoryIndex = storeSource.indexOf('replaceMemoryOverrides(hotelId, current)');
  const dispatchIndex = storeSource.indexOf('dispatchWorkspaceConfigChanged(definition.id, hotelId)');
  assert.ok(upsertIndex >= 0);
  assert.ok(memoryIndex > upsertIndex);
  assert.ok(dispatchIndex > memoryIndex);
  assert.match(storeSource, /if \(error\) return \{ persisted: false, error: error\.message \}/);
});
