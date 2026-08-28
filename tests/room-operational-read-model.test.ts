import { describe, expect, it } from 'vitest';
import {
  housekeepingStatusFromCard,
  isOpenMaintenanceCard,
  resolveCurrentReservation,
  resolveGovernanceCard,
} from '../src/modules/governanca/roomOperationalReadModel';

const room: any = { id: 'rm-401', numero: '401', status: 'vistoria' };

describe('room operational read model', () => {
  it('prefers deterministic room_id metadata over room number fallback', () => {
    const cards: any[] = [
      { id: 'old', board_id: 'kanban-board-governanca', room_number: '401', column_id: 'gov-col-a-limpar', metadata: {}, updated_at: '2026-08-28T01:00:00Z' },
      { id: 'linked', board_id: 'kanban-board-governanca', room_number: '401', column_id: 'gov-col-inspecao', metadata: { room_id: 'rm-401' }, updated_at: '2026-08-28T00:00:00Z' },
    ];
    expect(resolveGovernanceCard(room, cards)?.id).toBe('linked');
  });

  it('maps governance columns to housekeeping status', () => {
    expect(housekeepingStatusFromCard({ column_id: 'gov-col-inspecao' } as any)).toBe('aguardando_vistoria');
    expect(housekeepingStatusFromCard({ column_id: 'gov-col-liberado' } as any)).toBe('aprovado');
  });

  it('does not count resolved maintenance cards as open', () => {
    expect(isOpenMaintenanceCard({ board_id: 'kanban-board-manutencao', column_id: 'man-col-resolvido' } as any)).toBe(false);
    expect(isOpenMaintenanceCard({ board_id: 'kanban-board-manutencao', column_id: 'man-col-reparo' } as any)).toBe(true);
  });

  it('prefers checked-in reservation over merely confirmed reservation', () => {
    const reservations: any[] = [
      { id: 'future', quarto_id: 'rm-401', status: 'confirmada', checkin: '2026-09-10', checkout: '2026-09-11' },
      { id: 'current', quarto_id: 'rm-401', status: 'checkin_realizado', checkin: '2026-08-27', checkout: '2026-08-29' },
    ];
    expect(resolveCurrentReservation('rm-401', reservations, new Date('2026-08-28T12:00:00'))?.id).toBe('current');
  });
});
