import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const editorSource = readFileSync(new URL('../src/components/admin/KanbanWidgetAutomationEditor.tsx', import.meta.url), 'utf8');
const workspaceSource = readFileSync(new URL('../src/components/admin/WorkspaceEditorModule.tsx', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('../src/workspace-engine/widgets/kanbanWidgetAutomation.ts', import.meta.url), 'utf8');
const presentationSource = readFileSync(new URL('../src/workspace-engine/widgets/kanbanWidgetPresentation.ts', import.meta.url), 'utf8');
const taskKanbanSource = readFileSync(new URL('../src/workspace-engine/widgets/TaskKanbanWidget.tsx', import.meta.url), 'utf8');

test('automação fica armazenada na configuração do próprio widget Kanban', () => {
  assert.match(runtimeSource, /widget\.settings\?\.kanbanAutomation/);
  assert.match(editorSource, /kanbanAutomation: \{ version: 1, rules \}/);
});

test('primeiro contrato é card criado para criar card em outro Kanban', () => {
  assert.match(runtimeSource, /KanbanAutomationEvent = 'card_created'/);
  assert.match(runtimeSource, /KanbanAutomationAction = 'create_card'/);
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

test('personalização do Kanban apresenta controles explícitos de configuração e automações', () => {
  assert.match(editorSource, /Personalização do Widget Kanban/);
  assert.match(editorSource, /> Configuração<\/button>/);
  assert.match(editorSource, /> Automações /);
  assert.match(editorSource, /Título exibido/);
  assert.match(editorSource, /Kanban utilizado/);
  assert.match(editorSource, /Nova automação/);
});

test('configuração lista colunas reais do Kanban para definir exibição no Workspace', () => {
  assert.match(editorSource, /kanbanV2\.load\(KANBAN_TENANT_ID\)/);
  assert.match(editorSource, /Colunas exibidas no Workspace/);
  assert.match(editorSource, /column\.board_id === widget\.boardId/);
  assert.match(editorSource, /visibleColumnIds/);
  assert.match(editorSource, /Exibir todas/);
});

test('apresentação do widget usa todas as colunas por padrão e aceita seleção vazia explícita', () => {
  assert.match(presentationSource, /undefined = configuração ainda não personalizada, portanto exibe todas as colunas/);
  assert.match(presentationSource, /\[\] = usuário escolheu não exibir nenhuma coluna/);
  assert.match(taskKanbanSource, /presentation\.visibleColumnIds === undefined\) return columns/);
  assert.match(taskKanbanSource, /columns\.filter\(column => allowed\.has\(column\.id\)\)/);
  assert.match(taskKanbanSource, /Nenhuma coluna foi selecionada para exibição neste Widget Kanban/);
});

test('movimentação do card oferece apenas colunas exibidas pelo widget', () => {
  assert.match(taskKanbanSource, /displayedColumns\.map\(item => <option/);
});

test('simulação não executa alteração real', () => {
  assert.match(editorSource, /Nenhuma alteração real foi executada/);
});
