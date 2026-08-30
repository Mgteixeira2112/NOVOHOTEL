import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const teamSource = readFileSync('src/workspace-engine/widgets/TeamWidget.tsx', 'utf8');
const registrySource = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');
const catalogSource = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');

test('Equipe usa o diretório oficial e respeita os setores do Workspace', () => {
  assert.match(teamSource, /useHotel\(\)/);
  assert.match(teamSource, /fetchUserOperationalSectorsState/);
  assert.match(teamSource, /workspace\.sectors/);
  assert.match(teamSource, /sectorIds\.some/);
  assert.match(teamSource, /sectors\.includes/);
});

test('Equipe é somente leitura e não cria persistência paralela', () => {
  assert.doesNotMatch(teamSource, /saveUserOperationalSectors|supabase\.|localStorage/);
  assert.doesNotMatch(teamSource, /\.insert\(|\.update\(|\.delete\(/);
});

test('Equipe está registrada e marcada ready na biblioteca', () => {
  assert.match(registrySource, /registerWorkspaceWidgetRenderer\('team', TeamWidget\)/);
  assert.match(catalogSource, /type: 'team'[\s\S]*?readiness: 'ready'/);
});

test('Atalhos e Pedidos permanecem explicitamente fora do Workspace 1.0', () => {
  assert.match(catalogSource, /type: 'orders'[\s\S]*?readiness: 'planned'/);
  assert.match(catalogSource, /type: 'shortcuts'[\s\S]*?readiness: 'planned'/);
  assert.doesNotMatch(registrySource, /registerWorkspaceWidgetRenderer\('orders'/);
  assert.doesNotMatch(registrySource, /registerWorkspaceWidgetRenderer\('shortcuts'/);
});
