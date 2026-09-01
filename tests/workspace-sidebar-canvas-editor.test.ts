import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const editor = readFileSync('src/components/admin/WorkspaceDesktopLayoutEditor.tsx', 'utf8');

test('editor mede a sidebar renderizada pelo runtime real', () => {
  assert.match(editor, /querySelector<HTMLElement>\('\[data-workspace-sidebar="desktop"\]'\)/);
  assert.match(editor, /setSidebarRect/);
  assert.match(editor, /observer\.observe\(sidebarElement\)/);
  assert.match(editor, /data-workspace-sidebar-editor/);
});

test('sidebar pode ser movida no canvas usando apenas presentation.sidebar', () => {
  assert.match(editor, /beginSidebarMove/);
  assert.match(editor, /updateSidebar\(\{/);
  assert.match(editor, /x: Number\(\(\(nextLeft \/ canvasWidth\) \* 100\)\.toFixed\(2\)\)/);
  assert.match(editor, /y: Math\.round\(nextTop\)/);
  assert.match(editor, /data-workspace-sidebar-move/);
});

test('largura da sidebar é redimensionada visualmente dentro do contrato', () => {
  assert.match(editor, /beginSidebarResize/);
  assert.match(editor, /clamp\(initialWidth \+ pointerEvent\.clientX - startX, 160, Math\.min\(480, canvasWidth\)\)/);
  assert.match(editor, /updateSidebar\(\{ width: nextWidth \}\)/);
  assert.match(editor, /data-workspace-sidebar-resize/);
});

test('editor da sidebar não cria persistência ou engine paralelos', () => {
  assert.match(editor, /presentation: \{ \.\.\.definition\.presentation, sidebar: \{ \.\.\.sidebar, \.\.\.patch \} \}/);
  assert.doesNotMatch(editor, /supabase|migration|localStorage|sessionStorage|fetch\(/i);
});
