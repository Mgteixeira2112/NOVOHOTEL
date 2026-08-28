import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('reception guest and stay workflow', () => {
  test('registers the guest, reservation and active stay widgets', () => {
    const types = read('src/workspace-engine/types.ts');
    const catalog = read('src/workspace-engine/widgetCatalog.ts');
    const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');
    expect(types).toContain("| 'guests'");
    expect(types).toContain("| 'active-stays'");
    expect(catalog).toContain("type: 'guests'");
    expect(catalog).toContain("type: 'reservations-list'");
    expect(catalog).toContain("type: 'active-stays'");
    expect(registry).toContain("registerWorkspaceWidgetRenderer('guests'");
    expect(registry).toContain("registerWorkspaceWidgetRenderer('active-stays'");
  });

  test('persists guest-room binding through a Supabase RPC', () => {
    const migration = read('supabase/migrations/20260828193000_reception_guest_reservation_workflow.sql');
    const service = read('src/modules/recepcao/receptionGuestStayService.ts');
    expect(migration).toContain('reception_create_reservation_for_guest');
    expect(migration).toContain('O quarto possui reserva conflitante');
    expect(migration).toContain('insert into public.reservas');
    expect(service).toContain("supabase.rpc('reception_create_reservation_for_guest'");
    expect(service).toContain("supabase.from('hospedes').insert");
  });

  test('operationalizes arrivals, departures and active stay checkout', () => {
    const info = read('src/workspace-engine/widgets/ReceptionInfoWidgets.tsx');
    const stay = read('src/workspace-engine/widgets/ReceptionGuestStayWidgets.tsx');
    expect(info).toContain('receptionStayService.checkin');
    expect(info).toContain('receptionStayService.checkout');
    expect(stay).toContain('Vincular hóspede ao quarto');
    expect(stay).toContain('Hóspedes hospedados');
    expect(stay).toContain('receptionStayService.checkout');
  });
});
