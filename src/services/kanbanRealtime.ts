import { supabase } from '../lib/supabase';

export type KanbanV2Board = {
  id: string; hotel_id: string; nome: string; departamento: string;
  descricao: string | null; ativo: boolean; configuracao?: Record<string, unknown>;
  criado_por: string | null; criado_em: string; atualizado_em: string;
};

export type KanbanV2Column = {
  id: string; board_id: string; nome: string; ordem: number;
  configuracao: Record<string, unknown>; criado_em: string; atualizado_em: string;
};

export type KanbanV2Card = {
  id: string; hotel_id: string; board_id: string; column_id: string;
  titulo: string; descricao: string | null; prioridade: string; ordem: number;
  departamento: string | null; room_number: string | null; location: string | null;
  assigned_to: Record<string, unknown> | null; checklist: unknown[]; comments: unknown[];
  metadata: Record<string, unknown>; completed_at: string | null; created_at: string;
  updated_at: string; is_archived: boolean; guest_name: string | null;
  reservation_id: string | null; service_details: string | null; tags: unknown[]; notes: string | null;
};

export const KANBAN_TENANT_ID = 'default_hotel';
export const DEFAULT_BOARD_ID = 'kanban-default-board';

const cardSelect = '*';

async function query<T>(request: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  if (data == null) throw new Error('Supabase não retornou dados.');
  return data;
}

export const kanbanRealtime = {
  async load(hotelId = KANBAN_TENANT_ID) {
    const [boards, columns, cards] = await Promise.all([
      query<KanbanV2Board[]>(supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true).order('criado_em', { ascending: true })),
      query<KanbanV2Column[]>(supabase.from('kanban_columns').select('*').order('ordem', { ascending: true })),
      query<KanbanV2Card[]>(supabase.from('kanban_cards').select(cardSelect).eq('hotel_id', hotelId).eq('is_archived', false).order('ordem', { ascending: true })),
    ]);

    const boardIds = new Set(boards.map(board => board.id));
    return {
      boards,
      columns: columns.filter(column => boardIds.has(column.board_id)),
      cards: cards.filter(card => boardIds.has(card.board_id)),
    };
  },

  async createCard(input: {
    hotelId: string; boardId: string; columnId: string; titulo: string;
    descricao?: string; prioridade?: string; departamento?: string;
  }) {
    const payload = {
      id: `card-${crypto.randomUUID()}`,
      hotel_id: input.hotelId,
      board_id: input.boardId,
      column_id: input.columnId,
      titulo: input.titulo.trim(),
      descricao: input.descricao?.trim() || null,
      prioridade: input.prioridade || 'normal',
      departamento: input.departamento || null,
      ordem: Date.now(),
      is_archived: false,
    };
    return query<KanbanV2Card>(supabase.from('kanban_cards').insert(payload).select(cardSelect).single());
  },

  async moveCard(hotelId: string, cardId: string, targetColumnId: string) {
    const card = await query<KanbanV2Card>(supabase.from('kanban_cards').select(cardSelect).eq('id', cardId).eq('hotel_id', hotelId).single());
    const target = await query<Pick<KanbanV2Column, 'id' | 'board_id'>>(supabase.from('kanban_columns').select('id, board_id').eq('id', targetColumnId).single());
    if (target.board_id !== card.board_id) throw new Error('A coluna de destino pertence a outro Kanban.');

    const column = await query<Pick<KanbanV2Column, 'id' | 'nome'>>(supabase.from('kanban_columns').select('id, nome').eq('id', targetColumnId).single());
    const terminal = /conclu|finaliz|liberad|resolvid|entregue/i.test(column.nome);

    return query<KanbanV2Card>(supabase.from('kanban_cards').update({
      column_id: targetColumnId,
      ordem: Date.now(),
      completed_at: terminal ? new Date().toISOString() : null,
    }).eq('id', cardId).eq('hotel_id', hotelId).select(cardSelect).single());
  },

  subscribe(hotelId = KANBAN_TENANT_ID, handlers: {
    onInsert?: (card: KanbanV2Card) => void;
    onUpdate?: (card: KanbanV2Card) => void;
    onDelete?: (card: KanbanV2Card) => void;
    onStatus?: (status: string) => void;
  } = {}) {
    const channel = supabase
      .channel(`kanban-operacional-${hotelId}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onInsert?.(payload.new as KanbanV2Card))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onUpdate?.(payload.new as KanbanV2Card))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onDelete?.(payload.old as KanbanV2Card))
      .subscribe(status => handlers.onStatus?.(status));

    return () => { void supabase.removeChannel(channel); };
  },
};
