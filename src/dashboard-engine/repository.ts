import { supabase } from '../lib/supabase';
import type { DashboardBlock, DashboardDefinition, SaveDashboardBlockInput, SaveDashboardInput } from './types';

const mapBlock = (row: Record<string, unknown>): DashboardBlock => ({
  id: String(row.id),
  dashboardId: String(row.dashboard_id),
  blockType: row.block_type as DashboardBlock['blockType'],
  metricKey: String(row.metric_key),
  title: row.title ? String(row.title) : null,
  positionX: Number(row.position_x ?? 0),
  positionY: Number(row.position_y ?? 0),
  width: Number(row.width ?? 4),
  height: Number(row.height ?? 2),
  config: (row.config ?? {}) as Record<string, unknown>,
});

const mapDashboard = (row: Record<string, unknown>, blocks: DashboardBlock[] = []): DashboardDefinition => ({
  id: String(row.id),
  hotelId: String(row.hotel_id),
  name: String(row.name),
  slug: String(row.slug),
  scope: row.scope as DashboardDefinition['scope'],
  ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
  role: row.role ? String(row.role) : null,
  isDefault: Boolean(row.is_default),
  filters: (row.filters ?? {}) as DashboardDefinition['filters'],
  blocks,
  createdAt: row.created_at ? String(row.created_at) : undefined,
  updatedAt: row.updated_at ? String(row.updated_at) : undefined,
});

export const dashboardRepository = {
  async list(hotelId: string): Promise<DashboardDefinition[]> {
    const { data, error } = await supabase
      .from('hotel_os_dashboards')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('is_default', { ascending: false })
      .order('name');
    if (error) throw error;
    return (data ?? []).map((row) => mapDashboard(row as Record<string, unknown>));
  },

  async get(id: string): Promise<DashboardDefinition> {
    const { data, error } = await supabase.from('hotel_os_dashboards').select('*').eq('id', id).single();
    if (error) throw error;
    const { data: blockRows, error: blockError } = await supabase
      .from('hotel_os_dashboard_blocks')
      .select('*')
      .eq('dashboard_id', id)
      .order('position_y')
      .order('position_x');
    if (blockError) throw blockError;
    return mapDashboard(
      data as Record<string, unknown>,
      (blockRows ?? []).map((row) => mapBlock(row as Record<string, unknown>)),
    );
  },

  async save(input: SaveDashboardInput): Promise<DashboardDefinition> {
    const payload = {
      hotel_id: input.hotelId,
      name: input.name,
      slug: input.slug,
      scope: input.scope ?? 'PERSONAL',
      role: input.role ?? null,
      is_default: input.isDefault ?? false,
      filters: input.filters ?? {},
      updated_at: new Date().toISOString(),
    };
    const query = input.id
      ? supabase.from('hotel_os_dashboards').update(payload).eq('id', input.id)
      : supabase.from('hotel_os_dashboards').insert(payload);
    const { data, error } = await query.select('*').single();
    if (error) throw error;
    return mapDashboard(data as Record<string, unknown>);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('hotel_os_dashboards').delete().eq('id', id);
    if (error) throw error;
  },

  async saveBlock(input: SaveDashboardBlockInput): Promise<DashboardBlock> {
    const payload = {
      dashboard_id: input.dashboardId,
      block_type: input.blockType,
      metric_key: input.metricKey,
      title: input.title ?? null,
      position_x: input.positionX,
      position_y: input.positionY,
      width: input.width,
      height: input.height,
      config: input.config ?? {},
      updated_at: new Date().toISOString(),
    };
    const query = input.id
      ? supabase.from('hotel_os_dashboard_blocks').update(payload).eq('id', input.id)
      : supabase.from('hotel_os_dashboard_blocks').insert(payload);
    const { data, error } = await query.select('*').single();
    if (error) throw error;
    return mapBlock(data as Record<string, unknown>);
  },

  async removeBlock(id: string): Promise<void> {
    const { error } = await supabase.from('hotel_os_dashboard_blocks').delete().eq('id', id);
    if (error) throw error;
  },
};
