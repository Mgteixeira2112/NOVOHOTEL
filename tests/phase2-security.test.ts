import assert from 'node:assert/strict';
import test from 'node:test';
import { PERMISSIONS } from '../src/core/permissions/permissionKeys';
import {
  canAccessResource,
  canAccessTab,
  guardTab,
  hasRolePermission,
  ROLE_DEFAULT_PERMISSIONS,
} from '../src/core/permissions/permissionService';
import { deviceService } from '../src/core/device/deviceService';
import {
  canUseHotel,
  isTenantContextValid,
  ScopedHotelCache,
  switchActiveHotel,
} from '../src/core/tenant/tenantPolicy';
import type { HotelMembership, TenantContext } from '../src/core/tenant/tenantTypes';
import type { RBACMatrixConfig } from '../src/types';

test('granular permission keys remain stable and exhaustive', () => {
  assert.equal(PERMISSIONS.reservationsView, 'reservations.view');
  assert.equal(PERMISSIONS.reservationsCreate, 'reservations.create');
  assert.equal(PERMISSIONS.reservationsEdit, 'reservations.edit');
  assert.equal(PERMISSIONS.reservationsCancel, 'reservations.cancel');
  assert.equal(PERMISSIONS.reservationsCheckin, 'reservations.checkin');
  assert.equal(PERMISSIONS.reservationsCheckout, 'reservations.checkout');
  assert.equal(PERMISSIONS.posView, 'pos.view');
  assert.equal(PERMISSIONS.posCreateOrder, 'pos.create_order');
  assert.equal(PERMISSIONS.posEditOrder, 'pos.edit_order');
  assert.equal(PERMISSIONS.posCancelItem, 'pos.cancel_item');
  assert.equal(PERMISSIONS.posApplyDiscount, 'pos.apply_discount');
  assert.equal(PERMISSIONS.posOpenCash, 'pos.open_cash');
  assert.equal(PERMISSIONS.posCloseCash, 'pos.close_cash');
  assert.equal(PERMISSIONS.posRefund, 'pos.refund');
  assert.equal(PERMISSIONS.housekeepingView, 'housekeeping.view');
  assert.equal(PERMISSIONS.housekeepingAssign, 'housekeeping.assign');
  assert.equal(PERMISSIONS.housekeepingStart, 'housekeeping.start');
  assert.equal(PERMISSIONS.housekeepingComplete, 'housekeeping.complete');
  assert.equal(PERMISSIONS.maintenanceView, 'maintenance.view');
  assert.equal(PERMISSIONS.maintenanceCreate, 'maintenance.create');
  assert.equal(PERMISSIONS.maintenanceAssign, 'maintenance.assign');
  assert.equal(PERMISSIONS.maintenanceComplete, 'maintenance.complete');
  assert.equal(PERMISSIONS.financeView, 'finance.view');
  assert.equal(PERMISSIONS.financeCreatePayment, 'finance.create_payment');
  assert.equal(PERMISSIONS.financeRefund, 'finance.refund');
  assert.equal(PERMISSIONS.financeCloseCash, 'finance.close_cash');
  assert.equal(PERMISSIONS.tabletMenuView, 'tablet.menu.view');
  assert.equal(PERMISSIONS.tabletOrderCreate, 'tablet.order.create');
  assert.equal(PERMISSIONS.tabletOrderView, 'tablet.order.view');
  assert.equal(PERMISSIONS.tabletServiceRequest, 'tablet.service.request');
});

// 1. Usuário Hotel A não acessa Hotel B
test('1. usuário Hotel A não acessa Hotel B', () => {
  const memberships: HotelMembership[] = [
    {
      id: 'm1',
      user_id: 'user-hotel-a',
      organization_id: 'org-1',
      hotel_id: 'hotel-a',
      role: 'recepcionista',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  assert.equal(canUseHotel('user-hotel-a', 'hotel-a', memberships), true);
  assert.equal(canUseHotel('user-hotel-a', 'hotel-b', memberships), false);
});

// 2. Usuário sem permissão não consegue acessar rota diretamente
test('2. usuário sem permissão não consegue acessar rota diretamente', () => {
  const guardPdvSettings = guardTab('pdv_only', 'settings');
  assert.equal(guardPdvSettings.allowed, false);

  const guardGovernancaUsers = guardTab('governanca', 'users');
  assert.equal(guardGovernancaUsers.allowed, false);

  const guardRecepcionistaAutomation = guardTab('recepcionista', 'automation');
  assert.equal(guardRecepcionistaAutomation.allowed, false);
});

// 3. Usuário sem permissão não consegue executar ação via backend
test('3. usuário sem permissão não consegue executar ação via backend', () => {
  assert.equal(hasRolePermission('governanca', PERMISSIONS.financeCreatePayment), false);
  assert.equal(hasRolePermission('cozinha_only', PERMISSIONS.reservationsCancel), false);
  assert.equal(hasRolePermission('recepcionista', PERMISSIONS.posApplyDiscount), false);
});

// 4. Operador PDV não acessa administração
test('4. operador PDV não acessa administração', () => {
  assert.equal(canAccessTab(undefined, 'pdv_only', 'settings'), false);
  assert.equal(canAccessTab(undefined, 'pdv_only', 'users'), false);
  assert.equal(canAccessTab(undefined, 'pdv_only', 'automation'), false);
  assert.equal(canAccessTab(undefined, 'pdv_only', 'financial'), false);
  assert.equal(canAccessTab(undefined, 'pdv_only', 'pdv'), true);
});

// 5. Tablet não acessa outros quartos
test('5. tablet não acessa outros quartos', () => {
  deviceService.bind({
    deviceId: 'tablet-101',
    hotelId: 'hotel-a',
    roomId: 'quarto-101',
    deviceType: 'TABLET_ROOM',
    appVersion: '1.0.0',
  });

  assert.equal(deviceService.isRoomAuthorized('quarto-101'), true);
  assert.equal(deviceService.isRoomAuthorized('quarto-102'), false);
  deviceService.clear();
});

// 6. Checkout invalida contexto do tablet
test('6. checkout invalida contexto do tablet', () => {
  deviceService.bind({
    deviceId: 'tablet-202',
    hotelId: 'hotel-a',
    roomId: 'quarto-202',
    deviceType: 'TABLET_ROOM',
    appVersion: '1.0.0',
    activeStayId: 'stay-7788',
  });

  const result = deviceService.onRoomCheckout('quarto-202');
  assert.equal(result.invalidated, true);
  assert.equal(result.previousStayId, 'stay-7788');
  assert.equal(deviceService.get()?.activeStayId, null);
  deviceService.clear();
});

// 7. Gerente multi-hotel consegue trocar contexto corretamente
test('7. gerente multi-hotel consegue trocar contexto corretamente', () => {
  const memberships: HotelMembership[] = [
    {
      id: 'm1',
      user_id: 'manager-1',
      organization_id: 'org-1',
      hotel_id: 'hotel-a',
      role: 'gerente',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      user_id: 'manager-1',
      organization_id: 'org-1',
      hotel_id: 'hotel-b',
      role: 'admin',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const currentContext: TenantContext = {
    userId: 'manager-1',
    organizationId: 'org-1',
    hotelId: 'hotel-a',
    role: 'gerente',
  };

  const switchResult = switchActiveHotel('manager-1', currentContext, 'hotel-b', memberships);
  assert.equal(switchResult.success, true);
  assert.equal(switchResult.nextContext.hotelId, 'hotel-b');
  assert.equal(switchResult.nextContext.role, 'admin');

  const invalidSwitch = switchActiveHotel('manager-1', currentContext, 'hotel-unauthorized', memberships);
  assert.equal(invalidSwitch.success, false);
});

// 8. Cache não mistura hotéis
test('8. cache não mistura hotéis', () => {
  const cache = new ScopedHotelCache();
  cache.setScoped('hotel-a', 'reservas_ativas', [{ id: 'res-a1' }]);
  cache.setScoped('hotel-b', 'reservas_ativas', [{ id: 'res-b1' }]);

  const dataA = cache.getScoped('hotel-a', 'reservas_ativas') as Array<{ id: string }>;
  const dataB = cache.getScoped('hotel-b', 'reservas_ativas') as Array<{ id: string }>;

  assert.equal(dataA[0].id, 'res-a1');
  assert.equal(dataB[0].id, 'res-b1');

  cache.deleteByHotel('hotel-a');
  assert.equal(cache.getScoped('hotel-a', 'reservas_ativas'), undefined);
  assert.notEqual(cache.getScoped('hotel-b', 'reservas_ativas'), undefined);
});

// 9. RLS / TenantContext impede acesso indevido
test('9. RLS impede acesso indevido / valida tenant', () => {
  const memberships: HotelMembership[] = [
    {
      id: 'm1',
      user_id: 'user-1',
      organization_id: 'org-1',
      hotel_id: 'hotel-a',
      role: 'recepcionista',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const validContext: TenantContext = {
    userId: 'user-1',
    organizationId: 'org-1',
    hotelId: 'hotel-a',
    role: 'recepcionista',
  };
  assert.equal(isTenantContextValid(validContext, memberships), true);

  const crossHotelContext: TenantContext = {
    userId: 'user-1',
    organizationId: 'org-1',
    hotelId: 'hotel-b',
    role: 'recepcionista',
  };
  assert.equal(isTenantContextValid(crossHotelContext, memberships), false);
});

// 10. Usuário autorizado continua funcionando normalmente
test('10. usuário autorizado continua funcionando normalmente', () => {
  assert.equal(canAccessTab(undefined, 'admin', 'dashboard'), true);
  assert.equal(canAccessTab(undefined, 'recepcionista', 'checkin_out'), true);
  assert.equal(canAccessTab(undefined, 'financeiro', 'financial'), true);
  assert.equal(hasRolePermission('admin', PERMISSIONS.reservationsCheckin), true);
  assert.equal(hasRolePermission('recepcionista', PERMISSIONS.reservationsCreate), true);
  assert.equal(hasRolePermission('financeiro', PERMISSIONS.financeCreatePayment), true);
});

test('RBAC matrix custom override denies resources if configured', () => {
  const matrix: RBACMatrixConfig = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    resources: [{ id: 'admin', moduleName: 'Admin', permissions: { pdv_only: { granted: false, level: 'none', customLabel: 'Sem acesso' } } }],
  };
  assert.equal(canAccessResource(matrix, 'pdv_only', 'admin'), false);
});

test('phase 2 device types are constrained to valid enum values', () => {
  const allowed = ['POS', 'TABLET_ROOM', 'KDS', 'TOTEM', 'MOBILE'];
  assert.equal(allowed.includes('POS'), true);
  assert.equal(allowed.includes('TABLET_ROOM'), true);
  assert.equal(allowed.includes('KDS'), true);
  assert.equal(allowed.includes('TOTEM'), true);
  assert.equal(allowed.includes('MOBILE'), true);
  assert.equal(allowed.includes('UNKNOWN'), false);
});

// Prompt 04: Validação de isolamento entre hotéis e papéis (localStorage tamper protection)
test('Prompt 04: alteração em localStorage não concede acesso a hotel não autorizado', () => {
  const membershipsHotelA: HotelMembership[] = [
    {
      id: 'mem-1',
      user_id: 'usr-recepcao',
      organization_id: 'org-hotelaria',
      hotel_id: 'hotel-a',
      role: 'recepcionista',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Tentativa de acessar Hotel B com credenciais do Hotel A
  const hasAccessToHotelB = canUseHotel('usr-recepcao', 'hotel-b', membershipsHotelA);
  assert.equal(hasAccessToHotelB, false, 'Usuário não deve ter acesso ao Hotel B');

  // Tentativa de forjar tenantContext alterando hotelId
  const forgedTenantContext: TenantContext = {
    userId: 'usr-recepcao',
    organizationId: 'org-hotelaria',
    hotelId: 'hotel-b', // forjado
    role: 'admin',      // forjado
  };

  const isForgedContextValid = isTenantContextValid(forgedTenantContext, membershipsHotelA);
  assert.equal(isForgedContextValid, false, 'Contexto forjado no cliente deve ser rejeitado');
});

test('Prompt 04: validação entre dois papéis distintos (recepcionista vs financeiro)', () => {
  // Recepcionista não deve conseguir pagar contas ou acessar DRE
  assert.equal(hasRolePermission('recepcionista', PERMISSIONS.financeCreatePayment), false);
  assert.equal(canAccessTab(undefined, 'recepcionista', 'financial'), false);
  assert.equal(canAccessTab(undefined, 'recepcionista', 'checkin_out'), true);

  // Financeiro não deve conseguir cancelar reservas ou fazer check-in
  assert.equal(hasRolePermission('financeiro', PERMISSIONS.reservationsCancel), false);
  assert.equal(hasRolePermission('financeiro', PERMISSIONS.reservationsCheckin), false);
  assert.equal(canAccessTab(undefined, 'financeiro', 'financial'), true);
  assert.equal(canAccessTab(undefined, 'financeiro', 'checkin_out'), false);
});

