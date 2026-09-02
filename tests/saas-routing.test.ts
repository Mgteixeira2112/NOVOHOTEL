import test from 'node:test';
import assert from 'node:assert/strict';
import { HOTEL_ROUTES, PLATFORM_ROUTES, PUBLIC_ROUTES, findSaaSRoute, routesForEnvironment } from '../src/routes/saasRouteCatalog';
import { resolveHotelRouteCompatibility } from '../src/routes/saasRouteCompatibility';
import { permissionPolicyForRoute } from '../src/routes/saasRoutePermissions';
import { SAAS_FIXED_MENU, menuItemForTab, roleCanSeeMenuItem } from '../src/navigation/saasFixedMenu';
import { PERMISSIONS } from '../src/core/permissions/permissionKeys';

test('catálogo separa os três ambientes SaaS', () => {
  assert.equal(routesForEnvironment('public').length, PUBLIC_ROUTES.length);
  assert.equal(routesForEnvironment('hotel').length, HOTEL_ROUTES.length);
  assert.equal(routesForEnvironment('platform').length, PLATFORM_ROUTES.length);
  assert.equal(findSaaSRoute('/app')?.environment, 'hotel');
  assert.equal(findSaaSRoute('/platform')?.environment, 'platform');
  assert.equal(findSaaSRoute('/')?.environment, 'public');
});

test('rotas estáveis do hotel apontam para telas existentes', () => {
  assert.deepEqual(resolveHotelRouteCompatibility('/app/reservas'), {
    routeId: 'hotel-reservations',
    mode: 'admin-screen',
    adminTab: 'reservations',
  });
  assert.equal(resolveHotelRouteCompatibility('/app/gestao/equipe')?.adminTab, 'users');
  assert.equal(resolveHotelRouteCompatibility('/app/gestao/hotel-os')?.adminTab, 'command_center');
  assert.equal(resolveHotelRouteCompatibility('/app/configuracoes/automacoes')?.adminTab, 'automation');
});

test('operação mantém fallback explícito para o Workspace legado', () => {
  assert.deepEqual(resolveHotelRouteCompatibility('/app/operacao'), {
    routeId: 'hotel-operations',
    mode: 'legacy-workspace',
  });
});

test('menu principal possui exatamente as nove áreas fixas do SaaS', () => {
  assert.deepEqual(SAAS_FIXED_MENU.map(section => section.label), [
    'Início',
    'Recepção',
    'Hospedagem',
    'Operação',
    'Alimentos & Bebidas',
    'Estoque',
    'Financeiro',
    'Gestão',
    'Configurações',
  ]);
  assert.equal(menuItemForTab('workspace_editor'), undefined);
});

test('restrições explícitas do menu continuam coerentes por perfil', () => {
  const finance = menuItemForTab('financial');
  const settings = menuItemForTab('settings');
  assert.ok(finance);
  assert.ok(settings);
  assert.equal(roleCanSeeMenuItem('financeiro', finance), true);
  assert.equal(roleCanSeeMenuItem('recepcionista', finance), false);
  assert.equal(roleCanSeeMenuItem('admin', settings), true);
  assert.equal(roleCanSeeMenuItem('recepcionista', settings), false);
});

test('rotas críticas exigem a permissão backend correspondente', () => {
  assert.equal(permissionPolicyForRoute('hotel-reservations').backendPermission, PERMISSIONS.reservationsView);
  assert.equal(permissionPolicyForRoute('hotel-rooms').backendPermission, PERMISSIONS.roomsView);
  assert.equal(permissionPolicyForRoute('hotel-pdv').backendPermission, PERMISSIONS.posView);
  assert.equal(permissionPolicyForRoute('hotel-finance').backendPermission, PERMISSIONS.financeView);
  assert.equal(permissionPolicyForRoute('hotel-settings').backendPermission, PERMISSIONS.adminManage);
});
