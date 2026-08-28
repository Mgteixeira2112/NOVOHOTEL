import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync('supabase/migrations/20260828155500_room_occupied_requires_release.sql', 'utf8');

test('ocupado exige liberação da Governança e da Manutenção', () => {
  assert.match(migration, /gov-col-liberado/);
  assert.match(migration, /man-col-resolvido/);
  assert.match(migration, /not v_governance_released/);
  assert.match(migration, /not v_maintenance_released/);
});

test('regra é aplicada no banco antes de atualizar quartos', () => {
  assert.match(migration, /before update of status, status_operacional/);
  assert.match(migration, /v_new_status = 'ocupado'/);
  assert.match(migration, /assert_room_occupied_release\(new\.id::text\)/);
});
