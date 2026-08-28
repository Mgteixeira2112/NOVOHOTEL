export type DashboardScope = 'PERSONAL' | 'ROLE' | 'HOTEL';
export type DashboardBlockType = 'kpi' | 'chart' | 'table' | 'alert' | 'ranking' | 'progress';
export type DashboardMetricFormat = 'number' | 'currency' | 'percent' | 'minutes' | 'text';

export interface DashboardFilters {
  start?: string;
  end?: string;
  hotelId?: string;
  roomId?: string;
  floor?: string;
  department?: string;
  [key: string]: string | undefined;
}

export interface DashboardMetricDefinition {
  key: string;
  label: string;
  description?: string;
  dataSource: string;
  field: string;
  format: DashboardMetricFormat;
}

export interface DashboardMetricResult {
  key: string;
  value: unknown;
  format: DashboardMetricFormat;
  label: string;
}

export interface DashboardBlock {
  id: string;
  dashboardId: string;
  blockType: DashboardBlockType;
  metricKey: string;
  title?: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  config: Record<string, unknown>;
}

export interface DashboardDefinition {
  id: string;
  hotelId: string;
  name: string;
  slug: string;
  scope: DashboardScope;
  ownerUserId?: string | null;
  role?: string | null;
  isDefault: boolean;
  filters: DashboardFilters;
  blocks: DashboardBlock[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveDashboardInput {
  id?: string;
  hotelId: string;
  name: string;
  slug: string;
  scope?: DashboardScope;
  role?: string | null;
  isDefault?: boolean;
  filters?: DashboardFilters;
}

export interface SaveDashboardBlockInput {
  id?: string;
  dashboardId: string;
  blockType: DashboardBlockType;
  metricKey: string;
  title?: string | null;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  config?: Record<string, unknown>;
}

export type DashboardDataSourceResolver = (
  filters: DashboardFilters,
) => Promise<Record<string, unknown>>;
