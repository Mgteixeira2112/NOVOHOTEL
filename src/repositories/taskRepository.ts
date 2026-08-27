import { supabase } from '../lib/supabase';
import { KanbanBoard, KanbanCard } from '../types/kanban';
import { kanbanV2, KANBAN_TENANT_ID } from '../services/kanbanV2';

export type TaskType = 'ROOM_CLEANING' | 'ROOM_INSPECTION' | 'MAINTENANCE' | 'MINIBAR' | 'LAUNDRY' | 'DELIVERY' | 'RESTOCK' | 'GENERAL';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING' | 'COMPLETED' | 'CANCELLED' | 'REOPENED';

export const taskRepository = {
  async list(hotelId: string, type?: TaskType) {
    let q = supabase.from('hotel_os_tasks').select('*').eq('hotel_id', hotelId).order('priority').order('created_at', { ascending: true });
    if (type) q = q.eq('type', type);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async create(input: {
    hotelId: string;
    type: TaskType;
    title: string;
    description?: string;
    roomId?: string;
    priority?: string;
    source?: string;
    assignedTo?: string | null;
    dueAt?: string | null;
  }) {
    const { data, error } = await supabase.from('hotel_os_tasks').insert({
      hotel_id: input.hotelId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      room_id: input.roomId ?? null,
      priority: input.priority ?? 'NORMAL',
      source: input.source ?? 'MANUAL',
      assigned_to: input.assignedTo ?? null,
      due_at: input.dueAt ?? null,
    }).select().single();
    if (error) throw error;
    return data;
  },

  async transition(taskId: string, status: TaskStatus, reason?: string) {
    const { data, error } = await supabase.rpc('hotel_os_transition_task', {
      p_task_id: taskId,
      p_status: status,
      p_reason: reason ?? null,
    });
    if (error) throw error;
    return String(data);
  },

  async inspection(taskId: string, approved: boolean, reason?: string) {
    const { data, error } = await supabase.rpc('hotel_os_complete_room_inspection', {
      p_task_id: taskId,
      p_approved: approved,
      p_reason: reason ?? null,
    });
    if (error) throw error;
    return String(data);
  },

  async listBoards(hotelId: string) {
    const { data, error } = await supabase.from('hotel_os_boards').select('*,columns:hotel_os_board_columns(*)').eq('hotel_id', hotelId).eq('active', true);
    if (error) throw error;
    return data ?? [];
  },

  // Persistência unificada delegada à camada oficial kanbanV2
  async listKanbanBoards(hotelId: string): Promise<KanbanBoard[] | null> {
    try {
      const data = await kanbanV2.load(hotelId || KANBAN_TENANT_ID);
      return data.boards.map(b => ({
        id: b.id,
        title: b.nome,
        department: b.departamento,
        icon_name: 'Layers',
        description: b.descricao || '',
        default_sla_minutes: 60,
        allowed_roles_manage: [],
        allowed_roles_view: [],
        columns: data.columns.filter(c => c.board_id === b.id).map(c => ({
          id: c.id,
          board_id: c.board_id,
          title: c.nome,
          order: c.ordem
        }))
      }));
    } catch {
      return null;
    }
  },

  async listKanbanCards(hotelId: string): Promise<KanbanCard[] | null> {
    try {
      const data = await kanbanV2.load(hotelId || KANBAN_TENANT_ID);
      return data.cards.map(c => ({
        id: c.id,
        board_id: c.board_id,
        column_id: c.column_id,
        title: c.titulo,
        location: c.location || '',
        priority: (c.prioridade === 'critica' || c.prioridade === 'atencao' || c.prioridade === 'normal') ? c.prioridade : 'normal',
        sla_target_minutes: 60,
        created_at: c.created_at,
        updated_at: c.updated_at,
        completed_at: c.completed_at || undefined,
        comments: [],
        checklist: [],
        tags: c.tags as string[] || [],
        order: c.ordem,
        room_number: c.room_number || undefined,
        guest_name: c.guest_name || undefined
      }));
    } catch {
      return null;
    }
  },

  async upsertKanbanCard(card: KanbanCard, hotelId: string = 'default_hotel') {
    return kanbanV2.createCard({
      hotelId,
      boardId: card.board_id,
      columnId: card.column_id,
      titulo: card.title,
      room_number: card.room_number,
      guest_name: card.guest_name,
      location: card.location,
      prioridade: card.priority,
    });
  },

  async deleteKanbanCard(_cardId: string) {
    return true;
  },

  async upsertKanbanBoard(_board: KanbanBoard, _hotelId: string = 'default_hotel') {
    return true;
  },

  async deleteKanbanBoard(_boardId: string) {
    return true;
  },
};
