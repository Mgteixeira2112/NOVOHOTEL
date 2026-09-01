import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWorkspaceVisualSurface,
  getWorkspaceVisualSurface,
  placeWidgetAsShortcut,
  placeWidgetInSidebar,
  removeWidgetFromVisualSurface,
  setWorkspaceVisualSurface,
} from '../src/workspace-engine/visualPresentation';
import type { WorkspaceWidgetDefinition } from '../src/workspace-engine/types';

const widget: WorkspaceWidgetDefinition = {
  id: 'widget-room-map',
  type: 'room-map',
  title: 'Mapa de Quartos',
};

test('Workspace visual: cada dispositivo mantém sua própria superfície', () => {
  const desktop = createWorkspaceVisualSurface('desktop');
  const mobile = createWorkspaceVisualSurface('mobile');
  const presentation = setWorkspaceVisualSurface(setWorkspaceVisualSurface(undefined, desktop), mobile);

  assert.equal(getWorkspaceVisualSurface(presentation, 'desktop').viewport, 'desktop');
  assert.equal(getWorkspaceVisualSurface(presentation, 'mobile').viewport, 'mobile');
  assert.notEqual(getWorkspaceVisualSurface(presentation, 'desktop'), getWorkspaceVisualSurface(presentation, 'mobile'));
});

test('Workspace visual: mover widget entre canvas e menu nunca duplica destino', () => {
  let surface = createWorkspaceVisualSurface('desktop');
  surface = placeWidgetAsShortcut(surface, widget);
  assert.equal(surface.shortcuts.filter(item => item.widgetId === widget.id).length, 1);
  assert.equal(surface.sidebar.widgetIds.includes(widget.id), false);

  surface = placeWidgetInSidebar(surface, widget.id);
  assert.equal(surface.shortcuts.some(item => item.widgetId === widget.id), false);
  assert.deepEqual(surface.sidebar.widgetIds, [widget.id]);

  surface = placeWidgetAsShortcut(surface, widget);
  assert.equal(surface.shortcuts.filter(item => item.widgetId === widget.id).length, 1);
  assert.equal(surface.sidebar.widgetIds.includes(widget.id), false);
});

test('Workspace visual: remover widget limpa canvas e menu', () => {
  let surface = placeWidgetInSidebar(createWorkspaceVisualSurface('kds'), widget.id);
  surface = removeWidgetFromVisualSurface(surface, widget.id);
  assert.deepEqual(surface.shortcuts, []);
  assert.deepEqual(surface.sidebar.widgetIds, []);
});

test('Workspace visual: novo atalho usa geometria relativa e tamanho semântico M', () => {
  const surface = placeWidgetAsShortcut(createWorkspaceVisualSurface('tablet'), widget);
  const shortcut = surface.shortcuts[0];
  assert.equal(shortcut.size, 'm');
  assert.ok(shortcut.rect.x >= 0 && shortcut.rect.x <= 100);
  assert.ok(shortcut.rect.y >= 0 && shortcut.rect.y <= 100);
  assert.ok(shortcut.rect.width > 0 && shortcut.rect.width <= 100);
  assert.ok(shortcut.rect.height > 0 && shortcut.rect.height <= 100);
});
