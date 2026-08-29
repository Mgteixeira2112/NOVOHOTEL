import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync('src/index.css', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');

test('acabamento visual fica escopado ao runtime de Workspace', () => {
  assert.match(css, /\[data-workspace-runtime="widget-driven"\]/);
  assert.match(runtime, /data-workspace-runtime="widget-driven"/);
});

test('Desktop recebe hierarquia visual e espaçamento próprios sem alterar KDS', () => {
  assert.match(css, /data-workspace-viewport="desktop"/);
  assert.match(css, /linear-gradient\(180deg/);
  assert.match(css, /data-widget-presentation-header/);
  assert.doesNotMatch(css, /data-workspace-viewport="kds"[^}]*linear-gradient/s);
});

test('Mobile possui ritmo vertical, safe area e resumo visual próprio', () => {
  assert.match(css, /data-workspace-viewport="mobile"/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /data-widget-mobile-summary/);
  assert.match(css, /min-height: 4\.75rem/);
});

test('estados sem renderer e navegação por teclado permanecem legíveis', () => {
  assert.match(css, /\[data-workspace-widget\] > \.border-dashed/);
  assert.match(css, /focus-visible/);
  assert.match(css, /--theme-primary-ring/);
});

test('movimento reduzido desativa transições do Workspace', () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /transition: none !important/);
});
