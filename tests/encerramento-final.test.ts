import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('encerramento depende das quatro fases finais certificadas', () => {
  for (const artifact of [
    'tests/integridade-operacional-freeze.test.ts',
    'tests/rbac-final-freeze.test.ts',
    'tests/workspace-persistence-final-freeze.test.ts',
    'tests/final-acceptance-gate.test.ts',
    'tests/homologacao-final.test.ts',
    'docs/testes-finais-freeze.md',
    'docs/homologacao-final.md',
  ]) assert.equal(existsSync(artifact), true, `${artifact} precisa existir`);
});

test('encerramento mantém no repositório as correções aplicadas ao banco real', () => {
  for (const migration of [
    'supabase/migrations/20260901130000_canonicalize_fixed_room_projections.sql',
    'supabase/migrations/20260901163000_finalize_rbac_auth_boundary.sql',
    'supabase/migrations/20260901170000_finalize_workspace_persistence.sql',
  ]) assert.equal(existsSync(migration), true, `${migration} precisa existir`);
});

test('dossiê final registra auditoria, pipelines e pendências externas sem ampliar o plano', () => {
  const closure = readFileSync('docs/encerramento-final.md', 'utf8');
  assert.match(closure, /16 projeções fixas/);
  assert.match(closure, /zero duplicidades/);
  assert.match(closure, /zero projeções órfãs/);
  assert.match(closure, /Testes finais.*Concluído/);
  assert.match(closure, /Homologação técnica.*Concluída/);
  assert.match(closure, /cinco usuários/);
  assert.doesNotMatch(closure, /nova fase|novo módulo|nova engine/i);
});
