import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const catalog = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const register = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');
const widget = readFileSync('src/workspace-engine/widgets/FrigobarWidget.tsx', 'utf8');

test('Frigobar é widget oficial do Workspace com fonte própria', () => {
  assert.match(types, /\| 'frigobar'/);
  assert.match(types, /WorkspaceWidgetDataSource =[\s\S]*\| 'frigobar'/);
  assert.match(catalog, /type: 'frigobar'/);
  assert.match(catalog, /defaultDataSource: 'frigobar'/);
  assert.match(register, /registerWorkspaceWidgetRenderer\('frigobar', FrigobarWidget\)/);
});

test('widget Frigobar usa exclusivamente o Frigobar Core para operações', () => {
  assert.match(widget, /frigobarCore\.getRoomSnapshot/);
  assert.match(widget, /frigobarCore\.listRestockSources/);
  assert.match(widget, /frigobarCore\.registerConsumption/);
  assert.match(widget, /frigobarCore\.restock/);
  assert.doesNotMatch(widget, /supabase\./);
  assert.doesNotMatch(widget, /localStorage|mockFrigobarData|addConsumoToReservation/);
});

test('consumo e reposição respeitam hospedagem ativa, idempotência e permissões do widget', () => {
  assert.match(widget, /status === 'checkin_realizado'/);
  assert.match(widget, /idempotencyKey: operationKey\('workspace-minibar-consume'\)/);
  assert.match(widget, /idempotencyKey: operationKey\('workspace-minibar-restock'\)/);
  assert.match(widget, /widget\.actions\?\.consumeMinibar !== false/);
  assert.match(widget, /widget\.actions\?\.restockMinibar !== false/);
  assert.match(widget, /widget\.permissions\?\.edit !== false/);
});
