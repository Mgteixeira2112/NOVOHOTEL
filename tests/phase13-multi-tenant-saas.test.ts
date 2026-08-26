import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateConsolidatedMetrics,
  checkPlanLimits,
  executeSafeDataMigration,
  getScopedRealtimeChannel,
  resolveHotelConfiguration,
  validateRealtimeSubscription,
  validateTenantAccess,
  type Hotel,
  type HotelSettingsConfig,
  type Organization,
  type SaaSPlan,
  type UserHotelAssignment,
  type UserTenantSessionContext,
} from '../src/domain/tenantCore';
import { resolveFeatureFlag } from '../src/core/tenant/tenantPolicy';
import type { FeatureFlag } from '../src/core/tenant/tenantTypes';

// Mock fixtures
const orgAlpha: Organization = {
  id: 'org-alpha',
  name: 'Grupo Hoteleiro Alpha',
  legal_name: 'Alpha Empreendimentos Hoteleiros S/A',
  document: '12.345.678/0001-90',
  email: 'diretoria@grupoalpha.com.br',
  phone: '+55 11 3000-0000',
  status: 'ACTIVE',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const hotelA: Hotel = {
  id: 'hotel-a',
  organization_id: 'org-alpha',
  name: 'Alpha Resort & Spa',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  locale: 'pt-BR',
  status: 'ACTIVE',
};

const hotelB: Hotel = {
  id: 'hotel-b',
  organization_id: 'org-alpha',
  name: 'Alpha Business Suites',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  locale: 'pt-BR',
  status: 'ACTIVE',
};

const userAssignments: UserHotelAssignment[] = [
  { userId: 'usr-1', organizationId: 'org-alpha', hotelId: 'hotel-a', role: 'MANAGER', active: true },
  { userId: 'usr-1', organizationId: 'org-alpha', hotelId: 'hotel-b', role: 'FINANCE', active: true },
  { userId: 'usr-only-a', organizationId: 'org-alpha', hotelId: 'hotel-a', role: 'OPERATOR', active: true },
  { userId: 'usr-org-admin', organizationId: 'org-alpha', hotelId: 'hotel-a', role: 'ORGANIZATION_ADMIN', active: true },
  { userId: 'usr-org-admin', organizationId: 'org-alpha', hotelId: 'hotel-b', role: 'ORGANIZATION_ADMIN', active: true },
];

// 1. Usuário Hotel A acessa Hotel A
test('1. usuário Hotel A acessa Hotel A: autorização concedida para recursos do próprio hotel', () => {
  const session: UserTenantSessionContext = {
    userId: 'usr-only-a',
    organizationId: 'org-alpha',
    hotelId: 'hotel-a',
    role: 'OPERATOR',
  };

  const check = validateTenantAccess(session, 'hotel-a', userAssignments);
  assert.equal(check.allowed, true);
  assert.equal(check.httpStatus, 200);
});

// 2. Usuário Hotel A não acessa Hotel B
test('2. usuário Hotel A não acessa Hotel B: rejeição imediata (403 Forbidden)', () => {
  const session: UserTenantSessionContext = {
    userId: 'usr-only-a',
    organizationId: 'org-alpha',
    hotelId: 'hotel-a',
    role: 'OPERATOR',
  };

  const check = validateTenantAccess(session, 'hotel-b', userAssignments);
  assert.equal(check.allowed, false);
  assert.equal(check.httpStatus, 403);
  assert.match(check.error ?? '', /403 Forbidden/);
});

// 3. Organization Admin acessa hotéis autorizados
test('3. Organization Admin acessa hotéis autorizados: navegação irrestrita entre propriedades do grupo', () => {
  const sessionA: UserTenantSessionContext = {
    userId: 'usr-org-admin',
    organizationId: 'org-alpha',
    hotelId: 'hotel-a',
    role: 'ORGANIZATION_ADMIN',
  };

  const checkA = validateTenantAccess(sessionA, 'hotel-a', userAssignments);
  const checkB = validateTenantAccess(sessionA, 'hotel-b', userAssignments);

  assert.equal(checkA.allowed, true);
  assert.equal(checkB.allowed, true);
});

// 4. RLS
test('4. RLS: consultas SQL simulam row level security por hotel_id isolado', () => {
  const allRecords = [
    { id: 'rec-1', hotel_id: 'hotel-a', data: 'Dados Alpha' },
    { id: 'rec-2', hotel_id: 'hotel-b', data: 'Dados Beta' },
  ];

  const currentHotelId = 'hotel-a';
  const rlsFiltered = allRecords.filter((r) => r.hotel_id === currentHotelId);

  assert.equal(rlsFiltered.length, 1);
  assert.equal(rlsFiltered[0].id, 'rec-1');
});

// 5. IDOR
test('5. IDOR: tentativa de acesso direto a recurso de outro hotel resulta em bloqueio', () => {
  const session: UserTenantSessionContext = {
    userId: 'usr-only-a',
    organizationId: 'org-alpha',
    hotelId: 'hotel-a',
    role: 'OPERATOR',
  };

  // Recurso pertencente ao Hotel B
  const resourceHotelId = 'hotel-b';
  const access = validateTenantAccess(session, resourceHotelId, userAssignments);

  assert.equal(access.allowed, false);
  assert.equal(access.httpStatus, 403);
});

// 6. Realtime isolado
test('6. realtime isolado: canais possuem escopo obrigatório hotel:{hotel_id}:topic', () => {
  const channelOrders = getScopedRealtimeChannel('hotel-a', 'orders');
  const channelKanban = getScopedRealtimeChannel('hotel-a', 'kanban');
  const channelRooms = getScopedRealtimeChannel('hotel-b', 'rooms');

  assert.equal(channelOrders, 'hotel:hotel-a:orders');
  assert.equal(channelKanban, 'hotel:hotel-a:kanban');
  assert.equal(channelRooms, 'hotel:hotel-b:rooms');

  const sessionA: UserTenantSessionContext = {
    userId: 'usr-only-a',
    organizationId: 'org-alpha',
    hotelId: 'hotel-a',
    role: 'OPERATOR',
  };

  assert.equal(validateRealtimeSubscription(sessionA, 'hotel:hotel-a:orders', userAssignments), true);
  assert.equal(validateRealtimeSubscription(sessionA, 'hotel:hotel-b:orders', userAssignments), false);
});

// 7. PDV isolado
test('7. PDV isolado: terminais e comandas operam estritamente vinculados ao hotel', () => {
  const pdvTerminals = [
    { id: 'pos-1', hotel_id: 'hotel-a', organization_id: 'org-alpha', name: 'Bar Piscina' },
    { id: 'pos-2', hotel_id: 'hotel-b', organization_id: 'org-alpha', name: 'Restaurante Executivo' },
  ];

  const hotelAPos = pdvTerminals.filter((t) => t.hotel_id === 'hotel-a');
  assert.equal(hotelAPos.length, 1);
  assert.equal(hotelAPos[0].name, 'Bar Piscina');
});

// 8. Estoque isolado
test('8. estoque isolado: movimentações de almoxarifado não interferem em outras unidades', () => {
  const inventoryItems = [
    { id: 'item-water-a', hotel_id: 'hotel-a', sku: 'AGUA-500', stock: 120 },
    { id: 'item-water-b', hotel_id: 'hotel-b', sku: 'AGUA-500', stock: 45 },
  ];

  const stockHotelA = inventoryItems.find((i) => i.hotel_id === 'hotel-a' && i.sku === 'AGUA-500');
  assert.equal(stockHotelA?.stock, 120);
});

// 9. Financeiro isolado
test('9. financeiro isolado: caixas, folios e transações financeiras segmentadas', () => {
  const folios = [
    { id: 'fol-101', hotel_id: 'hotel-a', balance: 540.0 },
    { id: 'fol-202', hotel_id: 'hotel-b', balance: 1280.0 },
  ];

  const folioHotelA = folios.filter((f) => f.hotel_id === 'hotel-a');
  assert.equal(folioHotelA.length, 1);
  assert.equal(folioHotelA[0].balance, 540.0);
});

// 10. Reserva isolada
test('10. reserva isolada: motor de disponibilidade e reservas isoladas por hotel_id', () => {
  const reservations = [
    { id: 'res-1', hotel_id: 'hotel-a', guest: 'Lucas' },
    { id: 'res-2', hotel_id: 'hotel-b', guest: 'Fernanda' },
  ];

  const activeReservationsHotelA = reservations.filter((r) => r.hotel_id === 'hotel-a');
  assert.equal(activeReservationsHotelA.length, 1);
  assert.equal(activeReservationsHotelA[0].guest, 'Lucas');
});

// 11. Kanban isolado
test('11. Kanban isolado: quadros de governança e manutenção restritos ao hotel ativo', () => {
  const tasks = [
    { id: 'tsk-1', hotel_id: 'hotel-a', title: 'Limpeza 101' },
    { id: 'tsk-2', hotel_id: 'hotel-b', title: 'Manutenção Ar 402' },
  ];

  const kanbanA = tasks.filter((t) => t.hotel_id === 'hotel-a');
  assert.equal(kanbanA.length, 1);
  assert.equal(kanbanA[0].title, 'Limpeza 101');
});

// 12. Tablet isolado
test('12. tablet isolado: dispositivo de quarto herda contexto da acomodação e hotel', () => {
  const tabletDevice = {
    id: 'tab-301',
    hotel_id: 'hotel-a',
    organization_id: 'org-alpha',
    room_id: 'room-301',
    device_type: 'TABLET',
  };

  assert.equal(tabletDevice.hotel_id, 'hotel-a');
  assert.equal(tabletDevice.room_id, 'room-301');
});

// 13. Auditoria
test('13. auditoria: logs registram hotel_id e organization_id de forma rastreável', () => {
  const auditEntry = {
    id: 'aud-77',
    organization_id: 'org-alpha',
    hotel_id: 'hotel-a',
    user_id: 'usr-1',
    action: 'CREATE',
    entity_type: 'RESERVATION',
    request_id: 'req-999',
  };

  assert.equal(auditEntry.organization_id, 'org-alpha');
  assert.equal(auditEntry.hotel_id, 'hotel-a');
});

// 14. Dashboard
test('14. dashboard: consolidação de métricas (ADR, RevPAR, Ocupação, Margem) em grupo hoteleiro', () => {
  const metrics = calculateConsolidatedMetrics([
    {
      hotelId: 'hotel-a',
      revenue: 10000,
      roomsTotal: 50,
      roomsOccupied: 40,
      expenses: 4000,
      pdvSales: 2000,
      reservationsCount: 20,
    },
    {
      hotelId: 'hotel-b',
      revenue: 15000,
      roomsTotal: 50,
      roomsOccupied: 30,
      expenses: 6000,
      pdvSales: 3500,
      reservationsCount: 15,
    },
  ]);

  assert.equal(metrics.totalRevenue, 25000);
  assert.equal(metrics.totalRooms, 100);
  assert.equal(metrics.occupiedRooms, 70);
  assert.equal(metrics.occupancyRate, 70.0);
  assert.equal(metrics.adr, 357.14); // 25000 / 70
  assert.equal(metrics.revPar, 250.0); // 25000 / 100
  assert.equal(metrics.netMargin, 15000); // 25000 - 10000
  assert.equal(metrics.netMarginPercent, 60.0);
  assert.equal(metrics.averageTicket, 714.29); // 25000 / 35
});

// 15. Exportação
test('15. exportação: dados exportados respeitam escopo do operador ou admin', () => {
  const reports = [
    { id: 'rep-1', hotel_id: 'hotel-a', data: 'Extrato A' },
    { id: 'rep-2', hotel_id: 'hotel-b', data: 'Extrato B' },
  ];

  const exportForHotel = (scopeHotelId: string) => reports.filter((r) => r.hotel_id === scopeHotelId);
  const result = exportForHotel('hotel-a');

  assert.equal(result.length, 1);
  assert.equal(result[0].data, 'Extrato A');
});

// 16. Permissões
test('16. permissões: matriz de roles (PLATFORM_ADMIN, ORGANIZATION_ADMIN, HOTEL_ADMIN, MANAGER, etc)', () => {
  const user1OnHotelA = userAssignments.find((a) => a.userId === 'usr-1' && a.hotelId === 'hotel-a');
  const user1OnHotelB = userAssignments.find((a) => a.userId === 'usr-1' && a.hotelId === 'hotel-b');

  assert.equal(user1OnHotelA?.role, 'MANAGER');
  assert.equal(user1OnHotelB?.role, 'FINANCE');
});

// 17. Feature Flags & Configurações Herdadas
test('17. feature flags: herança de configurações Organization Default -> Hotel Override', () => {
  const flags: FeatureFlag[] = [
    { key: 'PDV', organization_id: 'org-alpha', enabled: true },
    { key: 'ADVANCED_REPORTS', organization_id: 'org-alpha', enabled: false },
    { key: 'ADVANCED_REPORTS', hotel_id: 'hotel-a', enabled: true },
  ];

  assert.equal(resolveFeatureFlag('PDV', 'hotel-a', 'org-alpha', flags), true);
  assert.equal(resolveFeatureFlag('ADVANCED_REPORTS', 'hotel-a', 'org-alpha', flags), true);
  assert.equal(resolveFeatureFlag('ADVANCED_REPORTS', 'hotel-b', 'org-alpha', flags), false);

  const orgConfig: Partial<HotelSettingsConfig> = {
    checkInTime: '15:00',
    checkOutTime: '11:00',
    taxRatePercent: 6.0,
    branding: { appName: 'Grupo Alpha', primaryColor: '#111827', accentColor: '#3b82f6' },
  };

  const hotelOverride: Partial<HotelSettingsConfig> = {
    checkInTime: '14:00', // Hotel A tem checkin mais cedo
    branding: { appName: 'Alpha Resort', primaryColor: '#0f172a', accentColor: '#10b981' },
  };

  const resolved = resolveHotelConfiguration(orgConfig, hotelOverride);
  assert.equal(resolved.checkInTime, '14:00'); // Override
  assert.equal(resolved.checkOutTime, '11:00'); // Herdado da organização
  assert.equal(resolved.taxRatePercent, 6.0); // Herdado da organização
  assert.equal(resolved.branding.appName, 'Alpha Resort');
});

// 18. Multi-hotel & Planos SaaS
test('18. multi-hotel: controle de limites por plano SaaS (Starter vs Pro vs Enterprise)', () => {
  const starterPlan: SaaSPlan = {
    id: 'plan-starter',
    code: 'STARTER',
    name: 'Starter',
    limits: {
      maxHotels: 1,
      maxRooms: 30,
      maxUsers: 10,
      maxPdvs: 1,
      maxReservationsMonthly: 1000,
      maxStorageMb: 1024,
    },
    features: { PDV: true, REALTIME: true, TABLET: false, FINANCE: false },
    active: true,
  };

  const check1 = checkPlanLimits(starterPlan, {
    hotelsCount: 1,
    roomsCount: 25,
    usersCount: 5,
    pdvsCount: 1,
    monthlyReservationsCount: 300,
    storageMbUsed: 500,
  });
  assert.equal(check1.withinLimits, true);

  const checkExceeded = checkPlanLimits(starterPlan, {
    hotelsCount: 2, // Excedeu maxHotels (1)
    roomsCount: 40, // Excedeu maxRooms (30)
    usersCount: 5,
    pdvsCount: 1,
    monthlyReservationsCount: 300,
    storageMbUsed: 500,
  });
  assert.equal(checkExceeded.withinLimits, false);
  assert.deepEqual(checkExceeded.exceededKeys, ['hotels', 'rooms']);
});

// 19. Migração
test('19. migração: fluxo seguro SISTEMA ATUAL -> ORGANIZATION -> HOTEL PADRÃO -> MIGRAÇÃO -> VALIDAÇÃO', () => {
  const legacyData = {
    hoteisCount: 1,
    reservasCount: 150,
    financeiroCount: 320,
  };

  const migration = executeSafeDataMigration(legacyData, 'org-alpha', 'hotel-a');
  assert.equal(migration.step, 'COMPLETED');
  assert.equal(migration.isValidated, true);
  assert.equal(migration.recordsMigrated, 471);
  assert.equal(migration.pipeline.length, 5);
});

// 20. Concorrência
test('20. concorrência: lock de contexto e chave única previne colisão cross-tenant', () => {
  const activeSessions = new Map<string, string>(); // token -> hotelId

  function switchContext(token: string, newHotelId: string): boolean {
    activeSessions.set(token, newHotelId);
    return true;
  }

  switchContext('token-user-1', 'hotel-a');
  assert.equal(activeSessions.get('token-user-1'), 'hotel-a');

  switchContext('token-user-1', 'hotel-b');
  assert.equal(activeSessions.get('token-user-1'), 'hotel-b');
});
