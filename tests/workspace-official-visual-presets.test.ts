import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const factory = readFileSync('src/workspace-engine/workspaceOfficialFactory.ts', 'utf8');

test('templates oficiais recebem presets visuais coerentes sem ativar sidebar por padrão', () => {
  assert.match(factory, /createVisualPresentation\('operations'\)/);
  assert.match(factory, /id: 'workspace-recepcao'[\s\S]*presentation: createVisualPresentation\('lobby'\)/);
  assert.match(factory, /id: 'workspace-cozinha'[\s\S]*presentation: createVisualPresentation\('service'\)/);
  assert.match(factory, /id: 'workspace-financeiro'[\s\S]*\.\.\.createVisualPresentation\('finance'\)/);
  assert.match(factory, /id: 'workspace-administrativo-hotel'[\s\S]*presentation: createVisualPresentation\('operations'\)/);
  assert.match(factory, /id: 'workspace-administrativo-sistema'[\s\S]*presentation: createVisualPresentation\('operations'\)/);
  assert.match(factory, /sidebar:\s*\{[\s\S]*enabled: false,[\s\S]*x: 2,[\s\S]*y: 110,[\s\S]*width: 240,[\s\S]*itemSize: 'normal',[\s\S]*visual: 'glass'/);
});

test('definição oficial clona superfície e sidebar para evitar compartilhamento mutável entre instâncias', () => {
  assert.match(factory, /surface: template\.presentation\.surface \? \{ \.\.\.template\.presentation\.surface \} : undefined/);
  assert.match(factory, /sidebar: template\.presentation\.sidebar \? \{ \.\.\.template\.presentation\.sidebar \} : undefined/);
});

test('preset visual permanece camada de apresentação e não introduz infraestrutura de negócio', () => {
  assert.doesNotMatch(factory, /supabase|migration|localStorage|sessionStorage|fetch\(/i);
});
