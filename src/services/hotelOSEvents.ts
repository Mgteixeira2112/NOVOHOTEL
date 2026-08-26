import { supabase } from './supabase';

export type HotelOSEventType =
  | 'reservation.created'
  | 'reservation.confirmed'
  | 'reservation.cancelled'
  | 'checkin.completed'
  | 'checkout.completed'
  | 'room.status_changed'
  | 'housekeeping.task_created'
  | 'housekeeping.completed'
  | 'maintenance.created'
  | 'maintenance.completed'
  | 'kitchen.order_created'
  | 'kitchen.order_ready'
  | 'room_service.order_created'
  | 'stock.low'
  | 'payment.approved'
  | 'payment.failed'
  | 'guest.feedback_received';

export interface HotelOSEvent {
  id?: string;
  hotel_id?: string;
  event_type: HotelOSEventType | string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  source?: string;
  created_at?: string;
}

export interface HotelOSTask {
  id?: string;
  hotel_id?: string;
  title: string;
  department: string;
  status?: 'pending' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  assignee_id?: string | null;
  source_event_id?: string | null;
  due_at?: string | null;
  metadata?: Record<string, unknown>;
}

const id = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export async function emitHotelOSEvent(event: HotelOSEvent) {
  const row = {
    id: event.id || id('evt'),
    hotel_id: event.hotel_id || null,
    event_type: event.event_type,
    aggregate_type: event.aggregate_type,
    aggregate_id: event.aggregate_id,
    payload: event.payload || {},
    source: event.source || 'hotel-os',
    created_at: event.created_at || new Date().toISOString(),
  };

  const { data, error } = await supabase.from('hotel_os_events').insert(row).select().single();
  if (error) throw error;
  return data as HotelOSEvent;
}

export async function createHotelOSTask(task: HotelOSTask) {
  const row = {
    id: task.id || id('task'),
    hotel_id: task.hotel_id || null,
    title: task.title,
    department: task.department,
    status: task.status || 'pending',
    priority: task.priority || 'normal',
    assignee_id: task.assignee_id || null,
    source_event_id: task.source_event_id || null,
    due_at: task.due_at || null,
    metadata: task.metadata || {},
  };

  const { data, error } = await supabase.from('hotel_os_tasks').insert(row).select().single();
  if (error) throw error;
  return data as HotelOSTask;
}

export async function listHotelOSEvents(limit = 100) {
  const { data, error } = await supabase
    .from('hotel_os_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as HotelOSEvent[];
}

export async function listHotelOSTasks(filters?: { department?: string; status?: HotelOSTask['status']; limit?: number }) {
  let query = supabase.from('hotel_os_tasks').select('*').order('created_at', { ascending: false });
  if (filters?.department) query = query.eq('department', filters.department);
  if (filters?.status) query = query.eq('status', filters.status);
  const { data, error } = await query.limit(filters?.limit || 100);
  if (error) throw error;
  return (data || []) as HotelOSTask[];
}

export async function updateHotelOSTask(idValue: string, patch: Partial<HotelOSTask>) {
  const { data, error } = await supabase
    .from('hotel_os_tasks')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', idValue)
    .select()
    .single();
  if (error) throw error;
  return data as HotelOSTask;
}
