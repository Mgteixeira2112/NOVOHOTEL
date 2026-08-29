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
  assert.match(runtime, /columns-1 gap-4 md:columns-2 xl:columns-4/);
});

test('runtime exibe data e hora operacionais configuráveis', () => {
  assert.match(runtime, /Intl\.DateTimeFormat\('pt-BR'/);
  assert.match(runtime, /header\?\.showDate !== false/);
  assert.match(runtime, /header\?\.showTime !== false/);
});

test('fábrica expõe controles de apresentação mobile e KDS', () => {
  assert.match(editor, /Aparência do Workspace/);
  assert.match(editor, /Habilitar modo KDS \/ TV/);
  assert.match(editor, /MOBILE/);
  assert.match(editor, /KDS \/ TV/);
  assert.match(editor, /ALTURA/);
  assert.match(editor, /VISUAL/);
});
