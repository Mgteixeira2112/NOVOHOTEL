import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateWorkspaceDefinitionToCanonicalWidgets, workspaceUsesOnlyCanonicalWidgets } from '../src/workspace-engine/workspaceMigration';
import { WorkspaceDefinition } from '../src/workspace-engine/types';

const legacyWorkspace: WorkspaceDefinition = {
  id: 'workspace-recepcao-test',
  name: 'Recepção',
  description: 'Teste',
  sectors: ['recepcao'],
  layout: 'operational',
  defaultScope: 'sector',
  widgets: [
    { id: 'rooms', type: 'rooms-list', order: 10, span: 'full' },
    { id: 'checkins', type: 'checkins', order: 20, span: 'full' },
    { id: 'tasks', type: 'kanban-cards', boardId: 'kanban-board-recepcao', order: 30, span: 'full' },
  ],
};

test('migração converte widgets legados sem alterar o workspace de origem', () => {
  const result = migrateWorkspaceDefinitionToCanonicalWidgets(legacyWorkspace);
  assert.equal(workspaceUsesOnlyCanonicalWidgets(legacyWorkspace), false);
  assert.equal(workspaceUsesOnlyCanonicalWidgets(result.definition), true);
  assert.deepEqual(result.legacyWidgetIds, ['rooms', 'checkins', 'tasks']);
  assert.equal(legacyWorkspace.widgets[0].type, 'rooms-list');
});

test('checkins legado se torna dois widgets independentes de chegada e saída', () => {
  const result = migrateWorkspaceDefinitionToCanonicalWidgets(legacyWorkspace);
  const types = result.definition.widgets.map(widget => widget.type);
  assert.ok(types.includes('arrivals'));
  assert.ok(types.includes('departures'));
  assert.ok(types.includes('room-map'));
  assert.ok(types.includes('task-kanban'));
});

test('migração preserva board do kanban de tarefas', () => {
  const result = migrateWorkspaceDefinitionToCanonicalWidgets(legacyWorkspace);
  const kanban = result.definition.widgets.find(widget => widget.type === 'task-kanban');
  assert.equal(kanban?.boardId, 'kanban-board-recepcao');
});
