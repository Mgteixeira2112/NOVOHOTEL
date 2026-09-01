import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/hotel-os-validation.yml', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

test('pipeline final executa lint, suíte completa, build e auditoria de produção', () => {
  assert.match(workflow, /bun run lint/);
  assert.match(workflow, /bun run test/);
  assert.match(workflow, /bun run build/);
  assert.match(workflow, /bun run audit:production/);
  assert.equal(packageJson.scripts?.lint, 'tsc --noEmit');
  assert.equal(packageJson.scripts?.test, 'tsx --test tests/**/*.test.ts');
  assert.equal(packageJson.scripts?.build, 'vite build');
});

test('gate reúne todas as certificações do roteiro fechado', () => {
  const required = [
    'tests/workspace-mobile-final-certification.test.ts',
    'tests/workspace-kds-freeze.test.ts',
    'tests/room-map-freeze.test.ts',
    'tests/reception-freeze.test.ts',
    'tests/governanca-freeze.test.ts',
    'tests/workspace-maintenance-freeze.test.ts',
    'tests/kanban-freeze.test.ts',
    'tests/widgets-auxiliares-freeze.test.ts',
    'tests/financeiro-freeze.test.ts',
    'tests/integridade-operacional-freeze.test.ts',
    'tests/rbac-final-freeze.test.ts',
    'tests/workspace-persistence-final-freeze.test.ts',
  ];
  for (const path of required) assert.equal(existsSync(path), true, `${path} precisa existir`);
});

test('testes finais não substituem engines por mocks ou fontes paralelas', () => {
  const finalGate = readFileSync('tests/final-acceptance-gate.test.ts', 'utf8');
  for (const banned of ['mock' + 'InitialData', 'localStorage' + '.setItem', 'supabase' + '.from(']) {
    assert.equal(finalGate.includes(banned), false, `${banned} não pode integrar o gate final`);
  }
});
