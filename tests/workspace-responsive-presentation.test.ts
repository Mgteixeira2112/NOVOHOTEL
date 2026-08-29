import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/presentation.ts', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');
const generalControls = readFileSync('src/components/admin/WorkspaceGeneralPresentationControls.tsx', 'utf8');
const widgetControls = readFileSync('src/components/admin/WorkspaceWidgetPresentationControls.tsx', 'utf8');
const preview = readFileSync('src/components/admin/WorkspacePreviewPanel.tsx', 'utf8');

test('apresentação responsiva permanece separada do contrato funcional do widget', () => {
  assert.match(types, /WorkspaceViewport = 'desktop' \| 'mobile' \| 'kds'/);
  assert.match(types, /WorkspaceWidgetDisplay = 'panel' \| 'button'/);
  assert.match(types, /WorkspaceWidgetWidth = 'small' \| 'medium' \| 'large' \| 'full'/);
  assert.match(types, /presentation\?: WorkspaceWidgetPresentation/);
  assert.match(types, /presentation\?: WorkspacePresentation/);
  assert.match(presentation, /normalizeWidgetPresentation/);
  assert.match(presentation, /legacySpanToWidth/);
});

test('Masonry mede o conteúdo natural e reserva linhas independentes no Desktop', () => {
  assert.match(runtime, /const MasonryCell/);
  assert.match(runtime, /const contentRef = useRef/);
  assert.match(runtime, /observer\.observe\(content\)/);
  assert.match(runtime, /content\.getBoundingClientRect\(\)\.height/);
  assert.match(runtime, /data-masonry-content/);
  assert.match(runtime, /gridRowEnd: `span \$\{rows\}`/);
  assert.match(runtime, /md:auto-rows-\[8px\]/);
  assert.match(runtime, /masonrySpanClass\(width\)/);
});

test('runtime oferece estratégias Desktop, Mobile e KDS com herança ou personalização', () => {
  assert.match(runtime, /requested === 'kds'/);
  assert.match(runtime, /forcedViewport/);
  assert.match(runtime, /getWorkspaceDeviceMode\(definition, viewport\)/);
  assert.match(runtime, /resolveWidgetPresentation\(definition, widget, viewport\)/);
  assert.match(runtime, /data-workspace-device-mode=\{deviceMode\}/);
  assert.match(presentation, /deviceMode === 'custom'/);
  assert.match(presentation, /deviceMode === 'auto'/);
});

test('runtime exibe cabeçalho operacional completo e configurável', () => {
  assert.match(runtime, /Intl\.DateTimeFormat\('pt-BR'/);
  assert.match(runtime, /header\?\.showHotel !== false/);
  assert.match(runtime, /header\?\.showWorkspace !== false/);
  assert.match(runtime, /header\?\.showDate !== false/);
  assert.match(runtime, /header\?\.showTime !== false/);
  assert.match(runtime, /header\?\.showUser !== false/);
  assert.match(runtime, /header\?\.showStatus !== false/);
  assert.match(runtime, /header\?\.showOperationalDate === true/);
  assert.match(runtime, /getOperationalTodayStr\(\)/);
});

test('Mobile suporta adaptação vertical, resumo e botão sem duplicar Workspace', () => {
  assert.match(runtime, /viewport === 'mobile'/);
  assert.match(runtime, /presentation\.display === 'summary'/);
  assert.match(runtime, /presentation\.display === 'button'/);
  assert.match(runtime, /data-widget-mobile-summary/);
  assert.match(widgetControls, /Adaptar automaticamente/);
  assert.match(widgetControls, /Resumo/);
  assert.match(widgetControls, /Botão \/ popup/);
});

test('KDS aplica orientação, densidade, distância, tela cheia e controles operacionais', () => {
  assert.match(runtime, /kds\?\.orientation/);
  assert.match(runtime, /kds\?\.density/);
  assert.match(runtime, /kds\?\.viewingDistance/);
  assert.match(runtime, /kds\?\.fullscreen/);
  assert.match(runtime, /kds\?\.realtime/);
  assert.match(runtime, /hideAdministrativeControls/);
  assert.match(runtime, /hideEditingControls/);
  assert.match(runtime, /kdsSpanClass\(presentation\.width, kdsOrientation\)/);
  assert.match(runtime, /data-kds-editing-controls-hidden/);
  assert.match(generalControls, /Ocultar menus administrativos/);
  assert.match(generalControls, /Ocultar controles de edição/);
});

test('Fábrica expõe apresentação geral, overrides por dispositivo e Preview real', () => {
  assert.match(editor, /WorkspaceGeneralPresentationControls/);
  assert.match(editor, /WorkspaceWidgetPresentationControls/);
  assert.match(editor, /WorkspacePreviewPanel/);
  assert.match(generalControls, /Apresentação por dispositivo/);
  assert.match(widgetControls, /Apresentação geral/);
  assert.match(widgetControls, /DESKTOP/);
  assert.match(widgetControls, /MOBILE/);
  assert.match(widgetControls, /KDS \/ TV/);
  assert.match(preview, /<WidgetDrivenWorkspace definition=\{definition\} forcedViewport=\{viewport\} previewMode \/>/);
  assert.match(preview, /Desktop/);
  assert.match(preview, /Celular/);
  assert.match(preview, /KDS \/ TV/);
});

test('Preview da Fábrica ocupa apenas um botão e abre em popup', () => {
  assert.match(preview, /data-workspace-preview-open/);
  assert.match(preview, /data-workspace-preview-popup/);
  assert.match(preview, /role="dialog"/);
  assert.match(preview, /aria-modal="true"/);
  assert.match(preview, /setOpen\(true\)/);
  assert.match(preview, /setOpen\(false\)/);
  assert.match(preview, /event\.key === 'Escape'/);
});
