import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { OFFICIAL_WORKSPACE_TEMPLATES } from '../src/workspace-engine/workspaceOfficialFactory';

const widgetSource = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');
const layoutSource = readFileSync('src/workspace-engine/widgets/taskKanbanLayout.css', 'utf8');
const mainSource = readFileSync('src/main.tsx', 'utf8');

test('Widget Kanban inicia em Meu setor', () => {
  assert.match(widgetSource, /useState<WorkspaceScope>\('sector'\)/);
  assert.doesNotMatch(widgetSource, /useState<WorkspaceScope>\(workspace\.defaultScope\)/);
});

test('Workspaces operacionais padrão usam escopo setor', () => {
  const operational = OFFICIAL_WORKSPACE_TEMPLATES.filter(workspace => workspace.layout === 'operational');
  assert.ok(operational.length > 0);
  assert.equal(operational.filter(workspace => workspace.defaultScope !== 'sector').length, 0);
});

test('card do Widget Kanban exibe o padrão operacional essencial', () => {
  assert.match(widgetSource, /priorityLabel\(card\.prioridade\)/);
  assert.match(widgetSource, /card\.descricao/);
  assert.match(widgetSource, /departmentLabel\(card\.departamento\)/);
  assert.match(widgetSource, /Quarto \{card\.room_number\}/);
  assert.match(widgetSource, /assignedName\(card\)/);
  assert.match(widgetSource, /Criado:/);
  assert.match(widgetSource, /Alterado:/);
});

test('layout do Kanban protege largura legível dos cards sem alterar o renderer funcional', () => {
  assert.match(mainSource, /taskKanbanLayout\.css/);
  assert.match(layoutSource, /data-workspace-widget="task-kanban"/);
  assert.match(layoutSource, /overflow-x: auto/);
  assert.match(layoutSource, /flex: 1 0 18rem/);
  assert.match(layoutSource, /min-width: 18rem/);
  assert.match(layoutSource, /word-break: normal/);
  assert.match(widgetSource, /lg:grid-cols-2 xl:grid-cols-4/);
});
