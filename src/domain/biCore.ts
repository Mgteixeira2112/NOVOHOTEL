import {
  calculateAdr,
  calculateAverageTicket,
  calculateDifference,
  calculateOccupancy,
  calculateRevpar,
} from '../core/bi/metricFormulas';

export interface MetricDefinition {
  code: string;
  name: string;
  description: string;
  formula: string;
  source: string;
  scope: 'HOTEL' | 'ORGANIZATION' | 'GLOBAL';
  periodGranularity: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  filters?: Record<string, unknown>;
}

export interface PeriodFilter {
  start: string; // ISO date YYYY-MM-DD
  end: string;   // ISO date YYYY-MM-DD
  label: 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM';
}

export interface RevenueBreakdown {
  roomRevenue: number;
  posRevenue: number;
  roomServiceRevenue: number;
  minibarRevenue: number;
  otherServicesRevenue: number;
  taxesRevenue: number;
  totalRevenue: number;
}

export interface HousekeepingKpis {
  cleanRooms: number;
  dirtyRooms: number;
  cleaningRooms: number;
  inspectingRooms: number;
  blockedRooms: number;
  averageCleaningMinutes: number;
  productivityRate: number; // ex: quartos por camareira/hora
}

export interface MaintenanceKpis {
  pendingCount: number;
  inProgressCount: number;
  criticalCount: number;
  completedCount: number;
  mttrMinutes: number; // Mean Time to Repair
  blockedRoomsCount: number;
}

export interface ReservationKpis {
  confirmed: number;
  pending: number;
  cancelled: number;
  noShow: number;
  checkins: number;
  checkouts: number;
  avgBookingWindowDays: number;
  avgLeadTimeDays: number;
  channelDistribution: {
    website: number;
    ota: number;
    agency: number;
    phone: number;
    walkIn: number;
    corporate: number;
  };
}

export interface FinancialKpis {
  actualRevenue: number;
  projectedRevenue: number;
  actualExpenses: number;
  projectedExpenses: number;
  netOperatingResult: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashFlowBalance: number;
}

export interface GoalComparison {
  metricCode: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  difference: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  achievementPercent: number;
}

export interface ManagementAlert {
  id: string;
  hotelId: string;
  type:
    | 'LOW_OCCUPANCY'
    | 'ROOMS_BLOCKED'
    | 'CRITICAL_MAINTENANCE'
    | 'LOW_STOCK'
    | 'FAILED_PAYMENT'
    | 'DELAYED_ORDER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  currentValue?: number;
  threshold?: number;
  createdAt: string;
}

export interface HotelDashboardSummary {
  hotelId: string;
  organizationId: string;
  currency: string;
  timezone: string;
  period: PeriodFilter;
  occupancyPercent: number;
  adr: number;
  revPar: number;
  revenue: RevenueBreakdown;
  housekeeping: HousekeepingKpis;
  maintenance: MaintenanceKpis;
  reservations: ReservationKpis;
  finance: FinancialKpis;
  goals: GoalComparison[];
  alerts: ManagementAlert[];
}

export interface MultiHotelRankingItem {
  hotelId: string;
  hotelName: string;
  occupancyPercent: number;
  adr: number;
  revPar: number;
  totalRevenue: number;
  expenses: number;
  netMarginPercent: number;
  averageTicket: number;
}

export interface DashboardLayoutPreference {
  userId: string;
  hotelId?: string | null;
  role: string;
  widgetOrder: string[]; // e.g. ['OCCUPANCY', 'REVENUE', 'ADR', 'ALERTS', 'HOUSEKEEPING']
  collapsedWidgets?: string[];
  isDefault?: boolean;
}

export interface ScheduledReportConfig {
  id: string;
  organizationId?: string | null;
  hotelId: string;
  reportCode: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  format: 'PDF' | 'CSV' | 'XLSX';
  recipientEmails: string[];
  lastSentAt?: string | null;
  active: boolean;
}

export interface DailyMetricsSnapshot {
  id: string;
  hotelId: string;
  metricDate: string;
  currency: string;
  occupancy: number;
  adr: number;
  revpar: number;
  roomRevenue: number;
  posRevenue: number;
  totalRevenue: number;
  checkins: number;
  checkouts: number;
  cancellations: number;
}

/**
 * 1. Calcula o resumo do dashboard hoteleiro com todas as métricas canônicas
 */
export function computeHotelDashboardMetrics(params: {
  hotelId: string;
  organizationId: string;
  currency: string;
  timezone: string;
  period: PeriodFilter;
  availableRoomNights: number;
  occupiedRoomNights: number;
  soldRoomNights: number;
  roomRevenue: number;
  posRevenue: number;
  roomServiceRevenue: number;
  minibarRevenue: number;
  otherServicesRevenue: number;
  taxesRevenue: number;
  posOrdersCount: number;
  housekeeping: HousekeepingKpis;
  maintenance: MaintenanceKpis;
  reservations: ReservationKpis;
  finance: FinancialKpis;
  goals?: { code: string; name: string; target: number }[];
  alerts?: ManagementAlert[];
}): HotelDashboardSummary {
  const occ = calculateOccupancy(params.occupiedRoomNights, params.availableRoomNights) * 100;
  const adr = calculateAdr(params.roomRevenue, params.soldRoomNights);
  const revPar = calculateRevpar(params.roomRevenue, params.availableRoomNights);
  const totalRev =
    params.roomRevenue +
    params.posRevenue +
    params.roomServiceRevenue +
    params.minibarRevenue +
    params.otherServicesRevenue +
    params.taxesRevenue;

  const revenueBreakdown: RevenueBreakdown = {
    roomRevenue: params.roomRevenue,
    posRevenue: params.posRevenue,
    roomServiceRevenue: params.roomServiceRevenue,
    minibarRevenue: params.minibarRevenue,
    otherServicesRevenue: params.otherServicesRevenue,
    taxesRevenue: params.taxesRevenue,
    totalRevenue: totalRev,
  };

  const calculatedGoals: GoalComparison[] = (params.goals || []).map((g) => {
    let curr = 0;
    if (g.code === 'OCCUPANCY') curr = occ;
    else if (g.code === 'ADR') curr = adr;
    else if (g.code === 'REVPAR') curr = revPar;
    else if (g.code === 'TOTAL_REVENUE') curr = totalRev;
    else if (g.code === 'AVERAGE_TICKET') curr = calculateAverageTicket(params.posRevenue, params.posOrdersCount);

    const diff = calculateDifference(curr, g.target);
    const achievement = g.target > 0 ? (curr / g.target) * 100 : 0;
    const trend: 'UP' | 'DOWN' | 'STABLE' = diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : 'STABLE';

    return {
      metricCode: g.code,
      metricName: g.name,
      currentValue: Math.round(curr * 100) / 100,
      targetValue: g.target,
      difference: Math.round(diff * 100) / 100,
      trend,
      achievementPercent: Math.round(achievement * 100) / 100,
    };
  });

  return {
    hotelId: params.hotelId,
    organizationId: params.organizationId,
    currency: params.currency,
    timezone: params.timezone,
    period: params.period,
    occupancyPercent: Math.round(occ * 100) / 100,
    adr: Math.round(adr * 100) / 100,
    revPar: Math.round(revPar * 100) / 100,
    revenue: revenueBreakdown,
    housekeeping: params.housekeeping,
    maintenance: params.maintenance,
    reservations: params.reservations,
    finance: params.finance,
    goals: calculatedGoals,
    alerts: params.alerts || [],
  };
}

/**
 * 2. Geração de Ranking Comparativo Multi-Hotel
 */
export function generateMultiHotelRanking(
  hotelsData: {
    hotelId: string;
    hotelName: string;
    availableRoomNights: number;
    occupiedRoomNights: number;
    soldRoomNights: number;
    roomRevenue: number;
    totalRevenue: number;
    expenses: number;
    posRevenue: number;
    posOrders: number;
  }[],
  sortBy: 'occupancy' | 'adr' | 'revPar' | 'totalRevenue' = 'revPar'
): MultiHotelRankingItem[] {
  const ranking: MultiHotelRankingItem[] = hotelsData.map((h) => {
    const occupancyPercent = calculateOccupancy(h.occupiedRoomNights, h.availableRoomNights) * 100;
    const adr = calculateAdr(h.roomRevenue, h.soldRoomNights);
    const revPar = calculateRevpar(h.roomRevenue, h.availableRoomNights);
    const netMargin = h.totalRevenue - h.expenses;
    const netMarginPercent = h.totalRevenue > 0 ? (netMargin / h.totalRevenue) * 100 : 0;
    const averageTicket = calculateAverageTicket(h.posRevenue, h.posOrders);

    return {
      hotelId: h.hotelId,
      hotelName: h.hotelName,
      occupancyPercent: Math.round(occupancyPercent * 100) / 100,
      adr: Math.round(adr * 100) / 100,
      revPar: Math.round(revPar * 100) / 100,
      totalRevenue: h.totalRevenue,
      expenses: h.expenses,
      netMarginPercent: Math.round(netMarginPercent * 100) / 100,
      averageTicket: Math.round(averageTicket * 100) / 100,
    };
  });

  return ranking.sort((a, b) => {
    if (sortBy === 'occupancy') return b.occupancyPercent - a.occupancyPercent;
    if (sortBy === 'adr') return b.adr - a.adr;
    if (sortBy === 'totalRevenue') return b.totalRevenue - a.totalRevenue;
    return b.revPar - a.revPar;
  });
}

/**
 * 3. Drill-down: Resolução de níveis de detalhamento (Ocupação -> Quartos -> Reservas -> Hóspedes)
 */
export function resolveDrillDownPath(
  metric: 'OCCUPANCY' | 'PDV' | 'REVENUE',
  hotelId: string,
  params?: Record<string, string>
): { view: string; breadcrumbs: string[]; queryParams: Record<string, string> } {
  if (metric === 'OCCUPANCY') {
    if (params?.guestId) {
      return {
        view: 'GUEST_DETAILS',
        breadcrumbs: ['Dashboard', 'Ocupação', 'Quartos', 'Reservas', 'Ficha do Hóspede'],
        queryParams: { hotelId, guestId: params.guestId },
      };
    }
    if (params?.reservationId) {
      return {
        view: 'RESERVATION_DETAILS',
        breadcrumbs: ['Dashboard', 'Ocupação', 'Quartos', 'Detalhes da Reserva'],
        queryParams: { hotelId, reservationId: params.reservationId },
      };
    }
    if (params?.roomNumber) {
      return {
        view: 'ROOM_STATUS',
        breadcrumbs: ['Dashboard', 'Ocupação', `Quarto ${params.roomNumber}`],
        queryParams: { hotelId, roomNumber: params.roomNumber },
      };
    }
    return {
      view: 'ROOMS_LIST',
      breadcrumbs: ['Dashboard', 'Ocupação', 'Quartos'],
      queryParams: { hotelId },
    };
  }

  if (metric === 'PDV') {
    if (params?.productId) {
      return {
        view: 'PRODUCT_ANALYTICS',
        breadcrumbs: ['Dashboard', 'PDV', params.department || 'Geral', 'Produtos'],
        queryParams: { hotelId, productId: params.productId },
      };
    }
    if (params?.orderId) {
      return {
        view: 'ORDER_DETAILS',
        breadcrumbs: ['Dashboard', 'PDV', 'Pedidos', `Comanda #${params.orderId}`],
        queryParams: { hotelId, orderId: params.orderId },
      };
    }
    return {
      view: 'DEPARTMENT_SALES',
      breadcrumbs: ['Dashboard', 'PDV', 'Departamentos'],
      queryParams: { hotelId },
    };
  }

  return {
    view: 'REVENUE_STATEMENT',
    breadcrumbs: ['Dashboard', 'Demonstrativo de Receitas'],
    queryParams: { hotelId },
  };
}

/**
 * 4. Exportador com registro de auditoria compulsório
 */
export function exportReportData(
  reportTitle: string,
  format: 'PDF' | 'CSV' | 'XLSX',
  data: Record<string, unknown>[],
  userContext: { userId: string; hotelId: string }
): {
  fileName: string;
  mimeType: string;
  rowCount: number;
  auditAction: 'EXPORT';
} {
  const sanitizedTitle = reportTitle.toLowerCase().replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const extension = format.toLowerCase();

  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return {
    fileName: `${sanitizedTitle}_${userContext.hotelId}_${dateStr}.${extension}`,
    mimeType: mimeTypes[extension] || 'application/octet-stream',
    rowCount: data.length,
    auditAction: 'EXPORT',
  };
}
