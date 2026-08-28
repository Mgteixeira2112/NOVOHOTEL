import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceRegistry } from '../src/workspace-engine/registry';
import { normalizeWorkspaceWidgets } from '../src/workspace-engine/widgetCatalog';
import { validateWorkspaceDefinition } from '../src/workspace-engine/validation';

test('normaliza widgets por ordem e remove widgets desativados', () => {
  const widgets = normalizeWorkspaceWidgets([
    { id: 'b', type: 'alerts', order: 20 },
    { id: 'a', type: 'quick-actions', order: 10 },
    { id: 'c', type: 'metrics', boardId: 'board-1', enabled: false },
  ]);

  assert.deepEqual(widgets.map(widget => widget.id), ['a', 'b']);
  assert.equal(widgets[0].span, 2);
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
    widgets: [{ id: 'kanban', type: 'kanban-cards' }],
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /boardId/);
});
