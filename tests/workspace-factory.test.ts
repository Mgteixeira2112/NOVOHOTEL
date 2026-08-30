import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceDefinition, duplicateWorkspaceDefinition, setWorkspaceSectorAndBoard } from '../src/workspace-engine/workspaceFactory';

test('workspace factory creates a routed operational definition', () => {
  const workspace = createWorkspaceDefinition({ name: 'Recepção Noite', sector: 'recepcao', id: 'workspace-test' });
  assert.equal(workspace.id, 'workspace-test');
  assert.deepEqual(workspace.sectors, ['recepcao']);
  assert.equal(workspace.widgets.find(widget => widget.type === 'task-kanban')?.boardId, 'kanban-board-recepcao');
  assert.equal(workspace.widgets.some(widget => ['kanban-cards', 'rooms-list', 'checkins'].includes(widget.type)), false);
});

test('workspace factory cria composição própria para manutenção', () => {
  const workspace = createWorkspaceDefinition({ name: 'Manutenção', sector: 'manutencao', id: 'workspace-maintenance' });
  assert.deepEqual(workspace.sectors, ['manutencao']);
  assert.equal(workspace.widgets.find(widget => widget.type === 'maintenance')?.boardId, 'kanban-board-manutencao');
  assert.equal(workspace.widgets.some(widget => widget.type === 'quick-actions' && widget.enabled !== false), true);
  assert.equal(workspace.widgets.some(widget => widget.type === 'room-map' && widget.enabled !== false), true);
  assert.equal(workspace.widgets.some(widget => widget.type === 'room-details' && widget.enabled !== false), true);
  assert.equal(workspace.widgets.some(widget => widget.type === 'arrivals' || widget.type === 'departures'), false);
});

test('trocar um workspace para manutenção aplica o modelo setorial uma única vez', () => {
  const base = createWorkspaceDefinition({ name: 'Teste', sector: 'recepcao', id: 'workspace-test-2' });
  const moved = setWorkspaceSectorAndBoard(base, 'manutencao', 'kanban-board-manutencao');
  assert.deepEqual(moved.sectors, ['manutencao']);
  assert.equal(moved.widgets.find(widget => widget.type === 'maintenance')?.boardId, 'kanban-board-manutencao');
  assert.equal(moved.widgets.some(widget => widget.type === 'arrivals' || widget.type === 'departures'), false);

  const customized = { ...moved, widgets: moved.widgets.map(widget => widget.type === 'alerts' ? { ...widget, title: 'Alertas customizados' } : widget) };
  const boardChanged = setWorkspaceSectorAndBoard(customized, 'manutencao', 'kanban-board-manutencao');
  assert.equal(boardChanged.widgets.find(widget => widget.type === 'alerts')?.title, 'Alertas customizados');
});

test('duplicate workspace generates independent ids', () => {
  const base = createWorkspaceDefinition({ name: 'Cozinha', sector: 'cozinha', id: 'workspace-original' });
  const copy = duplicateWorkspaceDefinition(base);
  assert.notEqual(copy.id, base.id);
  assert.equal(copy.name, 'Cozinha — Cópia');
  assert.equal(copy.widgets.length, base.widgets.length);
  assert.notEqual(copy.widgets[0].id, base.widgets[0].id);
});
