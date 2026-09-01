import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.join(process.cwd(), 'src/workspace-engine/widgetCatalog.ts'), 'utf8');

const createBlock = source.slice(source.indexOf('export const createWorkspaceWidget'), source.indexOf('/**\n * Normaliza a definição persistida'));
const normalizeBlock = source.slice(source.indexOf('export const normalizeWorkspaceWidgets'), source.indexOf('export const canonicalWidgetType'));

test('novos widgets não sintetizam campos históricos de apresentação', () => {
  assert.doesNotMatch(createBlock, /\bspan\s*,/);
  assert.doesNotMatch(createBlock, /presentation\s*:/);
  assert.doesNotMatch(source, /legacySpanToWidth|normalizeWidgetPresentation/);
});

test('normalização preserva dados existentes sem recriar legado ausente', () => {
  assert.match(normalizeBlock, /\.\.\.widget/);
  assert.doesNotMatch(normalizeBlock, /span\s*:/);
  assert.doesNotMatch(normalizeBlock, /presentation\s*:/);
  assert.match(normalizeBlock, /permissions: widget\.permissions \?\? \{ view: true \}/);
});
