import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('src/index.css', 'utf8');
const factory = readFileSync('src/components/admin/WorkspaceEditorModule.tsx', 'utf8');

const factoryAnchor = /lg:grid-cols-\[280px_1fr\]/;

test('acabamento da Fábrica usa a grade existente como escopo e não altera o TSX', () => {
  assert.match(factory, factoryAnchor);
  assert.match(css, /Workspace Factory polish: visual-only scope/);
  assert.match(css, /:has\(> \.grid\[class\*="lg:grid-cols-\[280px_1fr\]"\]\)/);
});

test('lista de Workspaces fica fixa no desktop e horizontal em telas menores', () => {
  assert.match(css, /position: sticky/);
  assert.match(css, /max-height: calc\(100dvh - 6\.25rem\)/);
  assert.match(css, /@media \(max-width: 1023px\)/);
  assert.match(css, /scroll-snap-type: x proximity/);
});

test('cards de composição diferenciam controles gerais, Mobile e KDS visualmente', () => {
  assert.match(css, /xl:grid-cols-4/);
  assert.match(css, /> \.bg-stone-50/);
  assert.match(css, /border-left: 3px solid #f59e0b/);
  assert.match(css, /> \.bg-slate-50/);
  assert.match(css, /border-left: 3px solid #64748b/);
});

test('campos e ações mantêm foco visível e adaptação mobile', () => {
  assert.match(css, /section input:focus-visible/);
  assert.match(css, /section select:focus-visible/);
  assert.match(css, /section button:focus-visible/);
  assert.match(css, /flex: 1 1 calc\(50% - 0\.5rem\)/);
});

test('polimento da Fábrica não cria seletores para engines ou KDS runtime', () => {
  const polish = css.split('/* Workspace Factory polish: visual-only scope anchored to its unique editor grid. */')[1]?.split('@media (max-width: 767px) {\n  .mobile-stack')[0] || '';
  assert.doesNotMatch(polish, /financial-engine|dashboard-engine|frigobar-core|task-kanban/);
  assert.doesNotMatch(polish, /data-workspace-viewport="kds"/);
});
