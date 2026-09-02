import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const presets = readFileSync('src/workspace-engine/workspaceVisualPresets.ts', 'utf8');
const controls = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');
const preview = readFileSync('src/components/admin/WorkspacePreviewPanel.tsx', 'utf8');

test('Visual 3.0 possui contrato de superfície separado dos widgets', () => {
  assert.match(types, /WorkspaceBackgroundPresetId/);
  assert.match(types, /WorkspaceSurfacePresentation/);
  assert.match(types, /surface\?: WorkspaceSurfacePresentation/);
  assert.match(types, /backgroundPreset\?: WorkspaceBackgroundPresetId/);
});

test('biblioteca mantém fundos pré-carregados sem dependência externa', () => {
  for (const id of ['none', 'lobby', 'operations', 'finance', 'service']) {
    assert.match(presets, new RegExp(`id: '${id}'`));
  }
  assert.match(presets, /backgroundImage/);
  assert.doesNotMatch(presets, /https?:\/\//);
});

test('Fábrica simplifica a superfície para seleção de fundo e grade automática', () => {
  assert.match(controls, /data-workspace-surface-controls/);
  assert.match(controls, /WORKSPACE_BACKGROUND_PRESETS/);
  assert.match(controls, /backgroundPreset/);
  assert.match(controls, /widgets seguem uma grade automática/);
  assert.doesNotMatch(controls, /backgroundFit/);
  assert.doesNotMatch(controls, /backgroundPosition/);
  assert.doesNotMatch(controls, /minHeight/);
});

test('preview Desktop renderiza a superfície selecionada sem alterar o runtime funcional', () => {
  assert.match(preview, /workspaceSurfaceStyle\(definition\.presentation\?\.surface\)/);
  assert.match(preview, /data-workspace-preview-surface/);
  assert.match(preview, /<WorkspaceDesktopLayoutEditor definition=\{definition\} onChange=\{onChange\}/);
  assert.match(preview, /<WidgetDrivenWorkspace definition=\{definition\}/);
});
