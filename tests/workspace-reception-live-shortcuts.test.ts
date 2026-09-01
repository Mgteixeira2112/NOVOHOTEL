import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

test('Workspace visual: atalhos vivos reutilizam os mesmos seletores da Recepção', () => {
  const selectors = read('src/workspace-engine/widgets/receptionPresentationSelectors.ts');
  const fullWidgets = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
  const shortcuts = read('src/workspace-engine/WorkspaceShortcutSummary.tsx');

  for (const selector of [
    'selectReceptionReservationItems',
    'selectReceptionRoomAlerts',
    'selectReceptionSummary',
  ]) {
    assert.match(selectors, new RegExp(`export const ${selector}`));
    assert.match(fullWidgets, new RegExp(selector));
    assert.match(shortcuts, new RegExp(selector));
  }
});

test('Workspace visual: resumo do atalho não cria query, mutation, RPC ou service paralelo', () => {
  const shortcuts = read('src/workspace-engine/WorkspaceShortcutSummary.tsx');
  assert.doesNotMatch(shortcuts, /supabase|\.from\(|rpc\(|mutation|Service\.|fetch\(/i);
  assert.match(shortcuts, /useHotel\(\)/);
});

test('Workspace visual: S M L XL controlam densidade sem alterar destino do widget', () => {
  const shortcuts = read('src/workspace-engine/WorkspaceShortcutSummary.tsx');
  const editor = read('src/components/admin/WorkspaceVisualCanvasEditor.tsx');
  assert.match(shortcuts, /s: \{ secondary: false, details: false \}/);
  assert.match(shortcuts, /xl: \{ secondary: true, details: true \}/);
  assert.match(editor, /WorkspaceShortcutSummary widget=\{widget\} size=\{shortcut\.size\}/);
  assert.match(editor, /placeWidgetInSidebar\(surface, shortcut\.widgetId\)/);
});
