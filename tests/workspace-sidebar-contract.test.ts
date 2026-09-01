import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const types = readFileSync('src/workspace-engine/types.ts', 'utf8');
const freeze = readFileSync('docs/WORKSPACE-FACTORY-2-FREEZE.md', 'utf8');

test('menu lateral pertence somente ao contrato visual do Workspace', () => {
  assert.match(types, /export interface WorkspaceSidebarPresentation/);
  assert.match(types, /sidebar\?: WorkspaceSidebarPresentation/);
  assert.match(types, /enabled\?: boolean/);
  assert.match(types, /x\?: number/);
  assert.match(types, /y\?: number/);
  assert.match(types, /width\?: number/);
  assert.match(types, /itemSize\?: WorkspaceSidebarItemSize/);
  assert.match(types, /visual\?: WorkspaceSidebarVisualStyle/);
});

test('itens do menu continuam sendo widgets existentes e não novas fontes', () => {
  assert.match(types, /Os itens continuam sendo widgets com display=button/);
  assert.doesNotMatch(types, /sidebarDataSource|sidebarService|sidebarRepository/);
});

test('contrato preserva o Freeze da Fábrica 2.0', () => {
  assert.match(freeze, /menu lateral configurável/);
  assert.match(freeze, /sem recriar engines, persistência ou caminhos administrativos paralelos/);
});
