import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(process.cwd(), 'src/components/admin/WorkspacePreviewPanel.tsx'), 'utf8');

test('Preview da Fábrica usa somente o editor visual', () => {
  assert.match(source, /WorkspaceVisualEditorPresetBridge/);
  assert.doesNotMatch(source, /WidgetDrivenWorkspace/);
  assert.doesNotMatch(source, /runtime-fallback/);
  assert.doesNotMatch(source, /Runtime atual/);
});

test('Preview mantém apenas os quatro contextos oficiais', () => {
  for (const viewport of ['desktop', 'tablet', 'mobile', 'kds']) assert.match(source, new RegExp(`id: '${viewport}'`));
  assert.doesNotMatch(source, /forcedViewport/);
  assert.doesNotMatch(source, /previewMode/);
});
