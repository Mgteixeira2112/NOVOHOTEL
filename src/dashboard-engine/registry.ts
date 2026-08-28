import { metricService } from '../services/metricService';
import type {
  DashboardDataSourceResolver,
  DashboardFilters,
  DashboardMetricDefinition,
  DashboardMetricResult,
} from './types';

const metricDefinitions = new Map<string, DashboardMetricDefinition>();
const dataSources = new Map<string, DashboardDataSourceResolver>();

const requirePeriod = (filters: DashboardFilters) => {
  if (!filters.hotelId) throw new Error('DASHBOARD_HOTEL_REQUIRED');
  if (!filters.start || !filters.end) throw new Error('DASHBOARD_PERIOD_REQUIRED');
  return { hotelId: filters.hotelId, start: filters.start, end: filters.end };
};

export function registerDashboardDataSource(key: string, resolver: DashboardDataSourceResolver) {
  if (!key.trim()) throw new Error('DASHBOARD_DATA_SOURCE_KEY_REQUIRED');
  dataSources.set(key, resolver);
}

export function registerDashboardMetric(definition: DashboardMetricDefinition) {
  if (!definition.key.trim()) throw new Error('DASHBOARD_METRIC_KEY_REQUIRED');
  if (!dataSources.has(definition.dataSource)) throw new Error(`DASHBOARD_DATA_SOURCE_NOT_FOUND:${definition.dataSource}`);
  metricDefinitions.set(definition.key, definition);
}

export function getDashboardMetricDefinition(key: string) {
  return metricDefinitions.get(key) ?? null;
}

export function listDashboardMetricDefinitions() {
  return Array.from(metricDefinitions.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export async function resolveDashboardMetric(key: string, filters: DashboardFilters): Promise<DashboardMetricResult> {
  const definition = metricDefinitions.get(key);
  if (!definition) throw new Error(`DASHBOARD_METRIC_NOT_FOUND:${key}`);
  const resolver = dataSources.get(definition.dataSource);
  if (!resolver) throw new Error(`DASHBOARD_DATA_SOURCE_NOT_FOUND:${definition.dataSource}`);
  const payload = await resolver(filters);
  return {
    key,
    value: payload[definition.field] ?? null,
    format: definition.format,
    label: definition.label,
  };
}

registerDashboardDataSource('hotel.metrics.summary', async (filters) => {
  const { hotelId, start, end } = requirePeriod(filters);
  const result = await metricService.dashboard(hotelId, start, end);
  return result as unknown as Record<string, unknown>;
});

const builtinMetrics: DashboardMetricDefinition[] = [
  { key: 'hotel.occupancy', label: 'Ocupação', dataSource: 'hotel.metrics.summary', field: 'occupancy', format: 'percent' },
  { key: 'hotel.available_room_nights', label: 'Quartos disponíveis', dataSource: 'hotel.metrics.summary', field: 'available_room_nights', format: 'number' },
  { key: 'hotel.occupied_room_nights', label: 'Quartos ocupados', dataSource: 'hotel.metrics.summary', field: 'occupied_room_nights', format: 'number' },
  { key: 'hotel.checkins', label: 'Check-ins', dataSource: 'hotel.metrics.summary', field: 'checkins', format: 'number' },
  { key: 'hotel.checkouts', label: 'Check-outs', dataSource: 'hotel.metrics.summary', field: 'checkouts', format: 'number' },
  { key: 'finance.total_revenue', label: 'Receita total', dataSource: 'hotel.metrics.summary', field: 'total_revenue', format: 'currency' },
  { key: 'finance.room_revenue', label: 'Receita hospedagem', dataSource: 'hotel.metrics.summary', field: 'room_revenue', format: 'currency' },
  { key: 'finance.pos_revenue', label: 'Receita PDV', dataSource: 'hotel.metrics.summary', field: 'pos_revenue', format: 'currency' },
  { key: 'finance.room_service_revenue', label: 'Receita Room Service', dataSource: 'hotel.metrics.summary', field: 'room_service_revenue', format: 'currency' },
  { key: 'finance.minibar_revenue', label: 'Receita Frigobar', dataSource: 'hotel.metrics.summary', field: 'minibar_revenue', format: 'currency' },
  { key: 'finance.adr', label: 'ADR', dataSource: 'hotel.metrics.summary', field: 'adr', format: 'currency' },
  { key: 'finance.revpar', label: 'RevPAR', dataSource: 'hotel.metrics.summary', field: 'revpar', format: 'currency' },
  { key: 'governance.productivity', label: 'Produtividade Governança', dataSource: 'hotel.metrics.summary', field: 'housekeeping_productivity', format: 'number' },
  { key: 'governance.avg_minutes', label: 'Tempo médio de limpeza', dataSource: 'hotel.metrics.summary', field: 'housekeeping_avg_minutes', format: 'minutes' },
  { key: 'maintenance.completed', label: 'Manutenções concluídas', dataSource: 'hotel.metrics.summary', field: 'maintenance_completed', format: 'number' },
  { key: 'maintenance.mttr_minutes', label: 'MTTR manutenção', dataSource: 'hotel.metrics.summary', field: 'maintenance_mttr_minutes', format: 'minutes' },
];

builtinMetrics.forEach(registerDashboardMetric);
