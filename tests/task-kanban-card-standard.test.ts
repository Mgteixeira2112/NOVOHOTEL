import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widgetSource = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');
const registrySource = readFileSync('src/workspace-engine/registry.ts', 'utf8');

test('Widget Kanban inicia em Meu setor', () => {
  assert.match(widgetSource, /useState<WorkspaceScope>\('sector'\)/);
  assert.doesNotMatch(widgetSource, /useState<WorkspaceScope>\(workspace\.defaultScope\)/);
});

test('Workspaces operacionais padrão usam escopo setor', () => {
  const mineDefaults = registrySource.match(/defaultScope:\s*'mine'/g) || [];
  assert.equal(mineDefaults.length, 0);
  assert.match(registrySource, /defaultScope:\s*'sector'/);
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
