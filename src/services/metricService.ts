import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  hotel_id: string;
  period: { start: string; end: string; days: number };
  currency: string;
  occupancy: number;
  available_room_nights: number;
  occupied_room_nights: number;
  sold_room_nights: number;
  adr: number;
  revpar: number;
  total_revenue: number;
  room_revenue: number;
  pos_revenue: number;
  room_service_revenue: number;
  minibar_revenue: number;
  other_service_revenue: number;
  average_ticket: number;
  checkins: number;
  checkouts: number;
  cancellations: number;
  no_shows: number;
  booking_window: number;
  lead_time: number;
  housekeeping_productivity: number;
  housekeeping_avg_minutes: number;
  maintenance_completed: number;
  maintenance_mttr_minutes: number;
}

export interface MetricDefinition {
  code: string;
  name: string;
  description: string;
  formula: string;
  source: string;
  scope: string;
  period_granularity: string;
  filters: Record<string, unknown>;
}

export interface DashboardAlert {
  id: string;
  hotel_id: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  current_value: number | null;
  target_value: number | null;
  created_at: string;
}

export const metricService = {
  async dashboard(hotelId: string, start: string, end: string): Promise<DashboardMetrics> {
    if (!hotelId) throw new Error('HOTEL_REQUIRED');
    if (end <= start) throw new Error('INVALID_PERIOD');
    const { data, error } = await supabase.rpc('hotel_os_dashboard_metrics', { p_hotel_id: hotelId, p_start: start, p_end: end });
    if (error) throw error;
    return data as DashboardMetrics;
  },

  async refreshDaily(hotelId: string, start: string, end: string): Promise<number> {
    const { data, error } = await supabase.rpc('hotel_os_refresh_daily_metrics', { p_hotel_id: hotelId, p_start: start, p_end: end });
    if (error) throw error;
    return Number(data || 0);
  },

  async refreshAlerts(hotelId: string): Promise<number> {
    const { data, error } = await supabase.rpc('hotel_os_refresh_dashboard_alerts', { p_hotel_id: hotelId });
    if (error) throw error;
    return Number(data || 0);
  },

  async alerts(hotelId: string): Promise<DashboardAlert[]> {
    const { data, error } = await supabase.from('hotel_os_dashboard_alerts').select('id,hotel_id,alert_type,severity,title,description,current_value,target_value,created_at').eq('hotel_id', hotelId).is('resolved_at', null).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return (data || []) as DashboardAlert[];
  },

  async definitions(): Promise<MetricDefinition[]> {
    const { data, error } = await supabase.from('hotel_os_metric_definitions').select('code,name,description,formula,source,scope,period_granularity,filters').eq('active', true).order('code');
    if (error) throw error;
    return (data || []) as MetricDefinition[];
  },
};
