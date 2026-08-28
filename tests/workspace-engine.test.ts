import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceRegistry } from '../src/workspace-engine/registry';
import { canonicalWidgetType, createWorkspaceWidget, getWidgetCatalogItem, normalizeWorkspaceWidgets, workspaceWidgetCatalog } from '../src/workspace-engine/widgetCatalog';
import { validateWorkspaceDefinition } from '../src/workspace-engine/validation';

test('normaliza widgets por ordem e remove widgets desativados', () => {
  const widgets = normalizeWorkspaceWidgets([
    { id: 'b', type: 'alerts', order: 20 },
    { id: 'a', type: 'quick-actions', order: 10 },
    { id: 'c', type: 'metrics', boardId: 'board-1', enabled: false },
  ]);

  assert.deepEqual(widgets.map(widget => widget.id), ['a', 'b']);
  assert.equal(widgets[0].span, 2);
  assert.deepEqual(widgets[0].permissions, { view: true });
});

test('biblioteca visível registra apenas widgets canônicos para compor workspaces operacionais', () => {
  const types = workspaceWidgetCatalog.map(item => item.type);
  for (const required of [
    'metrics', 'task-kanban', 'room-map', 'room-details', 'arrivals', 'departures',
    'alerts', 'quick-actions', 'reservations-list', 'maintenance', 'orders', 'team', 'shortcuts',
  ]) assert.ok(types.includes(required as any), `widget canônico ausente: ${required}`);

  for (const legacy of ['kanban-cards', 'rooms-list', 'checkins']) {
    assert.equal(types.includes(legacy as any), false, `widget legado não deve aparecer na Fábrica: ${legacy}`);
    assert.equal(getWidgetCatalogItem(legacy as any)?.legacy, true, `compatibilidade interna ausente: ${legacy}`);
  }
});

test('aliases legados resolvem para widgets canônicos durante a migração', () => {
  assert.equal(canonicalWidgetType('kanban-cards'), 'task-kanban');
  assert.equal(canonicalWidgetType('rooms-list'), 'room-map');
  assert.equal(canonicalWidgetType('alerts'), 'alerts');
});

test('cria widget de biblioteca com contrato completo e board quando obrigatório', () => {
  const widget = createWorkspaceWidget('task-kanban', { boardId: 'board-1', order: 70 });
  assert.match(widget.id, /^widget-task-kanban-/);
  assert.equal(widget.boardId, 'board-1');
  assert.equal(widget.order, 70);
  assert.equal(widget.enabled, true);
  assert.equal(widget.dataSource, 'kanban');
  assert.deepEqual(widget.permissions, { view: true });
});

test('Fábrica rejeita criação direta de aliases legados', () => {
  assert.throws(() => createWorkspaceWidget('kanban-cards', { boardId: 'board-1' }), /legado/);
  assert.throws(() => createWorkspaceWidget('rooms-list'), /legado/);
  assert.throws(() => createWorkspaceWidget('checkins'), /legado/);
});

test('workspace de governança é uma definição declarativa válida', () => {
  const workspace = workspaceRegistry.find(item => item.id === 'workspace-governanca');
  assert.ok(workspace);
  const result = validateWorkspaceDefinition(workspace);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejeita widget que exige board sem boardId', () => {
  const result = validateWorkspaceDefinition({
    id: 'workspace-teste',
    name: 'Teste',
    description: '',
    sectors: ['governanca'],
    layout: 'operational',
    defaultScope: 'mine',
    widgets: [{ id: 'kanban', type: 'task-kanban' }],
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /boardId/);
});
