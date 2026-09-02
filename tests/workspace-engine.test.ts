import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceRegistry } from '../src/workspace-engine/registry';
import { canonicalWidgetType, createWorkspaceWidget, getWidgetAvailability, getWidgetCatalogItem, normalizeWorkspaceWidgets, workspaceWidgetCatalog } from '../src/workspace-engine/widgetCatalog';
import { validateWorkspaceDefinition } from '../src/workspace-engine/validation';

test('normaliza widgets por ordem e preserva widgets desativados na definição', () => {
  const widgets = normalizeWorkspaceWidgets([
    { id: 'b', type: 'alerts', order: 20 },
    { id: 'a', type: 'quick-actions', order: 10 },
    { id: 'c', type: 'metrics', boardId: 'board-1', enabled: false, order: 30 },
  ]);

  assert.deepEqual(widgets.map(widget => widget.id), ['a', 'b', 'c']);
  assert.equal(widgets[0].span, 2);
  assert.deepEqual(widgets[0].permissions, { view: true });
  assert.equal(widgets[2].enabled, false);
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

test('biblioteca classifica disponibilidade e maturidade sem limitar composição por setor', () => {
  assert.deepEqual(getWidgetAvailability('task-kanban', 'cozinha'), { allowed: true, readiness: 'ready', reason: '' });
  assert.equal(getWidgetAvailability('room-map', 'cozinha').allowed, true);
  assert.equal(getWidgetAvailability('arrivals', 'recepcao').allowed, true);
  assert.equal(getWidgetAvailability('arrivals', 'governanca').allowed, true);
  assert.deepEqual(getWidgetAvailability('orders', 'cozinha'), {
    allowed: false,
    readiness: 'planned',
    reason: 'Fora do Workspace 1.0: não existe renderer operacional consolidado e nenhum motor novo será criado aqui.',
  });
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
