import { supabase } from '../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../types/kanban';

export type TaskType='ROOM_CLEANING'|'ROOM_INSPECTION'|'MAINTENANCE'|'MINIBAR'|'LAUNDRY'|'DELIVERY'|'RESTOCK'|'GENERAL';
export type TaskStatus='PENDING'|'IN_PROGRESS'|'WAITING'|'COMPLETED'|'CANCELLED'|'REOPENED';

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

  // Persistência operacional de Boards, Colunas e Cartões do Kanban
  async listKanbanBoards(hotelId: string): Promise<KanbanBoard[] | null> {
    try {
      const { data: boardsData, error: boardsErr } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('ativo', true);

      if (boardsErr || !boardsData || boardsData.length === 0) return null;

      const { data: colsData, error: colsErr } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('ordem', { ascending: true });

      if (colsErr) return null;

      return boardsData.map((b: any) => ({
        id: b.id,
        title: b.nome,
        department: b.departamento,
        icon_name: b.icon_name || 'Layers',
        description: b.descricao || '',
        default_sla_minutes: b.default_sla_minutes || 30,
        allowed_roles_manage: b.allowed_roles_manage || ['admin', 'gerente'],
        allowed_roles_view: b.allowed_roles_view || ['todas'],
        columns: (colsData || [])
          .filter((c: any) => c.board_id === b.id)
          .map((c: any) => ({
            id: c.id,
            board_id: c.board_id,
            title: c.nome,
            color: c.cor,
            order: c.ordem,
            wip_limit: c.wip_limit,
            is_final: c.is_final,
            is_in_progress: c.is_in_progress,
            is_delegated: c.is_delegated,
          })),
        is_custom: b.configuracao?.is_custom ?? false,
      }));
    } catch {
      return null;
    }
  },

  async listKanbanCards(hotelId: string): Promise<KanbanCard[] | null> {
    try {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((c: any) => ({
        id: c.id,
        board_id: c.board_id,
        column_id: c.column_id,
        title: c.titulo,
        location: c.location || 'Geral',
        priority: c.prioridade || 'normal',
        sla_target_minutes: c.sla_target_minutes || 30,
        created_at: c.created_at,
        started_at: c.started_at,
        completed_at: c.completed_at,
        assigned_to: c.assigned_to,
        origin_department: c.origin_department,
        delegated_to_department: c.delegated_to_department,
        guest_name: c.guest_name,
        reservation_id: c.reservation_id,
        room_number: c.room_number,
        order_items: c.order_items || [],
        service_details: c.service_details || [],
        summary_category: c.summary_category,
        amount: c.amount ? Number(c.amount) : undefined,
        comments: c.comments || [],
        checklist: c.checklist || [],
        tags: c.tags || [],
        is_archived: c.is_archived || false,
        order: Number(c.ordem || 0),
      }));
    } catch {
      return null;
    }
  },

  async upsertKanbanCard(card: KanbanCard, hotelId: string = 'default_hotel') {
    try {
      const payload = {
        id: card.id,
        hotel_id: hotelId,
        board_id: card.board_id,
        column_id: card.column_id,
        titulo: card.title,
        location: card.location,
        prioridade: card.priority,
        ordem: card.order || 0,
        departamento: card.origin_department || null,
        room_number: card.room_number || null,
        guest_name: card.guest_name || null,
        reservation_id: card.reservation_id || null,
        sla_target_minutes: card.sla_target_minutes || 30,
        started_at: card.started_at || null,
        completed_at: card.completed_at || null,
        assigned_to: card.assigned_to || null,
        origin_department: card.origin_department || null,
        delegated_to_department: card.delegated_to_department || null,
        order_items: card.order_items || [],
        service_details: card.service_details || [],
        summary_category: card.summary_category || null,
        amount: card.amount ?? null,
        tags: card.tags || [],
        checklist: card.checklist || [],
        comments: card.comments || [],
        is_archived: card.is_archived || false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('kanban_cards').upsert(payload);
      if (error) console.warn('Aviso ao persistir card no Supabase:', error.message);
    } catch (err) {
      console.warn('Falha silenciosa ao sincronizar card com Supabase:', err);
    }
  },

  async deleteKanbanCard(cardId: string) {
    try {
      const { error } = await supabase.from('kanban_cards').delete().eq('id', cardId);
      if (error) console.warn('Aviso ao deletar card do Supabase:', error.message);
    } catch (err) {
      console.warn('Falha silenciosa ao deletar card do Supabase:', err);
    }
  },

  async upsertKanbanBoard(board: KanbanBoard, hotelId: string = 'default_hotel') {
    try {
      const boardPayload = {
        id: board.id,
        hotel_id: hotelId,
        nome: board.title,
        departamento: board.department,
        descricao: board.description,
        icon_name: board.icon_name,
        default_sla_minutes: board.default_sla_minutes,
        allowed_roles_manage: board.allowed_roles_manage,
        allowed_roles_view: board.allowed_roles_view,
        ativo: true,
        configuracao: { is_custom: board.is_custom },
        atualizado_em: new Date().toISOString(),
      };

      await supabase.from('kanban_boards').upsert(boardPayload);

      if (board.columns && board.columns.length > 0) {
        const columnsPayload = board.columns.map((col) => ({
          id: col.id,
          board_id: board.id,
          nome: col.title,
          cor: col.color || null,
          ordem: col.order || 0,
          wip_limit: col.wip_limit || null,
          is_final: col.is_final || false,
          is_in_progress: col.is_in_progress || false,
          is_delegated: col.is_delegated || false,
          atualizado_em: new Date().toISOString(),
        }));
        await supabase.from('kanban_columns').upsert(columnsPayload);
      }
    } catch (err) {
      console.warn('Falha ao persistir board no Supabase:', err);
    }
  },

  async deleteKanbanBoard(boardId: string) {
    try {
      await supabase.from('kanban_boards').delete().eq('id', boardId);
    } catch (err) {
      console.warn('Falha ao deletar board no Supabase:', err);
    }
  },
};

