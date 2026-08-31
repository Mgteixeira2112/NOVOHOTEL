import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceDefinition, duplicateWorkspaceDefinition, setWorkspaceSectorAndBoard } from '../src/workspace-engine/workspaceFactory';

const activeTypes = (workspace: ReturnType<typeof createWorkspaceDefinition>) =>
  workspace.widgets.filter(widget => widget.enabled !== false).map(widget => widget.type);

test('workspace factory creates a routed operational definition', () => {
  const workspace = createWorkspaceDefinition({ name: 'Recepção Noite', sector: 'recepcao', id: 'workspace-test' });
  assert.equal(workspace.id, 'workspace-test');
  assert.deepEqual(workspace.sectors, ['recepcao']);
  assert.equal(workspace.widgets.find(widget => widget.type === 'task-kanban')?.boardId, 'kanban-board-recepcao');
  assert.equal(workspace.widgets.some(widget => ['kanban-cards', 'rooms-list', 'checkins'].includes(widget.type)), false);
});

test('todos os setores oficiais nascem com composição própria, ações rápidas e equipe', () => {
  const expected: Record<string, string[]> = {
    operacao: ['quick-actions', 'metrics', 'dashboard', 'task-kanban', 'alerts', 'frigobar', 'team'],
    recepcao: ['quick-actions', 'metrics', 'arrivals', 'departures', 'alerts', 'room-map', 'task-kanban', 'team'],
    governanca: ['quick-actions', 'metrics', 'room-map', 'room-details', 'task-kanban', 'frigobar', 'alerts', 'team'],
    manutencao: ['quick-actions', 'metrics', 'maintenance', 'room-map', 'room-details', 'alerts', 'team'],
    cozinha: ['quick-actions', 'metrics', 'task-kanban', 'dashboard', 'alerts', 'team'],
  };

  for (const [sector, types] of Object.entries(expected)) {
    const workspace = createWorkspaceDefinition({ name: sector, sector: sector as any, id: `workspace-${sector}` });
    assert.deepEqual(activeTypes(workspace), types, `template divergente: ${sector}`);
    assert.equal(workspace.widgets.some(widget => widget.type === 'orders' || widget.type === 'shortcuts'), false);
  }
});

test('workspace factory cria composição própria e restritiva para manutenção', () => {
  const workspace = createWorkspaceDefinition({ name: 'Manutenção', sector: 'manutencao', id: 'workspace-maintenance' });
  assert.deepEqual(workspace.sectors, ['manutencao']);
  assert.equal(workspace.widgets.find(widget => widget.type === 'maintenance')?.boardId, 'kanban-board-manutencao');
  const roomMap = workspace.widgets.find(widget => widget.type === 'room-map');
  assert.equal(roomMap?.actions?.checkin, false);
  assert.equal(roomMap?.actions?.checkout, false);
  assert.equal(roomMap?.actions?.transferRoom, false);
  assert.equal(workspace.widgets.some(widget => widget.type === 'arrivals' || widget.type === 'departures'), false);
});

test('governança usa board próprio e mapa sem ações de recepção', () => {
  const workspace = createWorkspaceDefinition({ name: 'Governança', sector: 'governanca', id: 'workspace-governanca' });
  assert.equal(workspace.widgets.find(widget => widget.type === 'task-kanban')?.boardId, 'kanban-board-governanca');
  const roomMap = workspace.widgets.find(widget => widget.type === 'room-map');
  assert.equal(roomMap?.actions?.checkin, false);
  assert.equal(roomMap?.actions?.checkout, false);
  assert.equal(roomMap?.actions?.requestMaintenance, true);
});

test('cozinha permanece sem Pedidos enquanto o contrato está planned', () => {
  const workspace = createWorkspaceDefinition({ name: 'Cozinha', sector: 'cozinha', id: 'workspace-cozinha' });
  assert.equal(workspace.widgets.find(widget => widget.type === 'task-kanban')?.boardId, 'kanban-board-cozinha');
  assert.equal(workspace.widgets.some(widget => widget.type === 'orders'), false);
});

test('trocar de setor aplica o template do destino e remove composição incompatível', () => {
  const base = createWorkspaceDefinition({ name: 'Teste', sector: 'recepcao', id: 'workspace-test-2' });
  const moved = setWorkspaceSectorAndBoard(base, 'manutencao', 'kanban-board-manutencao');
  assert.deepEqual(moved.sectors, ['manutencao']);
  assert.equal(moved.widgets.find(widget => widget.type === 'maintenance')?.boardId, 'kanban-board-manutencao');
  assert.equal(moved.widgets.some(widget => widget.type === 'arrivals' || widget.type === 'departures'), false);
});

test('alterar o board no mesmo setor preserva personalizações', () => {
  const base = createWorkspaceDefinition({ name: 'Manutenção', sector: 'manutencao', id: 'workspace-customized' });
  const customized = { ...base, widgets: base.widgets.map(widget => widget.type === 'alerts' ? { ...widget, title: 'Alertas customizados' } : widget) };
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
