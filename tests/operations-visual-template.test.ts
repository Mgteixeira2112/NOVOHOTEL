import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorkspaceDefinition } from '../src/workspace-engine/workspaceFactory';
import { createOperationsVisualPresentation } from '../src/workspace-engine/operationsVisualTemplate';

test('Operação Geral possui as quatro superfícies oficiais', () => {
  const definition = createWorkspaceDefinition({ id: 'workspace-operacao', name: 'Operação Geral', sector: 'operacao' });
  const presentation = createOperationsVisualPresentation(definition.widgets);
  assert.deepEqual(Object.keys(presentation.surfaces).sort(), ['desktop', 'kds', 'mobile', 'tablet']);
  Object.values(presentation.surfaces).forEach(surface => assert.equal(surface?.template?.backgroundAsset, '/workspace-templates/operations-overview.svg'));
});

test('Operação Geral reutiliza widgets existentes sem duplicar canvas e menu', () => {
  const definition = createWorkspaceDefinition({ id: 'workspace-operacao', name: 'Operação Geral', sector: 'operacao' });
  const presentation = createOperationsVisualPresentation(definition.widgets);
  Object.values(presentation.surfaces).forEach(surface => {
    if (!surface) return;
    const canvas = new Set(surface.shortcuts.map(item => item.widgetId));
    surface.sidebar.widgetIds.forEach(id => assert.equal(canvas.has(id), false));
  });
});

test('KDS da Operação Geral permanece sem menu lateral', () => {
  const definition = createWorkspaceDefinition({ id: 'workspace-operacao', name: 'Operação Geral', sector: 'operacao' });
  const kds = createOperationsVisualPresentation(definition.widgets).surfaces.kds!;
  assert.equal(kds.sidebar.enabled, false);
  assert.equal(kds.sidebar.widgetIds.length, 0);
  assert.ok(kds.shortcuts.some(item => item.widgetType === 'dashboard'));
  assert.ok(kds.shortcuts.some(item => item.widgetType === 'task-kanban'));
});
