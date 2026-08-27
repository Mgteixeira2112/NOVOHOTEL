import { supabase } from '../lib/supabase';

export type KanbanV2Board = { id: string; hotel_id: string; nome: string; departamento: string; descricao: string | null; ativo: boolean; criado_em: string; atualizado_em: string };
export type KanbanV2Column = { id: string; board_id: string; nome: string; ordem: number; configuracao: Record<string, unknown>; criado_em: string; atualizado_em: string };
export type KanbanV2Card = { id: string; hotel_id: string; board_id: string; column_id: string; titulo: string; descricao: string | null; prioridade: string; ordem: number; departamento: string | null; room_number: string | null; location: string | null; assigned_to: Record<string, unknown> | null; checklist: unknown[]; comments: unknown[]; metadata: Record<string, unknown>; completed_at: string | null; created_at: string; updated_at: string; is_archived: boolean; guest_name: string | null; reservation_id: string | null; service_details: string | null; tags: unknown[]; notes: string | null };

const errorMessage = (where: string, error: any) => {
  const detail = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(' | ');
  return new Error(`${where}${detail ? `: ${detail}` : ''}`);
};

const normalizeCard = (row: any): KanbanV2Card => ({ ...row, id: String(row.id), hotel_id: String(row.hotel_id), board_id: String(row.board_id), column_id: String(row.column_id), ordem: Number(row.ordem ?? 0), checklist: Array.isArray(row.checklist) ? row.checklist : [], comments: Array.isArray(row.comments) ? row.comments : [], tags: Array.isArray(row.tags) ? row.tags : [], metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {} });

export const kanbanV2 = {
  async load(hotelId: string) {
    if (!hotelId) throw new Error('Hotel não identificado.');
    let [boards, columns, cards] = await Promise.all([
      supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true).order('criado_em'),
      supabase.from('kanban_columns').select('*').order('ordem'),
      supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId).eq('is_archived', false).order('ordem').order('created_at'),
    ]);
    if (boards.error) throw errorMessage('[KANBAN LOAD BOARDS]', boards.error);
    if (columns.error) throw errorMessage('[KANBAN LOAD COLUMNS]', columns.error);
    if (cards.error) throw errorMessage('[KANBAN LOAD CARDS]', cards.error);

    if ((boards.data ?? []).length === 0) {
      const boardId = `board-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const { data: createdBoard, error: boardError } = await supabase.from('kanban_boards').insert({ id: boardId, hotel_id: hotelId, nome: 'Operação Geral', departamento: 'operacao', descricao: 'Quadro operacional principal', ativo: true, configuracao: {}, criado_em: now, atualizado_em: now }).select('*').single();
      if (boardError) throw errorMessage('[KANBAN BOOTSTRAP BOARD]', boardError);
      const defaultColumns = ['Entrada', 'Em andamento', 'Aguardando', 'Concluído'].map((nome, index) => ({ id: `col-${crypto.randomUUID()}-${index}`, board_id: boardId, nome, ordem: index, configuracao: {}, criado_em: now, atualizado_em: now }));
      const { error: columnError } = await supabase.from('kanban_columns').insert(defaultColumns);
      if (columnError) throw errorMessage('[KANBAN BOOTSTRAP COLUMNS]', columnError);
      boards = { data: [createdBoard], error: null } as any;
      columns = { data: defaultColumns, error: null } as any;
      cards = { data: [], error: null } as any;
    }

    const boardIds = new Set((boards.data ?? []).map((b: any) => String(b.id)));
    return { boards: (boards.data ?? []) as KanbanV2Board[], columns: (columns.data ?? []).filter((c: any) => boardIds.has(String(c.board_id))) as KanbanV2Column[], cards: (cards.data ?? []).map(normalizeCard) };
  },

  async createCard(input: { hotelId: string; boardId: string; columnId: string; titulo: string; descricao?: string; prioridade?: string; departamento?: string; room_number?: string; location?: string; guest_name?: string; notes?: string }) {
    const now = new Date().toISOString();
    const payload = { id: crypto.randomUUID(), hotel_id: input.hotelId, board_id: input.boardId, column_id: input.columnId, titulo: input.titulo.trim(), descricao: input.descricao?.trim() || null, prioridade: input.prioridade || 'normal', ordem: Date.now(), departamento: input.departamento || null, room_number: input.room_number?.trim() || null, location: input.location?.trim() || null, assigned_to: null, checklist: [], comments: [], metadata: {}, completed_at: null, created_at: now, updated_at: now, is_archived: false, guest_name: input.guest_name?.trim() || null, reservation_id: null, service_details: null, tags: [], notes: input.notes?.trim() || null };
    const { data, error } = await supabase.from('kanban_cards').insert(payload).select('*').single();
    if (error) throw errorMessage('[KANBAN CREATE CARD]', error);
    if (!data) throw new Error('[KANBAN CREATE CARD]: Supabase não retornou o card.');
    return normalizeCard(data);
  },

  async moveCard(hotelId: string, cardId: string, columnId: string) {
    const { data, error } = await supabase.from('kanban_cards').update({ column_id: columnId, updated_at: new Date().toISOString() }).eq('id', cardId).eq('hotel_id', hotelId).select('*').single();
    if (error) throw errorMessage('[KANBAN MOVE CARD]', error);
    if (!data) throw new Error('[KANBAN MOVE CARD]: card não encontrado.');
    return normalizeCard(data);
  },

  subscribe(hotelId: string, handlers: { onInsert: (card: KanbanV2Card) => void; onUpdate: (card: KanbanV2Card) => void; onDelete: (card: KanbanV2Card) => void; onStatus: (status: string) => void }) {
    const channel = supabase.channel(`kanban-v2-${hotelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onInsert(normalizeCard(payload.new)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onUpdate(normalizeCard(payload.new)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onDelete(normalizeCard(payload.old)))
      .subscribe(status => handlers.onStatus(status));
    return () => { void supabase.removeChannel(channel); };
  },
};
