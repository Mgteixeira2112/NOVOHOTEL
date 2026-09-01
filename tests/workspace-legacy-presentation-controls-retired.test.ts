import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('controles gerais legados não editam mais modos, cabeçalho ou KDS', () => {
  const source = read('src/components/admin/WorkspaceGeneralPresentationControls.tsx');
  assert.match(source, /presentation centralizada no editor visual/i);
  assert.doesNotMatch(source, /getWorkspaceDeviceMode/);
  assert.doesNotMatch(source, /updateDeviceMode/);
  assert.doesNotMatch(source, /updateHeader/);
  assert.doesNotMatch(source, /updateKds/);
  assert.doesNotMatch(source, /<select/);
});

test('controles de apresentação por widget não alteram mais geometria ou overrides', () => {
  const source = read('src/components/admin/WorkspaceWidgetPresentationControls.tsx');
  assert.match(source, /Apresentação pelo canvas/);
  assert.doesNotMatch(source, /normalizeWidgetPresentation/);
  assert.doesNotMatch(source, /updateBase/);
  assert.doesNotMatch(source, /updateDevice/);
  assert.doesNotMatch(source, /<select/);
  assert.doesNotMatch(source, /type="number"/);
});
