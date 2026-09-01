import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const stayService = readFileSync('src/modules/recepcao/receptionStayService.ts', 'utf8');
const lifecycle = readFileSync('supabase/migrations/20260828060000_room_lifecycle_engine.sql', 'utf8');
const projection = readFileSync('supabase/migrations/20260828062000_fixed_room_projection_cards.sql', 'utf8');
const guestBinding = readFileSync('supabase/migrations/20260828064000_reception_room_guest_binding.sql', 'utf8');
const directCheckin = readFileSync('supabase/migrations/20260828233000_atomic_direct_room_checkin.sql', 'utf8');
const governanceSync = readFileSync('supabase/migrations/20260828234500_fix_governanca_stage_sync.sql', 'utf8');
const hardening = readFileSync('supabase/migrations/20260828235500_harden_room_lifecycle.sql', 'utf8');
const canonicalProjection = readFileSync('supabase/migrations/20260901130000_canonicalize_fixed_room_projections.sql', 'utf8');

test('recepção continua delegando check-in, checkout e transferência aos RPCs oficiais', () => {
  assert.match(stayService, /reception_room_checkin/);
  assert.match(stayService, /reception_room_checkout/);
  assert.match(stayService, /reception_room_transfer/);
});

test('lifecycle oficial cobre ocupação, governança, manutenção e liberação sem estado paralelo no frontend', () => {
  assert.match(lifecycle, /status_operacional/);
  assert.match(lifecycle, /status_governanca/);
  assert.match(lifecycle, /status_housekeeping/);
  assert.match(lifecycle, /status_manutencao_motivo/);
  assert.match(lifecycle, /control_owner/);
  assert.match(lifecycle, /active_activity/);
  assert.match(lifecycle, /lifecycle_version/);
});

test('checkout, transferência, check-in direto e governança permanecem no contrato oficial já existente', () => {
  assert.match(guestBinding, /reception_room_checkout/);
  assert.match(guestBinding, /reception_room_transfer/);
  assert.match(directCheckin, /reception_room_direct_checkin/);
  assert.match(governanceSync, /gov-col-a-limpar/);
  assert.match(governanceSync, /gov-col-em-limpeza/);
  assert.match(governanceSync, /gov-col-inspecao/);
  assert.match(governanceSync, /gov-col-liberado/);
  assert.match(hardening, /ocupado/);
});

test('projeções fixas continuam derivadas de quartos e a correção converge o legado para um único card por quarto e board', () => {
  assert.match(projection, /sync_fixed_room_projection_cards/);
  assert.match(projection, /fixed_room_projection/);
  assert.match(canonicalProjection, /perform public\.sync_fixed_room_projection_cards/);
  assert.match(canonicalProjection, /auto-man-room-%/);
  assert.match(canonicalProjection, /room-man-/);
  assert.match(canonicalProjection, /create unique index if not exists uq_kanban_fixed_room_projection_room_board/);
});
