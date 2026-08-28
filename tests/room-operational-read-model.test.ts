import test from 'node:test';
import assert from 'node:assert/strict';
import {
  housekeepingStatusFromCard,
  isOpenMaintenanceCard,
  resolveCurrentReservation,
  resolveGovernanceCard,
} from '../src/modules/governanca/roomOperationalReadModel';

const room: any = { id: 'rm-401', numero: '401', status: 'vistoria' };

test('prefers deterministic room_id metadata over room number fallback', () => {
  const cards: any[] = [
    { id: 'old', board_id: 'kanban-board-governanca', room_number: '401', column_id: 'gov-col-a-limpar', metadata: {}, updated_at: '2026-08-28T01:00:00Z' },
    { id: 'linked', board_id: 'kanban-board-governanca', room_number: '401', column_id: 'gov-col-inspecao', metadata: { room_id: 'rm-401' }, updated_at: '2026-08-28T00:00:00Z' },
  ];
  assert.equal(resolveGovernanceCard(room, cards)?.id, 'linked');
});

test('maps governance columns to housekeeping status', () => {
  assert.equal(housekeepingStatusFromCard({ column_id: 'gov-col-inspecao' } as any), 'aguardando_vistoria');
  assert.equal(housekeepingStatusFromCard({ column_id: 'gov-col-liberado' } as any), 'aprovado');
});

test('does not count resolved maintenance cards as open', () => {
  assert.equal(isOpenMaintenanceCard({ board_id: 'kanban-board-manutencao', column_id: 'man-col-resolvido' } as any), false);
  assert.equal(isOpenMaintenanceCard({ board_id: 'kanban-board-manutencao', column_id: 'man-col-reparo' } as any), true);
});

test('prefers checked-in reservation over merely confirmed reservation', () => {
  const reservations: any[] = [
    { id: 'future', quarto_id: 'rm-401', status: 'confirmada', checkin: '2026-09-10', checkout: '2026-09-11' },
    { id: 'current', quarto_id: 'rm-401', status: 'checkin_realizado', checkin: '2026-08-27', checkout: '2026-08-29' },
  ];
  assert.equal(resolveCurrentReservation('rm-401', reservations, new Date('2026-08-28T12:00:00'))?.id, 'current');
});
