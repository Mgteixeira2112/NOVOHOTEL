import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync('src/workspace-engine/WorkspaceRuntime.tsx', 'utf8');
const canvasSource = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const catalogSource = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const editorSource = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');
const storeSource = readFileSync('src/workspace-engine/workspaceConfigStore.ts', 'utf8');

test('WorkspaceRuntime mantém Recepção aprovada e usa canvas dirigido por widgets nas demais áreas', () => {
  assert.match(runtimeSource, /<WidgetDrivenWorkspace definition=\{definition\}/);
  assert.match(runtimeSource, /ReceptionWorkspaceShared/);
  assert.match(runtimeSource, /if \(isReception\) return <ReceptionWorkspaceShared definition=\{definition\} \/>/);
  assert.doesNotMatch(runtimeSource, /getWorkspaceAdapter/);
  assert.doesNotMatch(runtimeSource, /GenericOperationalWorkspace/);
  assert.doesNotMatch(runtimeSource, /GovernancaWorkspace/);
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

test('roteador operacional reage às alterações salvas pela Fábrica e considera usuário, setores e hotel', () => {
  assert.match(appSource, /subscribeWorkspaceConfig/);
  assert.match(appSource, /setWorkspaceRevision\(current => current \+ 1\)/);
  assert.match(appSource, /resolveWorkspaceForUserAndSectors\(currentUser\?\.id, sectorIds, hotelId\)/);
});

test('Fábrica altera composição e persistência dispara atualização do runtime', () => {
  assert.match(editorSource, /updateWidget\(widget\.id, \{ enabled: widget\.enabled === false \}\)/);
  assert.match(editorSource, /widgets: selected\.widgets\.filter\(widget => widget\.id !== widgetId\)/);
  assert.match(editorSource, /widgets: widgets\.map\(\(widget, order\) => \(\{ \.\.\.widget, order: \(order \+ 1\) \* 10 \}\)\)/);
  assert.match(storeSource, /current\[definition\.id\] = normalized/);
  assert.match(storeSource, /window\.dispatchEvent\(new CustomEvent\(EVENT_NAME/);
});

test('F5 não substitui composição local mais nova por versão remota pendente', () => {
  assert.match(storeSource, /PENDING_SYNC_KEY/);
  assert.match(storeSource, /setPendingSync\(hotelId, definition\.id, true\)/);
  assert.match(storeSource, /workspaceDefinitionsEqual\(normalized, confirmedDefinition\)/);
  assert.match(storeSource, /setPendingSync\(hotelId, definition\.id, false\)/);
  assert.match(storeSource, /for \(const workspaceId of pendingIds\)/);
  assert.match(storeSource, /reconciled\[workspaceId\] = localOverrides\[workspaceId\]/);
});
