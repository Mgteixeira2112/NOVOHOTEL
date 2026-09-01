import assert from 'node:assert/strict';
import test from 'node:test';
import { createReceptionVisualPresentation } from '../src/workspace-engine/receptionVisualTemplate';
import { createWorkspaceDefinition } from '../src/workspace-engine/workspaceFactory';

const reception = createWorkspaceDefinition({
  id: 'workspace-template-recepcao-test',
  name: 'Recepção',
  sector: 'recepcao',
});

const visual = createReceptionVisualPresentation(reception.widgets);

test('Recepção visual: nasce com superfícies oficiais para os quatro dispositivos', () => {
  assert.deepEqual(Object.keys(visual.surfaces).sort(), ['desktop', 'kds', 'mobile', 'tablet']);
  for (const surface of Object.values(visual.surfaces)) {
    assert.ok(surface);
    assert.equal(surface.template?.backgroundAsset, '/workspace-templates/reception-classic.svg');
  }
});

test('Recepção visual: widget ocupa um único destino por superfície', () => {
  for (const surface of Object.values(visual.surfaces)) {
    assert.ok(surface);
    const sidebarIds = new Set(surface.sidebar.widgetIds);
    const shortcutIds = surface.shortcuts.map(shortcut => shortcut.widgetId);
    assert.equal(new Set(shortcutIds).size, shortcutIds.length);
    assert.equal(shortcutIds.some(id => sidebarIds.has(id)), false);
  }
});

test('Recepção visual Desktop: prioriza mapa de quartos, chegadas, saídas, alertas e Kanban', () => {
  const desktop = visual.surfaces.desktop;
  assert.ok(desktop);
  const types = new Set(desktop.shortcuts.map(shortcut => shortcut.widgetType));
  for (const type of ['room-map', 'arrivals', 'departures', 'alerts', 'task-kanban'] as const) {
    assert.equal(types.has(type), true, `${type} deve estar visível no canvas Desktop`);
  }
  assert.equal(desktop.shortcuts.find(shortcut => shortcut.widgetType === 'room-map')?.size, 'xl');
});

test('Recepção visual KDS: remove menu lateral e mantém somente apresentação operacional', () => {
  const kds = visual.surfaces.kds;
  assert.ok(kds);
  assert.equal(kds.sidebar.enabled, false);
  assert.deepEqual(kds.sidebar.widgetIds, []);
  assert.equal(kds.shortcuts.some(shortcut => shortcut.widgetType === 'room-map'), true);
});
