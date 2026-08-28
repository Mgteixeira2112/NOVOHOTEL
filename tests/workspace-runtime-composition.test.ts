import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtimeSource = readFileSync('src/workspace-engine/WorkspaceRuntime.tsx', 'utf8');
const canvasSource = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const catalogSource = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');

test('WorkspaceRuntime usa sempre o canvas dirigido pela composição de widgets', () => {
  assert.match(runtimeSource, /<WidgetDrivenWorkspace definition=\{definition\}/);
  assert.doesNotMatch(runtimeSource, /getWorkspaceAdapter/);
  assert.doesNotMatch(runtimeSource, /GenericOperationalWorkspace/);
  assert.doesNotMatch(runtimeSource, /GovernancaWorkspace/);
  assert.doesNotMatch(runtimeSource, /ReceptionWorkspaceShared/);
});

test('canvas renderiza somente widgets normalizados da definição recebida', () => {
  assert.match(canvasSource, /normalizeWorkspaceWidgets\(definition\.widgets\)/);
  assert.match(canvasSource, /widgets\.map\(widget =>/);
  assert.match(canvasSource, /data-widget-id=\{widget\.id\}/);
});

test('normalização exclui widgets desativados e preserva ordem configurada', () => {
  assert.match(catalogSource, /filter\(widget => widget\.enabled !== false\)/);
  assert.match(catalogSource, /sort\(\(a, b\) => \(a\.order \?\? 0\) - \(b\.order \?\? 0\)\)/);
});
