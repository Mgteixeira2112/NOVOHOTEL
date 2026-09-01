import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const editor = readFileSync('src/components/admin/WorkspaceDesktopLayoutEditor.tsx', 'utf8');
const general = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');
const preview = readFileSync('src/components/admin/WorkspacePreviewPanel.tsx', 'utf8');
const widgetPresentation = readFileSync('src/components/admin/WorkspaceWidgetPresentationControls.tsx', 'utf8');
const editorModule = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');
const configStore = readFileSync('src/workspace-engine/workspaceConfigStore.ts', 'utf8');
const widgetCatalog = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');

test('editor visual Desktop usa somente ordem e largura já existentes no contrato', () => {
  assert.match(editor, /a\.order \?\? 0.*b\.order \?\? 0/);
  assert.match(editor, /presentation: \{ \.\.\.widget\.presentation, width \}/);
  assert.match(editor, /legacySpanToWidth\(widget\.span\)/);
  assert.doesNotMatch(editor, /supabase|migration|localStorage|fetch\(/i);
});

test('editor Desktop renderiza o próprio runtime e mede os widgets reais', () => {
  assert.match(editor, /import \{ WidgetDrivenWorkspace \}/);
  assert.match(editor, /<WidgetDrivenWorkspace definition=\{definition\} forcedViewport="desktop" previewMode \/>/);
  assert.match(editor, /data-workspace-layout-runtime/);
  assert.match(editor, /querySelectorAll<HTMLElement>\('\[data-widget-id\]'\)/);
  assert.match(editor, /ResizeObserver/);
  assert.match(editor, /data-workspace-layout-overlay/);
  assert.doesNotMatch(editor, /col-span-3|col-span-6|col-span-9|col-span-12/);
});

test('composição Desktop permite reordenar por arraste sobre o runtime sem alterar renderers', () => {
  assert.match(editor, /draggable/);
  assert.match(editor, /onDragStart/);
  assert.match(editor, /onDrop/);
  assert.match(editor, /next\.splice\(sourceIndex, 1\)/);
  assert.match(editor, /order: \(index \+ 1\) \* 10/);
  assert.match(editor, /pointer-events-none select-none/);
});

test('largura é ajustada pela alça horizontal em passos 25 50 75 100', () => {
  assert.match(editor, /data-workspace-layout-resize/);
  assert.match(editor, /pointermove/);
  assert.match(editor, /cursor-ew-resize/);
  assert.match(editor, /small.*medium.*large.*full/s);
  assert.match(editor, /25%/);
  assert.match(editor, /50%/);
  assert.match(editor, /75%/);
  assert.match(editor, /100%/);
  assert.match(editor, /canvasWidth \/ 12 \* 3/);
});

test('editor Desktop vive no preview e não fica duplicado na aparência geral', () => {
  assert.match(preview, /WorkspaceDesktopLayoutEditor/);
  assert.match(preview, /editingDesktop/);
  assert.match(preview, /data-workspace-preview-desktop-editor/);
  assert.match(preview, /<WorkspaceDesktopLayoutEditor definition=\{definition\} onChange=\{onChange\} \/>/);
  assert.doesNotMatch(general, /WorkspaceDesktopLayoutEditor/);
  assert.match(editorModule, /<WorkspacePreviewPanel definition=\{selected\} onChange=\{updateSelected\} \/>/);
  assert.match(editor, /Esta é a renderização real do Workspace/);
});

test('configuração comum pode editar largura sem criar um segundo editor Desktop', () => {
  assert.doesNotMatch(widgetPresentation, /data-widget-desktop-customization/);
  assert.match(widgetPresentation, />LARGURA<select/);
  assert.match(widgetPresentation, /Base visual compartilhada pelas estratégias/);
  assert.match(widgetPresentation, /data-widget-mobile-customization/);
  assert.match(widgetPresentation, /data-widget-kds-customization/);
});

test('ordem e largura do editor usam a persistência oficial já existente do Workspace', () => {
  assert.match(editorModule, /saveWorkspaceOverride\(\{ \.\.\.definition, widgets: normalizeWorkspaceWidgets\(definition\.widgets\) \}/);
  assert.match(configStore, /const normalized = \{ \.\.\.definition, widgets: normalizeWorkspaceWidgets\(definition\.widgets\) \}/);
  assert.match(configStore, /definition: normalized/);
  assert.match(configStore, /workspace_engine_configs/);
  assert.match(widgetCatalog, /order: widget\.order \?\? index/);
  assert.match(widgetCatalog, /presentation: normalizeWidgetPresentation\(widget, catalog\?\.defaultSpan\)/);
  assert.doesNotMatch(editor, /workspace_engine_configs|saveWorkspaceOverride|upsert/);
});
