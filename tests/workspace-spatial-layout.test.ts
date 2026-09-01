import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceDesktopLayoutEditor.tsx', 'utf8');

test('coordenadas livres pertencem somente ao contrato de apresentação por dispositivo', () => {
  assert.match(types, /interface WorkspaceWidgetDevicePresentation[\s\S]*x\?: number;[\s\S]*y\?: number;/);
  assert.doesNotMatch(types, /interface WorkspaceWidgetDefinition[\s\S]*\n  x\?: number;/);
});

test('editor Desktop persiste e remove coordenadas sem alterar Mobile ou KDS', () => {
  assert.match(editor, /updateDesktopOverride\(widgetId, \{[\s\S]*x:/);
  assert.match(editor, /const \{ x: _x, y: _y, \.\.\.desktopWithoutPosition \} = current/);
  assert.match(editor, /data-workspace-spatial-editor/);
  assert.match(editor, /data-workspace-layout-move/);
  assert.match(editor, /presentation\.desktop/);
  assert.doesNotMatch(editor, /presentation\.mobile[^\n]*x|presentation\.kds[^\n]*x/);
});

test('widgets sem coordenadas continuam no fluxo automático existente', () => {
  assert.match(editor, /const spatial = typeof desktop\?\.x === 'number' && typeof desktop\?\.y === 'number'/);
  assert.match(editor, /const left = spatial \?/);
  assert.match(editor, /const top = spatial \?/);
  assert.match(editor, /Voltar ao fluxo/);
});
