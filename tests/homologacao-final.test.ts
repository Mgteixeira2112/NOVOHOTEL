import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const permissions = readFileSync('src/core/permissions/permissionService.ts', 'utf8');

test('homologação cobre Desktop, notebook, Tablet, Mobile e TV/KDS', () => {
  for (const certification of [
    'tests/workspace-responsive-presentation.test.ts',
    'tests/workspace-tablet-presentation.test.ts',
    'tests/workspace-mobile-final-certification.test.ts',
    'tests/workspace-kds-freeze.test.ts',
    'tests/workspace-desktop-mobile-polish.test.ts',
  ]) assert.equal(existsSync(certification), true, `${certification} precisa existir`);

  assert.match(runtime, /requested === 'kds'/);
  assert.match(runtime, /max-width: 767px/);
  assert.match(runtime, /viewport === 'desktop'/);
  assert.match(runtime, /viewport === 'mobile'/);
});

test('homologação reúne os perfis operacionais aprovados', () => {
  const roles = [
    'admin',
    'gerente',
    'recepcionista',
    'governanca',
    'financeiro',
    'pdv_only',
    'cozinha_only',
    'tablet_quarto',
  ];
  for (const role of roles) assert.match(permissions, new RegExp(`${role}:`));
  assert.equal(existsSync('tests/rbac-final-freeze.test.ts'), true);
});

test('homologação operacional depende do gate final e das superfícies certificadas', () => {
  for (const certification of [
    'tests/final-acceptance-gate.test.ts',
    'tests/room-map-freeze.test.ts',
    'tests/reception-freeze.test.ts',
    'tests/governanca-freeze.test.ts',
    'tests/workspace-maintenance-freeze.test.ts',
    'tests/kanban-freeze.test.ts',
    'tests/financeiro-freeze.test.ts',
    'tests/integridade-operacional-freeze.test.ts',
    'tests/workspace-persistence-final-freeze.test.ts',
  ]) assert.equal(existsSync(certification), true, `${certification} precisa existir`);
});
