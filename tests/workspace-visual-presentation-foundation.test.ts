import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWorkspaceVisualSurface,
  getShortcutInformationLevel,
  normalizeWorkspaceRect,
  WORKSPACE_SHORTCUT_SIZES,
  WORKSPACE_VISUAL_VIEWPORTS,
} from '../src/workspace-engine/visualPresentation';

test('Workspace visual: existem somente Desktop, Tablet, Celular e KDS', () => {
  assert.deepEqual(WORKSPACE_VISUAL_VIEWPORTS, ['desktop', 'tablet', 'mobile', 'kds']);
});

test('Workspace visual: atalhos possuem somente quatro níveis de informação', () => {
  assert.deepEqual(WORKSPACE_SHORTCUT_SIZES, ['s', 'm', 'l', 'xl']);
  assert.equal(getShortcutInformationLevel('s'), 1);
  assert.equal(getShortcutInformationLevel('m'), 2);
  assert.equal(getShortcutInformationLevel('l'), 3);
  assert.equal(getShortcutInformationLevel('xl'), 4);
});

test('Workspace visual: posições são persistidas em coordenadas relativas e permanecem dentro do template', () => {
  assert.deepEqual(
    normalizeWorkspaceRect({ x: 94, y: -4, width: 20, height: 120 }),
    { x: 80, y: 0, width: 20, height: 100 },
  );
});

test('Workspace visual: toda superfície nasce com menu lateral esquerdo e sem duplicar widgets', () => {
  const surface = createWorkspaceVisualSurface('desktop');
  assert.equal(surface.viewport, 'desktop');
  assert.deepEqual(surface.shortcuts, []);
  assert.deepEqual(surface.sidebar, {
    enabled: true,
    anchor: 'left',
    rect: { x: 0, y: 0, width: 16, height: 100 },
    widgetIds: [],
  });
});
