import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const preview = readFileSync('src/components/admin/WorkspacePreviewPanel.tsx', 'utf8');

test('editor Desktop legado foi removido fisicamente', () => {
  assert.equal(existsSync('src/components/admin/WorkspaceDesktopLayoutEditor.tsx'), false);
});

test('preview usa somente o editor visual centralizado', () => {
  assert.match(preview, /WorkspaceVisualEditorPresetBridge/);
  assert.doesNotMatch(preview, /WorkspaceDesktopLayoutEditor/);
  assert.doesNotMatch(preview, /WidgetDrivenWorkspace/);
  assert.doesNotMatch(preview, /workspace-engine\/presentation/);
});

test('preview mantém exatamente os quatro contextos oficiais', () => {
  assert.match(preview, /id: 'desktop'/);
  assert.match(preview, /id: 'tablet'/);
  assert.match(preview, /id: 'mobile'/);
  assert.match(preview, /id: 'kds'/);
});
