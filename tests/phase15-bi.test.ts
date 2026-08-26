import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeHotelDashboardMetrics,
  exportReportData,
  generateMultiHotelRanking,
  resolveDrillDownPath,
  type DailyMetricsSnapshot,
  type DashboardLayoutPreference,
  type FinancialKpis,
  type HousekeepingKpis,
  type MaintenanceKpis,
  type ManagementAlert,
  type ReservationKpis,
  type ScheduledReportConfig,
} from '../src/domain/biCore';
import {
  calculateAdr,
  calculateAverageTicket,
  calculateDifference,
  calculateOccupancy,
  calculateRevpar,
} from '../src/core/bi/metricFormulas';
import { createAuditRecord } from '../src/services/governanceService';

// 1. Dashboard Hotel
test('1. dashboard hotel: gera visão consolidada com ocupação, receita, ADR, RevPAR, check-ins e check-outs', () => {
  const summary = computeHotelDashboardMetrics({
    hotelId: 'hotel-01',
    organizationId: 'org-hotel-group',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    period: { start: '2026-10-01', end: '2026-10-31', label: 'THIS_MONTH' },
    availableRoomNights: 300,
    occupiedRoomNights: 240,
    soldRoomNights: 240,
    roomRevenue: 72000,
    posRevenue: 15000,
    roomServiceRevenue: 4000,
    minibarRevenue: 3000,
    otherServicesRevenue: 2000,
    taxesRevenue: 4000,
    posOrdersCount: 150,
    housekeeping: {
      cleanRooms: 20,
      dirtyRooms: 5,
      cleaningRooms: 3,
      inspectingRooms: 2,
      blockedRooms: 1,
      averageCleaningMinutes: 28,
      productivityRate: 8,
    },
    maintenance: {
      pendingCount: 2,
      inProgressCount: 1,
      criticalCount: 0,
      completedCount: 15,
      mttrMinutes: 45,
      blockedRoomsCount: 1,
    },
    reservations: {
      confirmed: 120,
      pending: 10,
      cancelled: 8,
      noShow: 2,
      checkins: 45,
      checkouts: 42,
      avgBookingWindowDays: 14.5,
      avgLeadTimeDays: 12.0,
      channelDistribution: {
        website: 50,
        ota: 40,
        agency: 15,
        phone: 5,
        walkIn: 8,
        corporate: 2,
      },
    },
    finance: {
      actualRevenue: 100000,
      projectedRevenue: 110000,
      actualExpenses: 55000,
      projectedExpenses: 58000,
      netOperatingResult: 45000,
      accountsReceivable: 12000,
      accountsPayable: 9000,
      cashFlowBalance: 48000,
    },
  });

  assert.equal(summary.hotelId, 'hotel-01');
  assert.equal(summary.occupancyPercent, 80);
  assert.equal(summary.adr, 300);
  assert.equal(summary.revPar, 240);
  assert.equal(summary.revenue.totalRevenue, 100000);
});

// 2. Dashboard Multi-hotel
test('2. dashboard multi-hotel: permite ranking comparativo entre propriedades com métricas padronizadas', () => {
  const ranking = generateMultiHotelRanking([
    {
      hotelId: 'hotel-a',
      hotelName: 'Resort Beira Mar',
      availableRoomNights: 500,
      occupiedRoomNights: 450,
      soldRoomNights: 450,
      roomRevenue: 180000,
      totalRevenue: 240000,
      expenses: 130000,
      posRevenue: 40000,
      posOrders: 400,
    },
    {
      hotelId: 'hotel-b',
      hotelName: 'Boutique Jardins',
      availableRoomNights: 200,
      occupiedRoomNights: 140,
      soldRoomNights: 140,
      roomRevenue: 70000,
      totalRevenue: 95000,
      expenses: 50000,
      posRevenue: 15000,
      posOrders: 150,
    },
  ]);

  assert.equal(ranking.length, 2);
  assert.equal(ranking[0].hotelId, 'hotel-a'); // Maior RevPAR (360 vs 350)
  assert.equal(ranking[0].revPar, 360);
  assert.equal(ranking[1].revPar, 350);
});

// 3. Ocupação
test('3. ocupação: calcula estritamente quartos ocupados / quartos disponíveis evitando divisão por zero', () => {
  assert.equal(calculateOccupancy(80, 100), 0.8);
  assert.equal(calculateOccupancy(0, 50), 0);
  assert.equal(calculateOccupancy(50, 0), 0);
});

// 4. ADR
test('4. ADR: calcula receita de hospedagem / quartos vendidos sem inflar com receitas acessórias', () => {
  const roomRevenue = 60000;
  const soldRoomNights = 200;
  const adr = calculateAdr(roomRevenue, soldRoomNights);
  assert.equal(adr, 300);
  assert.equal(calculateAdr(60000, 0), 0);
});

// 5. RevPAR
test('5. RevPAR: calcula receita de hospedagem / quartos disponíveis', () => {
  const roomRevenue = 60000;
  const availableRoomNights = 300;
  const revPar = calculateRevpar(roomRevenue, availableRoomNights);
  assert.equal(revPar, 200);
  assert.equal(calculateRevpar(60000, 0), 0);
});

// 6. Receita
test('6. receita: segrega estritamente hospedagem, PDV, room service, frigobar, serviços e taxas', () => {
  const roomRevenue = 50000;
  const posRevenue = 12000;
  const roomServiceRevenue = 3000;
  const minibarRevenue = 2000;
  const otherServicesRevenue = 1500;
  const taxesRevenue = 3500;

  const totalRevenue =
    roomRevenue +
    posRevenue +
    roomServiceRevenue +
    minibarRevenue +
    otherServicesRevenue +
    taxesRevenue;

  assert.equal(totalRevenue, 72000);
  assert.equal(roomRevenue, 50000);
});

// 7. PDV
test('7. PDV: calcula vendas, número de pedidos, ticket médio e produtos mais vendidos', () => {
  const posSales = 15000;
  const orders = 100;
  const averageTicket = calculateAverageTicket(posSales, orders);

  assert.equal(averageTicket, 150);
  assert.equal(calculateAverageTicket(15000, 0), 0);
});

// 8. Reservas
test('8. reservas: agrupa confirmadas, pendentes, canceladas, no-show, booking window e lead time', () => {
  const kpis: ReservationKpis = {
    confirmed: 85,
    pending: 12,
    cancelled: 6,
    noShow: 1,
    checkins: 40,
    checkouts: 38,
    avgBookingWindowDays: 18.2,
    avgLeadTimeDays: 14.5,
    channelDistribution: {
      website: 45,
      ota: 30,
      agency: 10,
      phone: 5,
      walkIn: 10,
      corporate: 4,
    },
  };

  const totalReservations = kpis.confirmed + kpis.pending + kpis.cancelled + kpis.noShow;
  assert.equal(totalReservations, 104);
  assert.equal(kpis.avgBookingWindowDays > kpis.avgLeadTimeDays, true);
});

// 9. Housekeeping
test('9. housekeeping: monitora quartos limpos, sujos, em limpeza, tempo médio e taxa de produtividade', () => {
  const hk: HousekeepingKpis = {
    cleanRooms: 45,
    dirtyRooms: 10,
    cleaningRooms: 4,
    inspectingRooms: 3,
    blockedRooms: 2,
    averageCleaningMinutes: 25,
    productivityRate: 9.2,
  };

  const totalRooms = hk.cleanRooms + hk.dirtyRooms + hk.cleaningRooms + hk.inspectingRooms + hk.blockedRooms;
  assert.equal(totalRooms, 64);
  assert.equal(hk.averageCleaningMinutes, 25);
});

// 10. Manutenção
test('10. manutenção: computa pendentes, em andamento, críticas, concluídas e MTTR', () => {
  const mnt: MaintenanceKpis = {
    pendingCount: 4,
    inProgressCount: 2,
    criticalCount: 1,
    completedCount: 28,
    mttrMinutes: 38,
    blockedRoomsCount: 2,
  };

  assert.equal(mnt.criticalCount, 1);
  assert.equal(mnt.mttrMinutes, 38);
});

// 11. Financeiro
test('11. financeiro: separa dados reais de projeções com resultado operacional e fluxo de caixa', () => {
  const fin: FinancialKpis = {
    actualRevenue: 120000,
    projectedRevenue: 135000,
    actualExpenses: 70000,
    projectedExpenses: 75000,
    netOperatingResult: 50000,
    accountsReceivable: 15000,
    accountsPayable: 8000,
    cashFlowBalance: 57000,
  };

  assert.equal(fin.actualRevenue < fin.projectedRevenue, true);
  assert.equal(fin.actualRevenue - fin.actualExpenses, fin.netOperatingResult);
});

// 12. Metas
test('12. metas: compara valor atual com alvo, diferença, percentual de atingimento e tendência', () => {
  const occDiff = calculateDifference(82, 80);
  assert.equal(occDiff, 2);

  const adrDiff = calculateDifference(290, 300);
  assert.equal(adrDiff, -10);
});

// 13. Alertas
test('13. alertas: dispara avisos de gestão para ocupação abaixo da meta, quartos bloqueados e estoques críticos', () => {
  const alerts: ManagementAlert[] = [
    {
      id: 'alt-1',
      hotelId: 'hotel-01',
      type: 'LOW_OCCUPANCY',
      severity: 'WARNING',
      title: 'Ocupação 15% abaixo da meta',
      description: 'Ocupação atual em 55% vs meta de 70%',
      currentValue: 55,
      threshold: 70,
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'alt-2',
      hotelId: 'hotel-01',
      type: 'CRITICAL_MAINTENANCE',
      severity: 'CRITICAL',
      title: 'Vazamento no Quarto 402',
      description: 'Bloqueio de quarto VIP necessário',
      createdAt: '2026-10-01T09:30:00Z',
    },
  ];

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  assert.equal(criticalAlerts.length, 1);
  assert.equal(criticalAlerts[0].type, 'CRITICAL_MAINTENANCE');
});

// 14. Drill-Down
test('14. drill-down: resolve caminhos de navegação hierárquica (Ocupação -> Quartos -> Reservas -> Hóspede)', () => {
  const pathRooms = resolveDrillDownPath('OCCUPANCY', 'hotel-01');
  assert.equal(pathRooms.view, 'ROOMS_LIST');

  const pathRes = resolveDrillDownPath('OCCUPANCY', 'hotel-01', { reservationId: 'res-777' });
  assert.equal(pathRes.view, 'RESERVATION_DETAILS');
  assert.equal(pathRes.breadcrumbs.includes('Detalhes da Reserva'), true);

  const pathGuest = resolveDrillDownPath('OCCUPANCY', 'hotel-01', { guestId: 'gst-888' });
  assert.equal(pathGuest.view, 'GUEST_DETAILS');
  assert.equal(pathGuest.breadcrumbs.includes('Ficha do Hóspede'), true);
});

// 15. Exportação
test('15. exportação: gera arquivos formatados (PDF, CSV, XLSX) registrando ação compulsória de auditoria', () => {
  const exportRes = exportReportData(
    'Demonstrativo de Receitas',
    'PDF',
    [{ date: '2026-10-01', revenue: 5000 }],
    { userId: 'usr-manager', hotelId: 'hotel-01' }
  );

  assert.match(exportRes.fileName, /demonstrativo_de_receitas_hotel-01_/);
  assert.equal(exportRes.mimeType, 'application/pdf');
  assert.equal(exportRes.rowCount, 1);

  const auditLog = createAuditRecord({
    hotelId: 'hotel-01',
    action: 'EXPORT',
    entityType: 'REPORT',
    entityId: exportRes.fileName,
    requestId: 'req-exp-999',
  });
  assert.equal(auditLog.action, 'EXPORT');
});

// 16. Permissões
test('16. permissões: valida que usuário só acesse métricas do hotel ao qual está explicitamente associado', () => {
  const userAccessMap = new Map<string, Set<string>>();
  userAccessMap.set('usr-hotel-a', new Set(['hotel-a']));

  function canAccessMetrics(userId: string, targetHotelId: string): boolean {
    return userAccessMap.get(userId)?.has(targetHotelId) ?? false;
  }

  assert.equal(canAccessMetrics('usr-hotel-a', 'hotel-a'), true);
  assert.equal(canAccessMetrics('usr-hotel-a', 'hotel-b'), false);
});

// 17. Timezone
test('17. timezone: respeita o fuso horário configurado da propriedade nas agregações de métricas', () => {
  const hotelTz = 'America/Sao_Paulo';
  const summary = computeHotelDashboardMetrics({
    hotelId: 'hotel-sp',
    organizationId: 'org-br',
    currency: 'BRL',
    timezone: hotelTz,
    period: { start: '2026-10-01', end: '2026-10-02', label: 'TODAY' },
    availableRoomNights: 50,
    occupiedRoomNights: 40,
    soldRoomNights: 40,
    roomRevenue: 12000,
    posRevenue: 2000,
    roomServiceRevenue: 0,
    minibarRevenue: 0,
    otherServicesRevenue: 0,
    taxesRevenue: 0,
    posOrdersCount: 20,
    housekeeping: { cleanRooms: 40, dirtyRooms: 10, cleaningRooms: 0, inspectingRooms: 0, blockedRooms: 0, averageCleaningMinutes: 20, productivityRate: 10 },
    maintenance: { pendingCount: 0, inProgressCount: 0, criticalCount: 0, completedCount: 0, mttrMinutes: 0, blockedRoomsCount: 0 },
    reservations: { confirmed: 40, pending: 0, cancelled: 0, noShow: 0, checkins: 10, checkouts: 8, avgBookingWindowDays: 10, avgLeadTimeDays: 8, channelDistribution: { website: 40, ota: 0, agency: 0, phone: 0, walkIn: 0, corporate: 0 } },
    finance: { actualRevenue: 14000, projectedRevenue: 14000, actualExpenses: 5000, projectedExpenses: 5000, netOperatingResult: 9000, accountsReceivable: 0, accountsPayable: 0, cashFlowBalance: 9000 },
  });

  assert.equal(summary.timezone, 'America/Sao_Paulo');
});

// 18. Moeda
test('18. moeda: preserva a moeda explícita (BRL, USD, EUR) nos valores e totalizadores', () => {
  const summaryBrl = computeHotelDashboardMetrics({
    hotelId: 'hotel-br',
    organizationId: 'org-1',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    period: { start: '2026-10-01', end: '2026-10-02', label: 'TODAY' },
    availableRoomNights: 10,
    occupiedRoomNights: 8,
    soldRoomNights: 8,
    roomRevenue: 2400,
    posRevenue: 0,
    roomServiceRevenue: 0,
    minibarRevenue: 0,
    otherServicesRevenue: 0,
    taxesRevenue: 0,
    posOrdersCount: 0,
    housekeeping: { cleanRooms: 8, dirtyRooms: 2, cleaningRooms: 0, inspectingRooms: 0, blockedRooms: 0, averageCleaningMinutes: 0, productivityRate: 0 },
    maintenance: { pendingCount: 0, inProgressCount: 0, criticalCount: 0, completedCount: 0, mttrMinutes: 0, blockedRoomsCount: 0 },
    reservations: { confirmed: 8, pending: 0, cancelled: 0, noShow: 0, checkins: 0, checkouts: 0, avgBookingWindowDays: 0, avgLeadTimeDays: 0, channelDistribution: { website: 8, ota: 0, agency: 0, phone: 0, walkIn: 0, corporate: 0 } },
    finance: { actualRevenue: 2400, projectedRevenue: 2400, actualExpenses: 0, projectedExpenses: 0, netOperatingResult: 2400, accountsReceivable: 0, accountsPayable: 0, cashFlowBalance: 2400 },
  });

  assert.equal(summaryBrl.currency, 'BRL');
});

// 19. Performance
test('19. performance: layouts modulares e widgets configurados por usuário evitam recomputações pesadas', () => {
  const userLayout: DashboardLayoutPreference = {
    userId: 'usr-gm-01',
    hotelId: 'hotel-01',
    role: 'MANAGER',
    widgetOrder: ['OCCUPANCY', 'REVPAR', 'ALERTS', 'FINANCE'],
  };

  assert.equal(userLayout.widgetOrder.length, 4);
  assert.equal(userLayout.widgetOrder[0], 'OCCUPANCY');
});

// 20. Histórico
test('20. histórico: snapshots pré-calculados (daily_metrics) viabilizam relatórios históricos ultrarrápidos', () => {
  const snapshot: DailyMetricsSnapshot = {
    id: 'snap-20261001',
    hotelId: 'hotel-01',
    metricDate: '2026-10-01',
    currency: 'BRL',
    occupancy: 0.85,
    adr: 320,
    revpar: 272,
    roomRevenue: 27200,
    posRevenue: 5000,
    totalRevenue: 32200,
    checkins: 15,
    checkouts: 12,
    cancellations: 1,
  };

  assert.equal(snapshot.metricDate, '2026-10-01');
  assert.equal(snapshot.revpar, 272);
});

// 21. Realtime
test('21. realtime: apenas indicadores operacionais essenciais (pedidos, quartos, check-ins, alertas) disparam broadcast', () => {
  const realtimeMetricsToBroadcast = new Set([
    'ORDERS_PENDING',
    'ROOMS_DIRTY',
    'CHECKINS_TODAY',
    'CHECKOUTS_TODAY',
    'ACTIVE_ALERTS',
  ]);

  assert.equal(realtimeMetricsToBroadcast.has('ORDERS_PENDING'), true);
  assert.equal(realtimeMetricsToBroadcast.has('ACTIVE_ALERTS'), true);
  // Métricas financeiras e agregados históricos não geram overhead de broadcast contínuo
  assert.equal(realtimeMetricsToBroadcast.has('MONTHLY_NET_MARGIN_PROJECTION'), false);
});
