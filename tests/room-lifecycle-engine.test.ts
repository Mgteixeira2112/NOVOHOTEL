import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RoomLifecycleEngine,
  buildRoomLifecyclePlan,
  type RoomLifecyclePlan,
  type RoomLifecycleSnapshot,
} from '../src/services/roomLifecycleEngine';

function snapshot(overrides: Partial<RoomLifecycleSnapshot['state']> = {}): RoomLifecycleSnapshot {
  return {
    state: {
      roomStatus: 'disponivel',
      controlOwner: 'recepcao',
      activeActivity: null,
      hasActiveStay: false,
      ...overrides,
    },
    version: 7,
  };
}

test('checkout plan marks room dirty, hands control to governance and creates one cleaning demand', () => {
  const result = buildRoomLifecyclePlan(
    snapshot({ roomStatus: 'ocupado', hasActiveStay: true }),
    'checkout',
    { roomId: 'rm-401', reservationId: 'res-401' },
  );

  assert.equal(result.ok, true);
  assert.equal(result.plan?.nextState.roomStatus, 'sujo');
  assert.equal(result.plan?.nextState.controlOwner, 'governanca');
  assert.equal(result.plan?.nextState.hasActiveStay, false);
  assert.deepEqual(result.plan?.effects, [
    { type: 'create_governance_demand', activity: 'checkout_cleaning' },
  ]);
  assert.equal(result.plan?.expectedVersion, 7);
});

test('daily cleaning keeps room occupied while governance temporarily owns the operation', () => {
  const result = buildRoomLifecyclePlan(
    snapshot({ roomStatus: 'ocupado', hasActiveStay: true }),
    'request_daily_cleaning',
    { roomId: 'rm-402', reservationId: 'res-402' },
  );

  assert.equal(result.ok, true);
  assert.equal(result.plan?.nextState.roomStatus, 'ocupado');
  assert.equal(result.plan?.nextState.controlOwner, 'governanca');
  assert.equal(result.plan?.nextState.activeActivity, 'daily_cleaning');
  assert.equal(result.plan?.nextState.hasActiveStay, true);
});

test('occupied room cannot produce maintenance plan', () => {
  const result = buildRoomLifecyclePlan(
    snapshot({ roomStatus: 'ocupado', hasActiveStay: true }),
    'send_to_maintenance',
    { roomId: 'rm-403' },
  );

  assert.equal(result.ok, false);
  assert.equal(result.plan, undefined);
  assert.match(result.reason || '', /não pode entrar em manutenção/i);
});

test('checkout refuses to run without reservation binding', () => {
  const result = buildRoomLifecyclePlan(
    snapshot({ roomStatus: 'ocupado', hasActiveStay: true }),
    'checkout',
    { roomId: 'rm-404' },
  );

  assert.equal(result.ok, false);
  assert.match(result.reason || '', /reserva/i);
});

test('engine commits exactly one validated plan and does not touch Kanban engine', async () => {
  const committed: RoomLifecyclePlan[] = [];
  const engine = new RoomLifecycleEngine(
    {
      async getSnapshot(roomId) {
        assert.equal(roomId, 'rm-405');
        return snapshot({ roomStatus: 'vistoria', controlOwner: 'governanca' });
      },
    },
    {
      async commit(plan) {
        committed.push(plan);
      },
    },
  );

  const result = await engine.execute('approve_inspection', { roomId: 'rm-405' });
  assert.equal(result.ok, true);
  assert.equal(committed.length, 1);
  assert.equal(committed[0].nextState.roomStatus, 'disponivel');
  assert.equal(committed[0].nextState.controlOwner, 'recepcao');
  assert.deepEqual(committed[0].effects, []);
});

test('engine never commits a denied transition', async () => {
  let commits = 0;
  const engine = new RoomLifecycleEngine(
    { async getSnapshot() { return snapshot({ roomStatus: 'ocupado', hasActiveStay: true }); } },
    { async commit() { commits += 1; } },
  );

  const result = await engine.execute('send_to_maintenance', { roomId: 'rm-406' });
  assert.equal(result.ok, false);
  assert.equal(commits, 0);
});
