import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const editor = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');

test('apresentação responsiva permanece separada do contrato funcional do widget', () => {
  assert.match(types, /WorkspaceViewport = 'desktop' \| 'mobile' \| 'kds'/);
  assert.match(types, /presentation\?: WorkspaceWidgetPresentation/);
  assert.match(types, /presentation\?: WorkspacePresentation/);
});

test('runtime oferece estratégias desktop, mobile e KDS', () => {
  assert.match(runtime, /requested === 'kds'/);
  assert.match(runtime, /data-workspace-viewport=\{viewport\}/);
  assert.match(runtime, /const MasonryCell/);
  assert.match(runtime, /ResizeObserver/);
  assert.match(runtime, /md:auto-rows-\[8px\]/);
  assert.match(runtime, /masonrySpanClass\(span\)/);
});

test('runtime exibe data e hora operacionais configuráveis', () => {
  assert.match(runtime, /Intl\.DateTimeFormat\('pt-BR'/);
  assert.match(runtime, /header\?\.showDate !== false/);
  assert.match(runtime, /header\?\.showTime !== false/);
});

test('runtime aplica apresentação própria de Mobile', () => {
  assert.match(runtime, /mobileDisplay === 'summary'/);
  assert.match(runtime, /data-widget-mobile-summary/);
  assert.match(runtime, /mobileDisplay === 'button'/);
  assert.match(runtime, /presentation\?\.mobile\?\.order/);
});

test('runtime aplica visual e cabeçalho por widget', () => {
  assert.match(runtime, /widget\.presentation\?\.visual/);
  assert.match(runtime, /widget\.presentation\?\.header/);
  assert.match(runtime, /data-widget-visual/);
  assert.match(runtime, /data-widget-header/);
});

test('runtime aplica configuração KDS de orientação, densidade, distância e tela cheia', () => {
  assert.match(runtime, /kds\?\.orientation/);
  assert.match(runtime, /kds\?\.density/);
  assert.match(runtime, /kds\?\.viewingDistance/);
  assert.match(runtime, /kds\?\.fullscreen/);
  assert.match(runtime, /data-kds-orientation/);
  assert.match(runtime, /data-kds-density/);
  assert.match(runtime, /data-kds-viewing-distance/);
  assert.match(runtime, /data-kds-fullscreen/);
});

test('KDS respeita visibilidade dos controles administrativos e spans seguros por orientação', () => {
  assert.match(runtime, /hideAdministrativeControls/);
  assert.match(runtime, /showAdministrativeControls/);
  assert.match(runtime, /kdsSpanClass\(widget\.span, kdsOrientation\)/);
  assert.match(runtime, /orientation === 'portrait'/);
  assert.match(runtime, /data-kds-admin-controls-hidden/);
});

test('fábrica expõe controles de apresentação mobile e KDS', () => {
  assert.match(editor, /Aparência do Workspace/);
  assert.match(editor, /Habilitar modo KDS \/ TV/);
  assert.match(editor, /MOBILE/);
  assert.match(editor, /KDS \/ TV/);
  assert.match(editor, /ALTURA/);
  assert.match(editor, /VISUAL/);
});
