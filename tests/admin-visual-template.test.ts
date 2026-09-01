import assert from 'node:assert/strict';
import test from 'node:test';
import { createOfficialWorkspaceDefinition } from '../src/workspace-engine/workspaceOfficialFactory';
import { createAdminVisualPresentation } from '../src/workspace-engine/adminVisualTemplate';

test('Administrativo possui quatro superfícies oficiais', () => {
  const definition = createOfficialWorkspaceDefinition('workspace-administrativo');
  const presentation = createAdminVisualPresentation(definition.widgets);
  assert.deepEqual(Object.keys(presentation.surfaces).sort(), ['desktop', 'kds', 'mobile', 'tablet']);
  Object.values(presentation.surfaces).forEach(surface => assert.equal(surface?.template?.backgroundAsset, '/workspace-templates/admin-management.svg'));
});

test('Administrativo continua transversal e sem setor operacional inventado', () => {
  const definition = createOfficialWorkspaceDefinition('workspace-administrativo');
  assert.equal(definition.layout, 'management');
  assert.deepEqual(definition.sectors, []);
});

test('preset administrativo reutiliza somente widgets existentes', () => {
  const definition = createOfficialWorkspaceDefinition('workspace-administrativo');
  const presentation = createAdminVisualPresentation(definition.widgets);
  const ids = new Set(definition.widgets.map(widget => widget.id));
  Object.values(presentation.surfaces).forEach(surface => {
    if (!surface) return;
    surface.shortcuts.forEach(item => assert.equal(ids.has(item.widgetId), true));
    surface.sidebar.widgetIds.forEach(id => assert.equal(ids.has(id), true));
  });
});

test('KDS administrativo não cria navegação lateral paralela', () => {
  const definition = createOfficialWorkspaceDefinition('workspace-administrativo');
  const kds = createAdminVisualPresentation(definition.widgets).surfaces.kds!;
  assert.equal(kds.sidebar.enabled, false);
  assert.equal(kds.sidebar.widgetIds.length, 0);
});
