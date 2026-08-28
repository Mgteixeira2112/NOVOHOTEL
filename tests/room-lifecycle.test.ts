import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decideRoomLifecycleTransition,
  receptionCanDirectlyControlRoom,
  RECEPTION_ROOM_KANBAN_STATUSES,
  type RoomLifecycleState,
} from '../src/domain/roomLifecycle';

function state(overrides: Partial<RoomLifecycleState> = {}): RoomLifecycleState {
  return {
    roomStatus: 'disponivel',
    controlOwner: 'recepcao',
    activeActivity: null,
    hasActiveStay: false,
    ...overrides,
  };
}

test('checkout moves occupied room to governance cleaning flow', () => {
  const decision = decideRoomLifecycleTransition(state({ roomStatus: 'ocupado', hasActiveStay: true }), 'checkout');
  assert.equal(decision.allowed, true);
  assert.equal(decision.transition?.toStatus, 'sujo');
  assert.equal(decision.transition?.toOwner, 'governanca');
  assert.equal(decision.transition?.resultingActivity, 'checkout_cleaning');
});

test('governance owns dirty, cleaning and inspection until room release', () => {
  const dirty = state({ roomStatus: 'sujo', controlOwner: 'governanca', activeActivity: 'checkout_cleaning' });
  const cleaning = decideRoomLifecycleTransition(dirty, 'start_cleaning');
  assert.equal(cleaning.transition?.toStatus, 'limpeza');
  assert.equal(cleaning.transition?.toOwner, 'governanca');

  const inspection = decideRoomLifecycleTransition(
    state({ roomStatus: 'limpeza', controlOwner: 'governanca', activeActivity: 'checkout_cleaning' }),
    'send_to_inspection',
  );
  assert.equal(inspection.transition?.toStatus, 'vistoria');
  assert.equal(inspection.transition?.toOwner, 'governanca');

  const released = decideRoomLifecycleTransition(
    state({ roomStatus: 'vistoria', controlOwner: 'governanca', activeActivity: 'inspection' }),
    'approve_inspection',
  );
  assert.equal(released.transition?.toStatus, 'disponivel');
  assert.equal(released.transition?.toOwner, 'recepcao');
});

test('reception can send a released room back to governance', () => {
  const cleaning = decideRoomLifecycleTransition(state(), 'send_to_governance_cleaning');
  assert.equal(cleaning.transition?.toStatus, 'sujo');
  assert.equal(cleaning.transition?.toOwner, 'governanca');
  assert.equal(cleaning.transition?.resultingActivity, 'recleaning');

  const inspection = decideRoomLifecycleTransition(state(), 'send_to_governance_inspection');
  assert.equal(inspection.transition?.toStatus, 'vistoria');
  assert.equal(inspection.transition?.toOwner, 'governanca');
});

test('occupied room cannot enter operational maintenance', () => {
  const decision = decideRoomLifecycleTransition(
    state({ roomStatus: 'ocupado', hasActiveStay: true }),
    'send_to_maintenance',
  );
  assert.equal(decision.allowed, false);
  assert.match(decision.reason || '', /não pode entrar em manutenção/i);
});

test('daily cleaning temporarily transfers control but room remains occupied', () => {
  const request = decideRoomLifecycleTransition(
    state({ roomStatus: 'ocupado', hasActiveStay: true }),
    'request_daily_cleaning',
  );
  assert.equal(request.allowed, true);
  assert.equal(request.transition?.toStatus, 'ocupado');
  assert.equal(request.transition?.toOwner, 'governanca');
  assert.equal(request.transition?.resultingActivity, 'daily_cleaning');

  const complete = decideRoomLifecycleTransition(
    state({
      roomStatus: 'ocupado',
      controlOwner: 'governanca',
      activeActivity: 'daily_cleaning',
      hasActiveStay: true,
    }),
    'complete_daily_cleaning',
  );
  assert.equal(complete.transition?.toStatus, 'ocupado');
  assert.equal(complete.transition?.toOwner, 'recepcao');
  assert.equal(complete.transition?.resultingActivity, null);
});

test('reception does not directly control governance-owned room', () => {
  assert.equal(receptionCanDirectlyControlRoom(state()), true);
  assert.equal(
    receptionCanDirectlyControlRoom(state({ roomStatus: 'sujo', controlOwner: 'governanca' })),
    false,
  );
});

test('reception room kanban exposes only official operational statuses', () => {
  assert.deepEqual(RECEPTION_ROOM_KANBAN_STATUSES, [
    'disponivel',
    'ocupado',
    'sujo',
    'limpeza',
    'vistoria',
    'manutencao',
    'bloqueado',
  ]);
  assert.equal(RECEPTION_ROOM_KANBAN_STATUSES.includes('outros'), false);
});
