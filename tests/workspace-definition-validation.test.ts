import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceDefinition } from '../src/workspace-engine/workspaceFactory';
import { validateWorkspaceDefinition } from '../src/workspace-engine/workspaceDefinitionValidation';

const reception = () => createWorkspaceDefinition({ id: 'workspace-validation', name: 'Recepção', sector: 'recepcao' });

test('Workspace definition validation accepts an official sector template', () => {
  const result = validateWorkspaceDefinition(reception());
  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
});

test('Workspace definition validation ignores disabled incompatible widgets but blocks active ones', () => {
  const definition = reception();
  definition.widgets.push({ id: 'kitchen-orders', type: 'orders', enabled: false });
  assert.equal(validateWorkspaceDefinition(definition).valid, true);

  definition.widgets[definition.widgets.length - 1].enabled = true;
  const result = validateWorkspaceDefinition(definition);
  assert.equal(result.valid, false);
  assert.equal(result.issues.some(issue => issue.code === 'incompatible-widget' && issue.widgetId === 'kitchen-orders'), true);
});

test('Workspace definition validation blocks duplicate widget ids', () => {
  const definition = reception();
  definition.widgets.push({ ...definition.widgets[0] });
  const result = validateWorkspaceDefinition(definition);
  assert.equal(result.valid, false);
  assert.equal(result.issues.some(issue => issue.code === 'duplicate-widget-id'), true);
});

test('Workspace definition validation blocks definitions without an operational sector', () => {
  const definition = reception();
  definition.sectors = [];
  const result = validateWorkspaceDefinition(definition);
  assert.equal(result.valid, false);
  assert.equal(result.issues.some(issue => issue.code === 'missing-sector'), true);
});
