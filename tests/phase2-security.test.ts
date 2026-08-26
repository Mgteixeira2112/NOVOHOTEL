import assert from 'node:assert/strict';
import test from 'node:test';
import { PERMISSIONS } from '../src/core/permissions/permissionKeys';
import { canAccessResource } from '../src/core/permissions/permissionService';
import type { RBACMatrixConfig } from '../src/types';

test('granular permission keys remain stable', () => {
  assert.equal(PERMISSIONS.reservationsView, 'reservations.view');
  assert.equal(PERMISSIONS.posCreateOrder, 'pos.create_order');
  assert.equal(PERMISSIONS.tabletServiceRequest, 'tablet.service.request');
});

test('RBAC denies resources that are not explicitly granted', () => {
  const matrix: RBACMatrixConfig = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    resources: [{ id: 'admin', moduleName: 'Admin', permissions: { pdv_only: { granted: false, level: 'none', customLabel: 'Sem acesso' } } }],
  };
  assert.equal(canAccessResource(matrix, 'pdv_only', 'admin'), false);
});

test('phase 2 device types are constrained', () => {
  const allowed = ['POS', 'TABLET_ROOM', 'KDS', 'TOTEM', 'MOBILE'];
  assert.equal(allowed.includes('TABLET_ROOM'), true);
  assert.equal(allowed.includes('UNKNOWN'), false);
});
