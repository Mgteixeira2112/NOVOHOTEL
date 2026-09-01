import assert from 'node:assert/strict';
import test from 'node:test';
import {
  desktopSpatialMinHeight,
  desktopSpatialStyle,
  desktopWidthPercent,
  hasDesktopSpatialPosition,
} from '../src/workspace-engine/workspaceSpatialRuntime';
import type { WorkspaceWidgetDefinition } from '../src/workspace-engine/types';

const widget = (x?: number, y?: number): WorkspaceWidgetDefinition => ({
  id: 'teste',
  type: 'metrics',
  presentation: { desktop: { mode: 'custom', x, y } },
});

test('posição espacial exige x e y no override Desktop', () => {
  assert.equal(hasDesktopSpatialPosition(widget(20, 100)), true);
  assert.equal(hasDesktopSpatialPosition(widget(20)), false);
  assert.equal(hasDesktopSpatialPosition(widget(undefined, 100)), false);
});

test('larguras do editor viram percentuais estáveis no runtime', () => {
  assert.equal(desktopWidthPercent('small'), 25);
  assert.equal(desktopWidthPercent('medium'), 50);
  assert.equal(desktopWidthPercent('large'), 75);
  assert.equal(desktopWidthPercent('full'), 100);
});

test('estilo espacial limita x para não ultrapassar a superfície', () => {
  assert.deepEqual(desktopSpatialStyle(widget(90, 140), 'medium'), {
    position: 'absolute',
    left: '50%',
    top: '140px',
    width: '50%',
  });
  assert.equal(desktopSpatialStyle(widget(), 'small'), undefined);
});

test('altura espacial cresce para acomodar widgets posicionados abaixo', () => {
  assert.equal(desktopSpatialMinHeight([widget(10, 900)], 720), 1220);
  assert.equal(desktopSpatialMinHeight([widget(10, 50)], 720), 720);
  assert.equal(desktopSpatialMinHeight([], 300), 480);
});
