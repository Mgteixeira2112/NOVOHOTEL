import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');

test('Widget Kanban usa permissões centrais antes de editar, mover, arquivar ou excluir', () => {
  assert.match(source, /canPerformKanbanAction\(actionAccessContext, 'edit', card\)/);
  assert.match(source, /canPerformKanbanAction\(actionAccessContext, 'move', card\)/);
  assert.match(source, /canPerformKanbanAction\(actionAccessContext, 'delete', card\)/);
  assert.match(source, /widget\.permissions\?\.edit !== false/);
  assert.match(source, /widget\.permissions\?\.move !== false/);
  assert.match(source, /widget\.permissions\?\.archive !== false/);
  assert.match(source, /widget\.permissions\?\.delete !== false/);
});

test('Widget Kanban persiste ações pelos serviços existentes', () => {
  assert.match(source, /kanbanCardGovernance\.updateCard\(/);
  assert.match(source, /kanbanCardGovernance\.moveCard\(/);
  assert.match(source, /kanbanCardGovernance\.softDeleteCard\(/);
  assert.match(source, /kanbanV2\.deleteCard\(card\.id\)/);
});

test('Widget Kanban mostra ações padrão no card', () => {
  assert.match(source, />Editar<\/button>/);
  assert.match(source, />Arquivar<\/button>/);
  assert.match(source, />Excluir<\/button>/);
  assert.match(source, /Editar Tarefa Operacional/);
  assert.match(source, /Salvar Card/);
});
