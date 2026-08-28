import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const editorSource = readFileSync(new URL('../src/components/admin/KanbanWidgetAutomationEditor.tsx', import.meta.url), 'utf8');
const workspaceSource = readFileSync(new URL('../src/components/admin/WorkspaceEditorModule.tsx', import.meta.url), 'utf8');

test('automação fica armazenada na configuração do próprio widget Kanban', () => {
  assert.match(editorSource, /widget\.settings\?\.kanbanAutomation/);
  assert.match(editorSource, /kanbanAutomation: \{ version: 1, rules \}/);
});

test('primeiro contrato é card criado para criar card em outro Kanban', () => {
  assert.match(editorSource, /KanbanAutomationEvent = 'card_created'/);
  assert.match(editorSource, /KanbanAutomationAction = 'create_card'/);
  assert.match(editorSource, /targetBoardId/);
});

test('protótipo bloqueia automação apontando para o próprio Kanban', () => {
  assert.match(editorSource, /rule\.action\.targetBoardId === widget\.boardId/);
  assert.match(editorSource, /origem e destino não podem ser o mesmo Kanban/);
});

test('editor aparece somente para o widget task-kanban', () => {
  assert.match(workspaceSource, /widget\.type === 'task-kanban'/);
  assert.match(workspaceSource, /<KanbanWidgetAutomationEditor/);
});

test('simulação não executa alteração real', () => {
  assert.match(editorSource, /Nenhuma alteração real foi executada/);
});
