import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workspaceEditorSource = readFileSync(new URL('../src/components/admin/WorkspaceEditorModule.tsx', import.meta.url), 'utf8');

test('Fábrica conecta disponibilidade do catálogo à interface', () => {
  assert.match(workspaceEditorSource, /getWidgetAvailability\(item\.type,\s*selectedSector\)/);
  assert.match(workspaceEditorSource, /disabled=\{!availability\.allowed\}/);
  assert.match(workspaceEditorSource, /addWidget[\s\S]*getWidgetAvailability\(type,\s*selectedSector\)/);
});

test('Fábrica exibe os três estados de maturidade operacional', () => {
  assert.match(workspaceEditorSource, /Pronto/);
  assert.match(workspaceEditorSource, /Requer configuração/);
  assert.match(workspaceEditorSource, /Em desenvolvimento/);
});

test('Fábrica bloqueia persistência enquanto houver widget ativo incompatível', () => {
  assert.match(workspaceEditorSource, /activeCompatibilityIssues/);
  assert.match(workspaceEditorSource, /const\s+saveBlocked\s*=\s*activeCompatibilityIssues\.length\s*>\s*0/);
  assert.match(workspaceEditorSource, /disabled=\{saving\s*\|\|\s*saveBlocked\}/);
});

test('Fábrica não oferece board conhecido de outro setor como combinação válida', () => {
  assert.match(workspaceEditorSource, /disabled=\{[a-zA-Z_$][\w$]*\.sector\s*!==\s*selectedSector\}/);
});

test('Fábrica separa Templates de Meus Workspaces persistidos', () => {
  assert.match(workspaceEditorSource, />Templates</);
  assert.match(workspaceEditorSource, />Meus Workspaces</);
  assert.match(workspaceEditorSource, /loadWorkspaceOverrides\(hotelId\)/);
  assert.match(workspaceEditorSource, /persistedIds\.has\(definition\.id\)/);
});

test('selecionar template gera somente prévia e criação exige ação explícita', () => {
  const selectTemplate = workspaceEditorSource.match(/const selectTemplate = \(templateId: string\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(selectTemplate, /kind: 'template'/);
  assert.doesNotMatch(selectTemplate, /saveWorkspaceOverride|persistDefinition/);
  assert.match(workspaceEditorSource, /const createFromTemplate = async \(\) =>/);
  assert.match(workspaceEditorSource, /Criar Workspace deste template/);
  assert.match(workspaceEditorSource, /createWorkspaceDefinition\(\{ name: selected\.name, sector: selectedSector \}\)/);
  assert.match(workspaceEditorSource, /await persistDefinition\(created,/);
});
