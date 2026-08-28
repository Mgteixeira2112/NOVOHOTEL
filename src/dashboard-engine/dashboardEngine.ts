import { dashboardRepository } from './repository';
import {
  getDashboardMetricDefinition,
  listDashboardMetricDefinitions,
  registerDashboardDataSource,
  registerDashboardMetric,
  resolveDashboardMetric,
} from './registry';
import type {
  DashboardDataSourceResolver,
  DashboardFilters,
  DashboardMetricDefinition,
  SaveDashboardBlockInput,
  SaveDashboardInput,
} from './types';

export const dashboardEngine = {
  registerDataSource(key: string, resolver: DashboardDataSourceResolver) {
    registerDashboardDataSource(key, resolver);
  },

  registerMetric(definition: DashboardMetricDefinition) {
    registerDashboardMetric(definition);
  },

  getMetricDefinition(key: string) {
    return getDashboardMetricDefinition(key);
  },

  listMetrics() {
    return listDashboardMetricDefinitions();
  },

  resolveMetric(key: string, filters: DashboardFilters) {
    return resolveDashboardMetric(key, filters);
  },

  async resolveMetrics(keys: string[], filters: DashboardFilters) {
    const uniqueKeys = Array.from(new Set(keys));
    return Promise.all(uniqueKeys.map((key) => resolveDashboardMetric(key, filters)));
  },

  listDashboards(hotelId: string) {
    if (!hotelId) throw new Error('DASHBOARD_HOTEL_REQUIRED');
    return dashboardRepository.list(hotelId);
  },

  getDashboard(id: string) {
    if (!id) throw new Error('DASHBOARD_ID_REQUIRED');
    return dashboardRepository.get(id);
  },

  saveDashboard(input: SaveDashboardInput) {
    if (!input.hotelId) throw new Error('DASHBOARD_HOTEL_REQUIRED');
    if (!input.name.trim()) throw new Error('DASHBOARD_NAME_REQUIRED');
    if (!input.slug.trim()) throw new Error('DASHBOARD_SLUG_REQUIRED');
    return dashboardRepository.save(input);
  },

  deleteDashboard(id: string) {
    if (!id) throw new Error('DASHBOARD_ID_REQUIRED');
    return dashboardRepository.remove(id);
  },

  saveBlock(input: SaveDashboardBlockInput) {
    if (!input.dashboardId) throw new Error('DASHBOARD_ID_REQUIRED');
    if (!getDashboardMetricDefinition(input.metricKey)) throw new Error(`DASHBOARD_METRIC_NOT_FOUND:${input.metricKey}`);
    if (input.width < 1 || input.height < 1) throw new Error('DASHBOARD_BLOCK_SIZE_INVALID');
    return dashboardRepository.saveBlock(input);
  },

  deleteBlock(id: string) {
    if (!id) throw new Error('DASHBOARD_BLOCK_ID_REQUIRED');
    return dashboardRepository.removeBlock(id);
  },
};
