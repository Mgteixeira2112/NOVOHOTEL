import { supabase } from '../lib/supabase';

export type KanbanV2Board = { id: string; hotel_id: string; nome: string; departamento: string; descricao: string | null; ativo: boolean; configuracao?: Record<string, unknown>; criado_por: string | null; criado_em: string; atualizado_em: string };
export type KanbanV2Column = { id: string; board_id: string; nome: string; ordem: number; configuracao: Record<string, unknown>; criado_em: string; atualizado_em: string };
export type KanbanV2Card = { id: string; hotel_id: string; board_id: string; column_id: string; titulo: string; descricao: string | null; prioridade: string; ordem: number; departamento: string | null; room_number: string | null; location: string | null; assigned_to: Record<string, unknown> | null; checklist: unknown[]; comments: unknown[]; metadata: Record<string, unknown>; completed_at: string | null; created_at: string; updated_at: string; is_archived: boolean; guest_name: string | null; reservation_id: string | null; service_details: string | null; tags: unknown[]; notes: string | null };

export const KANBAN_TENANT_ID = 'default_hotel';
export const DEFAULT_BOARD_ID = 'kanban-default-board';
const STORAGE_KEY = 'ITAJUBA_PMS_KANBAN_STORE_V2';
const EVENT_BUS_NAME = 'itajuba_kanban_event';

const INITIAL_BOARDS: KanbanV2Board[] = [
  { id: DEFAULT_BOARD_ID, hotel_id: KANBAN_TENANT_ID, nome: 'Operação Geral', departamento: 'operacao', descricao: 'Quadro operacional unificado do hotel', ativo: true, configuracao: {}, criado_por: null, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-board-governanca', hotel_id: KANBAN_TENANT_ID, nome: 'Governança', departamento: 'governanca', descricao: 'Higienização e liberação de quartos', ativo: true, configuracao: {}, criado_por: null, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-board-recepcao', hotel_id: KANBAN_TENANT_ID, nome: 'Recepção', departamento: 'recepcao', descricao: 'Atendimentos e solicitações de hóspedes', ativo: true, configuracao: {}, criado_por: null, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-board-manutencao', hotel_id: KANBAN_TENANT_ID, nome: 'Manutenção', departamento: 'manutencao', descricao: 'Ordens de serviço e reparos técnicos', ativo: true, configuracao: {}, criado_por: null, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-board-cozinha', hotel_id: KANBAN_TENANT_ID, nome: 'Cozinha & Room Service', departamento: 'cozinha', descricao: 'Preparo e entrega de pedidos', ativo: true, configuracao: {}, criado_por: null, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' }
];

const INITIAL_COLUMNS: KanbanV2Column[] = [
  { id: 'kanban-default-column-entrada', board_id: DEFAULT_BOARD_ID, nome: 'Entrada', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-default-column-andamento', board_id: DEFAULT_BOARD_ID, nome: 'Em andamento', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-default-column-aguardando', board_id: DEFAULT_BOARD_ID, nome: 'Aguardando', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-default-column-concluido', board_id: DEFAULT_BOARD_ID, nome: 'Concluído', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-a-limpar', board_id: 'kanban-board-governanca', nome: 'A Limpar', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-em-limpeza', board_id: 'kanban-board-governanca', nome: 'Em Limpeza', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-inspecao', board_id: 'kanban-board-governanca', nome: 'Em Inspeção', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-liberado', board_id: 'kanban-board-governanca', nome: 'Liberado', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-novos', board_id: 'kanban-board-recepcao', nome: 'Novas Solicitações', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-atendimento', board_id: 'kanban-board-recepcao', nome: 'Em Atendimento', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-pendente', board_id: 'kanban-board-recepcao', nome: 'Aguardando Hóspede', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-finalizado', board_id: 'kanban-board-recepcao', nome: 'Finalizado', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-chamados', board_id: 'kanban-board-manutencao', nome: 'Fila de Chamados', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-reparo', board_id: 'kanban-board-manutencao', nome: 'Em Execução', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-pecas', board_id: 'kanban-board-manutencao', nome: 'Aguardando Peças', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-resolvido', board_id: 'kanban-board-manutencao', nome: 'Resolvido', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-pedidos', board_id: 'kanban-board-cozinha', nome: 'Novos Pedidos', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-preparo', board_id: 'kanban-board-cozinha', nome: 'Em Preparo', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-pronto', board_id: 'kanban-board-cozinha', nome: 'Pronto p/ Entrega', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-entregue', board_id: 'kanban-board-cozinha', nome: 'Entregue', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' }
];

const INITIAL_CARDS: KanbanV2Card[] = [];

interface LocalStoreData { boards: KanbanV2Board[]; columns: KanbanV2Column[]; cards: KanbanV2Card[]; }

function getLocalStore(): LocalStoreData {
  try {
    if (typeof localStorage === 'undefined') return { boards: INITIAL_BOARDS, columns: INITIAL_COLUMNS, cards: INITIAL_CARDS };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = { boards: INITIAL_BOARDS, columns: INITIAL_COLUMNS, cards: INITIAL_CARDS };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      boards: Array.isArray(parsed?.boards) && parsed.boards.length > 0 ? parsed.boards : INITIAL_BOARDS,
      columns: Array.isArray(parsed?.columns) && parsed.columns.length > 0 ? parsed.columns : INITIAL_COLUMNS,
      cards: Array.isArray(parsed?.cards) ? parsed.cards : INITIAL_CARDS,
    };
  } catch { return { boards: INITIAL_BOARDS, columns: INITIAL_COLUMNS, cards: INITIAL_CARDS }; }
}

function saveLocalStore(data: LocalStoreData) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(EVENT_BUS_NAME, { detail: data }));
    }
  } catch {}
}

const normalizeCard = (row: any): KanbanV2Card => ({ ...row, id: String(row.id), hotel_id: String(row.hotel_id || KANBAN_TENANT_ID), board_id: String(row.board_id), column_id: String(row.column_id), ordem: Number(row.ordem ?? 0), checklist: Array.isArray(row.checklist) ? row.checklist : [], comments: Array.isArray(row.comments) ? row.comments : [], tags: Array.isArray(row.tags) ? row.tags : [], metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {} });

export const kanbanV2 = {
  async load(_hotelId?: string) {
    const hotelId = KANBAN_TENANT_ID;
    try {
      const { data: boards, error: boardsError } = await supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true).order('criado_em');
      if (!boardsError && boards && boards.length > 0) {
        const boardIds = Array.from(new Set(boards.map((b: any) => String(b.id))));
        const [{ data: columns }, { data: cards }] = await Promise.all([
          supabase.from('kanban_columns').select('*').in('board_id', boardIds).order('ordem'),
          supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId).eq('is_archived', false).order('ordem').order('created_at'),
        ]);
        const result = { boards: boards as KanbanV2Board[], columns: (columns ?? []) as KanbanV2Column[], cards: (cards ?? []).map(normalizeCard) };
        saveLocalStore(result);
        return result;
      }
    } catch {}
    const local = getLocalStore();
    return { boards: local.boards, columns: local.columns, cards: local.cards.map(normalizeCard) };
  },

  async createCard(input: { hotelId?: string; boardId: string; columnId: string; titulo: string; descricao?: string; prioridade?: string; departamento?: string; room_number?: string; location?: string; assigned_to?: Record<string, unknown> | null; guest_name?: string; notes?: string }) {
    const title = input.titulo.trim();
    if (!title) throw new Error('Título da tarefa é obrigatório.');
    if (!input.boardId || !input.columnId) throw new Error('Quadro e coluna são obrigatórios.');

    const payload = {
      hotel_id: KANBAN_TENANT_ID,
      board_id: input.boardId,
      column_id: input.columnId,
      titulo: title,
      descricao: input.descricao?.trim() || null,
      prioridade: input.prioridade || 'normal',
      ordem: Date.now(),
      departamento: input.departamento || null,
      room_number: input.room_number?.trim() || null,
      location: input.location?.trim() || (input.room_number ? `Quarto ${input.room_number}` : 'Geral'),
      assigned_to: input.assigned_to || null,
      checklist: [], comments: [], metadata: {}, completed_at: null,
      is_archived: false,
      guest_name: input.guest_name?.trim() || null,
      reservation_id: null, service_details: null,
      tags: input.departamento ? [input.departamento] : [],
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase.from('kanban_cards').insert(payload).select('*').single();
    if (error) throw new Error(`Falha ao criar card no Supabase: ${error.message}`);
    if (!data) throw new Error('Falha ao criar card no Supabase: nenhum registro retornado.');

    const persisted = normalizeCard(data);
    const store = getLocalStore();
    store.cards = [...store.cards.filter(c => c.id !== persisted.id), persisted];
    saveLocalStore(store);
    return persisted;
  },

  async updateCard(cardId: string, updates: Partial<KanbanV2Card>) {
    if (!cardId) throw new Error('Identificador do card é obrigatório.');
    const updatedAt = new Date().toISOString();
    let updatedCard: KanbanV2Card | null = null;
    const sanitized = { ...updates, updated_at: updatedAt };
    delete (sanitized as any).id;
    try {
      const { data, error } = await supabase.from('kanban_cards').update(sanitized).eq('id', cardId).select('*').single();
      if (!error && data) updatedCard = normalizeCard(data);
    } catch {}
    const store = getLocalStore();
    const card = store.cards.find(c => c.id === cardId);
    if (!card && !updatedCard) throw new Error('Card não encontrado.');
    if (!updatedCard && card) updatedCard = { ...card, ...updates, updated_at: updatedAt };
    if (updatedCard) {
      store.cards = store.cards.map(c => c.id === cardId ? updatedCard! : c);
      saveLocalStore(store);
      return updatedCard;
    }
    throw new Error('Falha ao atualizar card.');
  },

  async deleteCard(cardId: string) {
    if (!cardId) return;
    try { await supabase.from('kanban_cards').delete().eq('id', cardId); } catch {}
    const store = getLocalStore();
    store.cards = store.cards.filter(c => c.id !== cardId);
    saveLocalStore(store);
  },

  async moveCard(_hotelId: string | undefined, cardId: string, columnId: string) {
    if (!cardId || !columnId) throw new Error('Identificador do card e coluna de destino são obrigatórios.');
    const updatedAt = new Date().toISOString();
    let updatedCard: KanbanV2Card | null = null;
    try {
      const { data, error } = await supabase.from('kanban_cards').update({ column_id: columnId, updated_at: updatedAt }).eq('id', cardId).select('*').single();
      if (!error && data) updatedCard = normalizeCard(data);
    } catch {}
    const store = getLocalStore();
    const card = store.cards.find(c => c.id === cardId);
    if (!card && !updatedCard) throw new Error('Card não encontrado.');
    const isDone = columnId.includes('concluido') || columnId.includes('liberado') || columnId.includes('finalizado') || columnId.includes('resolvido') || columnId.includes('entregue');
    if (!updatedCard && card) updatedCard = { ...card, column_id: columnId, updated_at: updatedAt, completed_at: isDone ? (card.completed_at || updatedAt) : null };
    if (updatedCard) {
      store.cards = store.cards.map(c => c.id === cardId ? updatedCard! : c);
      saveLocalStore(store);
      return updatedCard;
    }
    throw new Error('Falha ao processar movimentação do card.');
  },

  async syncRoomStatus(_roomNumber: string, _status: string, _details?: string) {},
  async syncReservation(_res: { id: string; codigo: string; status: string; guestName: string; roomNumber?: string; total?: number; checkin?: string; checkout?: string }) {},
  async syncMinibar(_roomNumber: string, _needsRestock: boolean, _missingSummary?: string) {},

  subscribe(_hotelId: string | undefined, handlers: { onInsert: (card: KanbanV2Card) => void; onUpdate: (card: KanbanV2Card) => void; onDelete: (card: KanbanV2Card) => void; onStatus: (status: string) => void }) {
    const hotelId = KANBAN_TENANT_ID;
    handlers.onStatus('CONNECTING');
    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<LocalStoreData>;
      if (custom.detail?.cards) custom.detail.cards.forEach(card => handlers.onUpdate(normalizeCard(card)));
    };
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed?.cards)) parsed.cards.forEach((card: any) => handlers.onUpdate(normalizeCard(card)));
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_BUS_NAME, handleCustomEvent);
      window.addEventListener('storage', handleStorageEvent);
    }
    let channel: any = null;
    try {
      channel = supabase.channel(`kanban-v2-${hotelId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onInsert(normalizeCard(payload.new)))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onUpdate(normalizeCard(payload.new)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onDelete(normalizeCard(payload.old)))
        .subscribe(status => {
          if (status === 'SUBSCRIBED') handlers.onStatus('SUBSCRIBED');
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') handlers.onStatus('LOCAL');
        });
    } catch { handlers.onStatus('LOCAL'); }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_BUS_NAME, handleCustomEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
      if (channel) void supabase.removeChannel(channel);
    };
  },
};
