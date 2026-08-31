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
  assert.match(workspaceEditorSource, /Templates operacionais/);
  assert.match(workspaceEditorSource, /Templates de gestão/);
  assert.match(workspaceEditorSource, />Meus Workspaces</);
  assert.match(workspaceEditorSource, /loadWorkspaceOverrides\(hotelId\)/);
  assert.match(workspaceEditorSource, /persistedIds\.has\(definition\.id\)/);
});

test('Fábrica inclui Administrativo como gestão transversal sem criar setor', () => {
  assert.match(workspaceEditorSource, /createOfficialWorkspaceDefinition\('workspace-administrativo'\)/);
  assert.match(workspaceEditorSource, /workspace-template-administrativo/);
  assert.match(workspaceEditorSource, /Transversal • sem setor operacional/);
  assert.match(workspaceEditorSource, /selected\.layout === 'operational'/);
  assert.match(workspaceEditorSource, /Não possui setor nem board operacional/);
});

test('selecionar template gera somente prévia e criação exige ação explícita', () => {
  const selectTemplate = workspaceEditorSource.match(/const selectTemplate = \(templateId: string\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  const createFromTemplate = workspaceEditorSource.match(/const createFromTemplate = async \(\) => \{[\s\S]*?\n  \};/)?.[0] || '';
  assert.match(selectTemplate, /kind: 'template'/);
  assert.doesNotMatch(selectTemplate, /saveWorkspaceOverride|persistDefinition/);
  assert.match(workspaceEditorSource, /Criar Workspace deste template/);
  assert.match(createFromTemplate, /duplicateWorkspaceDefinition\(selected\)/);
  assert.match(createFromTemplate, /name: selected\.name/);
  assert.doesNotMatch(createFromTemplate, /createWorkspaceDefinition/);
  assert.match(createFromTemplate, /await persistDefinition\(created,/);
});
