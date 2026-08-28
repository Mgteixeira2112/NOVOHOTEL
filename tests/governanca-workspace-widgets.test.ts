import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGovernancaWorkspaceAlerts, GOVERNANCA_STAGES } from '../src/modules/governanca/governancaWorkspaceModel';

const card = (overrides: Record<string, unknown> = {}) => ({
  id: 'card-1', hotel_id: 'default_hotel', board_id: 'kanban-board-governanca',
  column_id: GOVERNANCA_STAGES.pending, titulo: 'Limpar quarto', descricao: null,
  prioridade: 'normal', ordem: 0, departamento: 'governanca', room_number: '101',
  location: 'Quarto 101', assigned_to: null, checklist: [], comments: [], metadata: {},
  completed_at: null, created_at: '2026-08-28T10:00:00Z', updated_at: '2026-08-28T10:00:00Z',
  is_archived: false, guest_name: null, reservation_id: null, service_details: null,
  tags: [], notes: null, ...overrides,
}) as any;

test('alertas refletem prioridade, inspeção e tarefas sem responsável', () => {
  const alerts = buildGovernancaWorkspaceAlerts([
    card({ id: 'priority', prioridade: 'alta', assigned_user_id: 'u1' }),
    card({ id: 'inspection', column_id: GOVERNANCA_STAGES.inspection, assigned_user_id: 'u2' }),
    card({ id: 'unassigned' }),
    card({ id: 'done', column_id: GOVERNANCA_STAGES.done, prioridade: 'alta' }),
  ]);

  assert.equal(alerts.find(item => item.id === 'priority')?.count, 1);
  assert.equal(alerts.find(item => item.id === 'inspection')?.count, 1);
  assert.equal(alerts.find(item => item.id === 'unassigned')?.count, 1);
});
