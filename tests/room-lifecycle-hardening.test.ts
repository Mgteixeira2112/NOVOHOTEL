import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const governanceMigration = readFileSync('supabase/migrations/20260828234500_governanca_stage_room_sync.sql', 'utf8');
const lifecycleMigration = readFileSync('supabase/migrations/20260828235500_harden_room_lifecycle.sql', 'utf8');

test('checkout exige hospedagem ativa em quarto ocupado pela Recepção', () => {
  assert.match(lifecycleMigration, /v_reservation\.status <> 'checkin_realizado'/);
  assert.match(lifecycleMigration, /normalize_room_operational_status\(coalesce\(v_room\.status_operacional, v_room\.status\)\) <> 'ocupado'/);
  assert.match(lifecycleMigration, /control_owner, 'recepcao'\) <> 'recepcao'/);
});

test('checkout transfere o quarto integralmente para Governança', () => {
  assert.match(lifecycleMigration, /status = 'sujo'/);
  assert.match(lifecycleMigration, /status_operacional = 'sujo'/);
  assert.match(lifecycleMigration, /status_housekeeping = 'sujo'/);
  assert.match(lifecycleMigration, /status_governanca = 'sujo'/);
  assert.match(lifecycleMigration, /control_owner = 'governanca'/);
  assert.match(lifecycleMigration, /active_activity = 'checkout_cleaning'/);
});

test('check-in realizado nunca pode ficar sem quarto', () => {
  assert.match(lifecycleMigration, /reservas_checkin_realizado_exige_quarto/);
  assert.match(lifecycleMigration, /status <> 'checkin_realizado' or quarto_id is not null/);
});

test('Governança mantém sequência operacional coerente até a liberação', () => {
  assert.match(governanceMigration, /when 'gov-col-a-limpar' then 'sujo'/);
  assert.match(governanceMigration, /when 'gov-col-em-limpeza' then 'limpeza'/);
  assert.match(governanceMigration, /when 'gov-col-inspecao' then 'vistoria'/);
  assert.match(governanceMigration, /when 'gov-col-liberado' then 'disponivel'/);
  assert.match(governanceMigration, /then 'recepcao'/);
  assert.match(governanceMigration, /then null/);
});

test('Governança não libera quarto com check-in ativo ou manutenção pendente', () => {
  assert.match(governanceMigration, /r\.status = 'checkin_realizado'/);
  assert.match(governanceMigration, /m\.board_id = 'kanban-board-manutencao'/);
  assert.match(governanceMigration, /m\.column_id <> 'man-col-resolvido'/);
});
