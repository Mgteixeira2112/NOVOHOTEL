import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widget = readFileSync('src/workspace-engine/widgets/MaintenanceWidget.tsx', 'utf8');
const quickActions = readFileSync('src/workspace-engine/widgets/QuickActionsWidget.tsx', 'utf8');
const registry = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');

test('manutenção reutiliza o Kanban operacional existente em vez de criar motor paralelo', () => {
  assert.match(widget, /TaskKanbanWidget/);
  assert.match(widget, /kanban-board-manutencao/);
  assert.doesNotMatch(widget, /supabase\.|kanbanV2\.|roomLifecycleEngine|createCard|insert\(/);
});

test('ações rápidas da manutenção apontam para o renderer setorial dedicado', () => {
  assert.match(quickActions, /manutencao: \[/);
  assert.match(quickActions, /type: 'maintenance'/);
});

test('renderer de manutenção está registrado no runtime', () => {
  assert.match(registry, /registerWorkspaceWidgetRenderer\('maintenance', MaintenanceWidget\)/);
});
