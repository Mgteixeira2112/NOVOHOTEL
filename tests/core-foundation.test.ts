import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError, toAppError } from '../src/core/errors/appError';
import { eventBus } from '../src/core/events/eventBus';
import { canAccessResource } from '../src/core/permissions/permissionService';
import type { RBACMatrixConfig } from '../src/types';

test('AppError preserves code and cause', () => {
  const cause = new Error('database');
  const error = new AppError('Falha', 'DATABASE', cause);
  assert.equal(error.code, 'DATABASE');
  assert.equal(error.cause, cause);
  assert.equal(toAppError(error), error);
});

test('eventBus publishes to subscribers and supports unsubscribe', async () => {
  const received: string[] = [];
  const unsubscribe = eventBus.subscribe<{ value: string }>('test.event', (event) => {
    received.push(event.payload.value);
  });
  await eventBus.publish('test.event', { value: 'ok' });
  unsubscribe();
  await eventBus.publish('test.event', { value: 'ignored' });
  assert.deepEqual(received, ['ok']);
});

test('permission service evaluates explicit RBAC grants', () => {
  const matrix: RBACMatrixConfig = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    resources: [{
      id: 'reservations',
      moduleName: 'Reservas',
      permissions: {
        admin: { granted: true, level: 'total', customLabel: 'Tudo' },
        recepcionista: { granted: false, level: 'none', customLabel: 'Sem acesso' },
      },
    }],
  };
  assert.equal(canAccessResource(matrix, 'admin', 'reservations'), true);
  assert.equal(canAccessResource(matrix, 'recepcionista', 'reservations'), false);
});
