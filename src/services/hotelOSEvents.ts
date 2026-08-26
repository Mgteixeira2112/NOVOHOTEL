import { supabase } from './supabase';

export type HotelOSEventType =
  | 'reservation.created'
  | 'reservation.confirmed'
  | 'reservation.cancelled'
  | 'checkin.completed'
  | 'checkout.completed'
  | 'stay.checked_in'
  | 'stay.checked_out'
  | 'order.created'
  | 'order.completed'
  | 'task.created'
  | 'task.completed'
  | 'payment.created'
  | 'room.status_changed'
  | 'housekeeping.task_created'
  | 'housekeeping.completed'
  | 'maintenance.created'
  | 'maintenance.completed'
  | 'kitchen.order_created'
  | 'kitchen.order_ready'
  | 'room_service.created'
  | 'stock.below_minimum'
  | 'guest.feedback_received';

export interface HotelOSEvent {
  id?: string;
  hotel_id?: string | null;
  event_type: HotelOSEventType | string;
  source_module: string;
  entity_type?: string | null;
  entity_id?: string | null;
  payload: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
}

export interface HotelOSTask {
  id?: string;
  hotel_id?: string | null;
  title: string;
  description?: string | null;
  department: string;
  status?: 'pendente' | 'em_execucao' | 'aguardando' | 'concluida' | 'cancelada';
  priority?: 'baixa' | 'normal' | 'alta' | 'critica';
  room_id?: string | null;
  reservation_id?: string | null;
  assigned_to?: string | null;
  source_event_id?: string | null;
  due_at?: string | null;
  metadata?: Record<string, unknown>;
}

export async function emitHotelOSEvent(event: HotelOSEvent) {
  const row = {
    hotel_id: event.hotel_id || null,
    event_type: event.event_type,
    source_module: event.source_module,
    entity_type: event.entity_type || null,
    entity_id: event.entity_id || null,
    payload: event.payload || {},
    created_by: event.created_by || null,
    created_at: event.created_at || new Date().toISOString(),
  };

  const { data, error } = await supabase.from('hotel_os_events').insert(row).select().single();
  if (error) throw error;
  return data as HotelOSEvent;
}

export async function createHotelOSTask(task: HotelOSTask) {
  const row = {
    hotel_id: task.hotel_id || null,
    title: task.title,
    description: task.description || null,
    department: task.department,
    status: task.status || 'pendente',
    priority: task.priority || 'normal',
    room_id: task.room_id || null,
    reservation_id: task.reservation_id || null,
    assigned_to: task.assigned_to || null,
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
