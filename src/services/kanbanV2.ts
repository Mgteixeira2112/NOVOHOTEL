import { supabase } from '../lib/supabase';

export type KanbanV2Board = { id: string; hotel_id: string; nome: string; departamento: string; descricao: string | null; ativo: boolean; configuracao?: Record<string, unknown>; criado_por: string | null; criado_em: string; atualizado_em: string };
export type KanbanV2Column = { id: string; board_id: string; nome: string; ordem: number; configuracao: Record<string, unknown>; criado_em: string; atualizado_em: string };
export type KanbanV2Card = { id: string; hotel_id: string; board_id: string; column_id: string; titulo: string; descricao: string | null; prioridade: string; ordem: number; departamento: string | null; room_number: string | null; location: string | null; assigned_to: Record<string, unknown> | null; checklist: unknown[]; comments: unknown[]; metadata: Record<string, unknown>; completed_at: string | null; created_at: string; updated_at: string; is_archived: boolean; guest_name: string | null; reservation_id: string | null; service_details: string | null; tags: unknown[]; notes: string | null };

export const KANBAN_TENANT_ID = 'default_hotel';
export const DEFAULT_BOARD_ID = 'kanban-default-board';
const STORAGE_KEY = 'ITAJUBA_PMS_KANBAN_STORE_V2';
const EVENT_BUS_NAME = 'itajuba_kanban_event';

const INITIAL_BOARDS: KanbanV2Board[] = [
  {
    id: DEFAULT_BOARD_ID,
    hotel_id: KANBAN_TENANT_ID,
    nome: 'Operação Geral',
    departamento: 'operacao',
    descricao: 'Quadro operacional unificado do hotel',
    ativo: true,
    configuracao: {},
    criado_por: null,
    criado_em: '2026-01-01T00:00:00.000Z',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'kanban-board-governanca',
    hotel_id: KANBAN_TENANT_ID,
    nome: 'Governança',
    departamento: 'governanca',
    descricao: 'Higienização e liberação de quartos',
    ativo: true,
    configuracao: {},
    criado_por: null,
    criado_em: '2026-01-01T00:00:00.000Z',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'kanban-board-recepcao',
    hotel_id: KANBAN_TENANT_ID,
    nome: 'Recepção',
    departamento: 'recepcao',
    descricao: 'Atendimentos e solicitações de hóspedes',
    ativo: true,
    configuracao: {},
    criado_por: null,
    criado_em: '2026-01-01T00:00:00.000Z',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'kanban-board-manutencao',
    hotel_id: KANBAN_TENANT_ID,
    nome: 'Manutenção',
    departamento: 'manutencao',
    descricao: 'Ordens de serviço e reparos técnicos',
    ativo: true,
    configuracao: {},
    criado_por: null,
    criado_em: '2026-01-01T00:00:00.000Z',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'kanban-board-cozinha',
    hotel_id: KANBAN_TENANT_ID,
    nome: 'Cozinha & Room Service',
    departamento: 'cozinha',
    descricao: 'Preparo e entrega de pedidos',
    ativo: true,
    configuracao: {},
    criado_por: null,
    criado_em: '2026-01-01T00:00:00.000Z',
    atualizado_em: '2026-01-01T00:00:00.000Z',
  }
];

const INITIAL_COLUMNS: KanbanV2Column[] = [
  // Operação Geral
  { id: 'kanban-default-column-entrada', board_id: DEFAULT_BOARD_ID, nome: 'Entrada', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-default-column-andamento', board_id: DEFAULT_BOARD_ID, nome: 'Em andamento', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-default-column-aguardando', board_id: DEFAULT_BOARD_ID, nome: 'Aguardando', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'kanban-default-column-concluido', board_id: DEFAULT_BOARD_ID, nome: 'Concluído', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },

  // Governança
  { id: 'gov-col-a-limpar', board_id: 'kanban-board-governanca', nome: 'A Limpar', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-em-limpeza', board_id: 'kanban-board-governanca', nome: 'Em Limpeza', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-inspecao', board_id: 'kanban-board-governanca', nome: 'Em Inspeção', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'gov-col-liberado', board_id: 'kanban-board-governanca', nome: 'Liberado', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },

  // Recepção
  { id: 'rec-col-novos', board_id: 'kanban-board-recepcao', nome: 'Novas Solicitações', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-atendimento', board_id: 'kanban-board-recepcao', nome: 'Em Atendimento', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-pendente', board_id: 'kanban-board-recepcao', nome: 'Aguardando Hóspede', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'rec-col-finalizado', board_id: 'kanban-board-recepcao', nome: 'Finalizado', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },

  // Manutenção
  { id: 'man-col-chamados', board_id: 'kanban-board-manutencao', nome: 'Fila de Chamados', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-reparo', board_id: 'kanban-board-manutencao', nome: 'Em Execução', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-pecas', board_id: 'kanban-board-manutencao', nome: 'Aguardando Peças', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'man-col-resolvido', board_id: 'kanban-board-manutencao', nome: 'Resolvido', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },

  // Cozinha
  { id: 'coz-col-pedidos', board_id: 'kanban-board-cozinha', nome: 'Novos Pedidos', ordem: 0, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-preparo', board_id: 'kanban-board-cozinha', nome: 'Em Preparo', ordem: 1, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-pronto', board_id: 'kanban-board-cozinha', nome: 'Pronto p/ Entrega', ordem: 2, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
  { id: 'coz-col-entregue', board_id: 'kanban-board-cozinha', nome: 'Entregue', ordem: 3, configuracao: {}, criado_em: '2026-01-01T00:00:00.000Z', atualizado_em: '2026-01-01T00:00:00.000Z' },
];

const INITIAL_CARDS: KanbanV2Card[] = [
  {
    id: 'card-init-1',
    hotel_id: KANBAN_TENANT_ID,
    board_id: DEFAULT_BOARD_ID,
    column_id: 'kanban-default-column-andamento',
    titulo: 'Arrumação Suíte Presidencial 301',
    descricao: 'Hóspede VIP chegando às 15h. Preparar amenities especiais e espumante de boas-vindas.',
    prioridade: 'critica',
    ordem: 1,
    departamento: 'governanca',
    room_number: '301',
    location: 'Quarto 301',
    assigned_to: null,
    checklist: [],
    comments: [],
    metadata: {},
    completed_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    is_archived: false,
    guest_name: 'Alice Guimarães',
    reservation_id: null,
    service_details: null,
    tags: ['VIP', 'Check-in Hoje'],
    notes: null,
  },
  {
    id: 'card-init-2',
    hotel_id: KANBAN_TENANT_ID,
    board_id: DEFAULT_BOARD_ID,
    column_id: 'kanban-default-column-entrada',
    titulo: 'Manutenção Ar Condicionado Q. 204',
    descricao: 'Hóspede reportou ruído no ventilador do ar-condicionado.',
    prioridade: 'atencao',
    ordem: 2,
    departamento: 'manutencao',
    room_number: '204',
    location: 'Quarto 204',
    assigned_to: null,
    checklist: [],
    comments: [],
    metadata: {},
    completed_at: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    is_archived: false,
    guest_name: 'Carlos Drummond',
    reservation_id: null,
    service_details: null,
    tags: ['Manutenção'],
    notes: null,
  },
  {
    id: 'card-init-3',
    hotel_id: KANBAN_TENANT_ID,
    board_id: DEFAULT_BOARD_ID,
    column_id: 'kanban-default-column-concluido',
    titulo: 'Check-in Express Q. 102',
    descricao: 'Check-in e entrega de chaves finalizados com sucesso.',
    prioridade: 'normal',
    ordem: 3,
    departamento: 'recepcao',
    room_number: '102',
    location: 'Recepção',
    assigned_to: null,
    checklist: [],
    comments: [],
    metadata: {},
    completed_at: new Date(Date.now() - 900000).toISOString(),
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 900000).toISOString(),
    is_archived: false,
    guest_name: 'Mariana Silva',
    reservation_id: null,
    service_details: null,
    tags: ['Check-in'],
    notes: null,
  }
];

interface LocalStoreData {
  boards: KanbanV2Board[];
  columns: KanbanV2Column[];
  cards: KanbanV2Card[];
}

function getLocalStore(): LocalStoreData {
  try {
    if (typeof localStorage === 'undefined') {
      return { boards: INITIAL_BOARDS, columns: INITIAL_COLUMNS, cards: INITIAL_CARDS };
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: LocalStoreData = { boards: INITIAL_BOARDS, columns: INITIAL_COLUMNS, cards: INITIAL_CARDS };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      boards: Array.isArray(parsed?.boards) && parsed.boards.length > 0 ? parsed.boards : INITIAL_BOARDS,
      columns: Array.isArray(parsed?.columns) && parsed.columns.length > 0 ? parsed.columns : INITIAL_COLUMNS,
      cards: Array.isArray(parsed?.cards) ? parsed.cards : INITIAL_CARDS,
    };
  } catch {
    return { boards: INITIAL_BOARDS, columns: INITIAL_COLUMNS, cards: INITIAL_CARDS };
  }
}

function saveLocalStore(data: LocalStoreData) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(EVENT_BUS_NAME, { detail: data }));
    }
  } catch {}
}

const normalizeCard = (row: any): KanbanV2Card => ({
  ...row,
  id: String(row.id),
  hotel_id: String(row.hotel_id || KANBAN_TENANT_ID),
  board_id: String(row.board_id),
  column_id: String(row.column_id),
  ordem: Number(row.ordem ?? 0),
  checklist: Array.isArray(row.checklist) ? row.checklist : [],
  comments: Array.isArray(row.comments) ? row.comments : [],
  tags: Array.isArray(row.tags) ? row.tags : [],
  metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
});

export const kanbanV2 = {
  async load(_hotelId?: string) {
    const hotelId = KANBAN_TENANT_ID;
    
    // Tenta carregar do Supabase se a tabela existir
    try {
      const { data: boards, error: boardsError } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('ativo', true)
        .order('criado_em');

      if (!boardsError && boards && boards.length > 0) {
        const boardIds = Array.from(new Set(boards.map((b: any) => String(b.id))));
        const [{ data: columns }, { data: cards }] = await Promise.all([
          supabase.from('kanban_columns').select('*').in('board_id', boardIds).order('ordem'),
          supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId).eq('is_archived', false).order('ordem').order('created_at'),
        ]);

        const finalBoards = boards as KanbanV2Board[];
        const finalColumns = (columns ?? []) as KanbanV2Column[];
        const finalCards = (cards ?? []).map(normalizeCard);

        saveLocalStore({ boards: finalBoards, columns: finalColumns, cards: finalCards });

        return {
          boards: finalBoards,
          columns: finalColumns,
          cards: finalCards,
        };
      }
    } catch {
      // Falha silenciosa para fallback local
    }

    // Fallback garantido e consistente via LocalStorage
    const local = getLocalStore();
    return {
      boards: local.boards,
      columns: local.columns,
      cards: local.cards.map(normalizeCard),
    };
  },

  async createCard(input: { hotelId?: string; boardId: string; columnId: string; titulo: string; descricao?: string; prioridade?: string; departamento?: string; room_number?: string; location?: string; guest_name?: string; notes?: string }) {
    const hotelId = KANBAN_TENANT_ID;
    const title = input.titulo.trim();
    if (!title) throw new Error('Título da tarefa é obrigatório.');
    if (!input.boardId || !input.columnId) throw new Error('Quadro e coluna são obrigatórios.');

    const now = new Date().toISOString();
    const newCard: KanbanV2Card = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      hotel_id: hotelId,
      board_id: input.boardId,
      column_id: input.columnId,
      titulo: title,
      descricao: input.descricao?.trim() || null,
      prioridade: input.prioridade || 'normal',
      ordem: Date.now(),
      departamento: input.departamento || null,
      room_number: input.room_number?.trim() || null,
      location: input.location?.trim() || (input.room_number ? `Quarto ${input.room_number}` : 'Geral'),
      assigned_to: null,
      checklist: [],
      comments: [],
      metadata: {},
      completed_at: null,
      created_at: now,
      updated_at: now,
      is_archived: false,
      guest_name: input.guest_name?.trim() || null,
      reservation_id: null,
      service_details: null,
      tags: input.departamento ? [input.departamento] : [],
      notes: input.notes?.trim() || null,
    };

    // Tenta gravar no Supabase se disponível
    try {
      const { data, error } = await supabase.from('kanban_cards').insert(newCard).select('*').single();
      if (!error && data) {
        const persisted = normalizeCard(data);
        const store = getLocalStore();
        store.cards = [...store.cards.filter(c => c.id !== persisted.id), persisted];
        saveLocalStore(store);
        return persisted;
      }
    } catch {}

    // Salva no armazenamento local resiliente
    const store = getLocalStore();
    store.cards = [...store.cards, newCard];
    saveLocalStore(store);
    return newCard;
  },

  async moveCard(_hotelId: string | undefined, cardId: string, columnId: string) {
    if (!cardId || !columnId) throw new Error('Identificador do card e coluna de destino são obrigatórios.');

    const updatedAt = new Date().toISOString();
    let updatedCard: KanbanV2Card | null = null;

    // Tenta atualizar no Supabase se disponível
    try {
      const { data, error } = await supabase.from('kanban_cards')
        .update({ column_id: columnId, updated_at: updatedAt })
        .eq('id', cardId)
        .select('*')
        .single();
      if (!error && data) {
        updatedCard = normalizeCard(data);
      }
    } catch {}

    const store = getLocalStore();
    const card = store.cards.find(c => c.id === cardId);
    if (!card && !updatedCard) throw new Error('Card não encontrado.');

    const isDone = columnId.includes('concluido') || columnId.includes('liberado') || columnId.includes('finalizado') || columnId.includes('resolvido') || columnId.includes('entregue');

    if (!updatedCard && card) {
      updatedCard = {
        ...card,
        column_id: columnId,
        updated_at: updatedAt,
        completed_at: isDone ? (card.completed_at || updatedAt) : null,
      };
    }

    if (updatedCard) {
      store.cards = store.cards.map(c => c.id === cardId ? updatedCard! : c);
      saveLocalStore(store);

      // Sincronização em tempo real do status de acomodações com o mapa operacional
      const roomNum = updatedCard.room_number || (updatedCard.location?.match(/(\d{2,4})/)?.[1]);
      if (roomNum) {
        let newRoomStatus: string | null = null;
        const colLower = columnId.toLowerCase();
        const dept = (updatedCard.departamento || '').toLowerCase();

        if (colLower.includes('liberado') || (dept === 'governanca' && isDone) || colLower === 'man-col-resolvido') {
          newRoomStatus = 'disponivel';
        } else if (colLower.includes('limpeza') || colLower.includes('inspecao') || (dept === 'governanca' && colLower.includes('andamento'))) {
          newRoomStatus = 'limpeza';
        } else if (colLower.includes('a-limpar') || (dept === 'governanca' && colLower.includes('entrada'))) {
          newRoomStatus = 'sujo';
        } else if (colLower.includes('man-col') || dept === 'manutencao') {
          if (colLower.includes('resolvido') || isDone) {
            newRoomStatus = 'disponivel';
          } else {
            newRoomStatus = 'manutencao';
          }
        }

        if (newRoomStatus && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pms_room_status_sync', {
            detail: { roomNumber: roomNum, status: newRoomStatus, sourceCardId: cardId }
          }));
        }
      }

      return updatedCard;
    }

    throw new Error('Falha ao processar movimentação do card.');
  },

  // Sincroniza o status de um quarto (disponivel, sujo, limpeza, manutencao, ocupado) com o Kanban
  async syncRoomStatus(roomNumber: string, status: string, details?: string) {
    if (!roomNumber) return;
    const store = getLocalStore();
    const now = new Date().toISOString();
    let modified = false;

    if (status === 'sujo') {
      const existing = store.cards.find(c => 
        (c.room_number === roomNumber || c.location?.includes(roomNumber)) &&
        (c.board_id === 'kanban-board-governanca' || c.board_id === DEFAULT_BOARD_ID) &&
        !c.column_id.includes('liberado') && !c.column_id.includes('concluido')
      );
      if (!existing) {
        const newCard: KanbanV2Card = {
          id: `gov_card_${roomNumber}_${Date.now()}`,
          hotel_id: KANBAN_TENANT_ID,
          board_id: 'kanban-board-governanca',
          column_id: 'gov-col-a-limpar',
          titulo: `Higienização Quarto ${roomNumber}`,
          descricao: details || 'Quarto desocupado / necessita arrumação e higienização completa.',
          prioridade: 'atencao',
          ordem: Date.now(),
          departamento: 'governanca',
          room_number: roomNumber,
          location: `Quarto ${roomNumber}`,
          assigned_to: null,
          checklist: [
            { id: '1', text: 'Troca de enxoval e toalhas', completed: false },
            { id: '2', text: 'Limpeza de banheiro e desinfecção', completed: false },
            { id: '3', text: 'Reposição de frigobar e amenities', completed: false },
            { id: '4', text: 'Vistoria e liberação final', completed: false }
          ],
          comments: [],
          metadata: { pms_synced: true },
          completed_at: null,
          created_at: now,
          updated_at: now,
          is_archived: false,
          guest_name: null,
          reservation_id: null,
          service_details: null,
          tags: ['Governança', 'Higienização'],
          notes: null
        };
        store.cards.push(newCard);
        modified = true;
      }
    } else if (status === 'limpeza') {
      store.cards = store.cards.map(c => {
        if ((c.room_number === roomNumber || c.location?.includes(roomNumber)) && (c.board_id === 'kanban-board-governanca' || c.departamento === 'governanca')) {
          modified = true;
          return { ...c, column_id: 'gov-col-em-limpeza', updated_at: now };
        }
        return c;
      });
    } else if (status === 'manutencao') {
      const existing = store.cards.find(c => 
        (c.room_number === roomNumber || c.location?.includes(roomNumber)) &&
        (c.board_id === 'kanban-board-manutencao' || c.departamento === 'manutencao') &&
        !c.column_id.includes('resolvido')
      );
      if (!existing) {
        const newCard: KanbanV2Card = {
          id: `man_card_${roomNumber}_${Date.now()}`,
          hotel_id: KANBAN_TENANT_ID,
          board_id: 'kanban-board-manutencao',
          column_id: 'man-col-chamados',
          titulo: `Manutenção Quarto ${roomNumber}: ${details || 'Reparo Técnico'}`,
          descricao: details || 'Ordem de serviço aberta para manutenção do quarto.',
          prioridade: 'critica',
          ordem: Date.now(),
          departamento: 'manutencao',
          room_number: roomNumber,
          location: `Quarto ${roomNumber}`,
          assigned_to: null,
          checklist: [],
          comments: [],
          metadata: { pms_synced: true },
          completed_at: null,
          created_at: now,
          updated_at: now,
          is_archived: false,
          guest_name: null,
          reservation_id: null,
          service_details: null,
          tags: ['Manutenção', 'Reparo'],
          notes: null
        };
        store.cards.push(newCard);
        modified = true;
      }
    } else if (status === 'disponivel') {
      store.cards = store.cards.map(c => {
        if ((c.room_number === roomNumber || c.location?.includes(roomNumber)) && !c.is_archived) {
          if (c.board_id === 'kanban-board-governanca' && !c.column_id.includes('liberado')) {
            modified = true;
            return { ...c, column_id: 'gov-col-liberado', completed_at: now, updated_at: now };
          }
          if (c.board_id === 'kanban-board-manutencao' && !c.column_id.includes('resolvido')) {
            modified = true;
            return { ...c, column_id: 'man-col-resolvido', completed_at: now, updated_at: now };
          }
          if (c.board_id === DEFAULT_BOARD_ID && !c.column_id.includes('concluido')) {
            modified = true;
            return { ...c, column_id: 'kanban-default-column-concluido', completed_at: now, updated_at: now };
          }
        }
        return c;
      });
    }

    if (modified) {
      saveLocalStore(store);
    }
  },

  // Sincroniza reservas com os quadros operacionais da Recepção
  async syncReservation(res: { id: string; codigo: string; status: string; guestName: string; roomNumber?: string; total?: number; checkin?: string; checkout?: string }) {
    const store = getLocalStore();
    const now = new Date().toISOString();
    let modified = false;

    if (res.status === 'confirmada' || res.status === 'checkin_realizado') {
      const existing = store.cards.find(c => c.reservation_id === res.id || c.titulo.includes(res.codigo));
      const targetColumn = res.status === 'checkin_realizado' ? 'rec-col-atendimento' : 'rec-col-novos';

      if (!existing) {
        const newCard: KanbanV2Card = {
          id: `rec_card_${res.id}_${Date.now()}`,
          hotel_id: KANBAN_TENANT_ID,
          board_id: 'kanban-board-recepcao',
          column_id: targetColumn,
          titulo: `${res.status === 'checkin_realizado' ? 'Hóspede In-House' : 'Check-in Previsto'}: ${res.guestName} (#${res.codigo})`,
          descricao: `Reserva #${res.codigo} | Quarto ${res.roomNumber || 'A definir'} | Check-out: ${res.checkout || 'N/D'}`,
          prioridade: 'normal',
          ordem: Date.now(),
          departamento: 'recepcao',
          room_number: res.roomNumber || null,
          location: res.roomNumber ? `Quarto ${res.roomNumber}` : 'Recepção',
          assigned_to: null,
          checklist: [],
          comments: [],
          metadata: { reservation_id: res.id, total: res.total },
          completed_at: null,
          created_at: now,
          updated_at: now,
          is_archived: false,
          guest_name: res.guestName,
          reservation_id: res.id,
          service_details: null,
          tags: ['Recepção', res.status === 'checkin_realizado' ? 'In-House' : 'Check-in'],
          notes: null
        };
        store.cards.push(newCard);
        modified = true;
      } else if (existing.column_id !== targetColumn) {
        store.cards = store.cards.map(c => c.id === existing.id ? { ...c, column_id: targetColumn, updated_at: now } : c);
        modified = true;
      }
    } else if (res.status === 'checkout_concluido' || res.status === 'cancelada') {
      store.cards = store.cards.map(c => {
        if ((c.reservation_id === res.id || c.titulo.includes(res.codigo)) && !c.column_id.includes('finalizado')) {
          modified = true;
          return { ...c, column_id: 'rec-col-finalizado', completed_at: now, updated_at: now };
        }
        return c;
      });
    }

    if (modified) {
      saveLocalStore(store);
    }
  },

  // Sincroniza estado do frigobar com governança/almoxarifado
  async syncMinibar(roomNumber: string, needsRestock: boolean, missingSummary?: string) {
    if (!roomNumber) return;
    const store = getLocalStore();
    const now = new Date().toISOString();
    let modified = false;

    if (needsRestock) {
      const existing = store.cards.find(c => 
        (c.room_number === roomNumber || c.location?.includes(roomNumber)) &&
        c.titulo.toLowerCase().includes('frigobar') &&
        !c.column_id.includes('concluido') && !c.column_id.includes('liberado')
      );
      if (!existing) {
        const newCard: KanbanV2Card = {
          id: `mb_card_${roomNumber}_${Date.now()}`,
          hotel_id: KANBAN_TENANT_ID,
          board_id: 'kanban-board-governanca',
          column_id: 'gov-col-a-limpar',
          titulo: `Reposição Frigobar Quarto ${roomNumber}`,
          descricao: missingSummary || `Quarto ${roomNumber} necessita reposição de itens de frigobar.`,
          prioridade: 'atencao',
          ordem: Date.now(),
          departamento: 'governanca',
          room_number: roomNumber,
          location: `Quarto ${roomNumber}`,
          assigned_to: null,
          checklist: [],
          comments: [],
          metadata: { type: 'frigobar_restock' },
          completed_at: null,
          created_at: now,
          updated_at: now,
          is_archived: false,
          guest_name: null,
          reservation_id: null,
          service_details: null,
          tags: ['Frigobar', 'Reposição'],
          notes: null
        };
        store.cards.push(newCard);
        modified = true;
      }
    } else {
      store.cards = store.cards.map(c => {
        if ((c.room_number === roomNumber || c.location?.includes(roomNumber)) && c.titulo.toLowerCase().includes('frigobar')) {
          modified = true;
          return { ...c, column_id: 'gov-col-liberado', completed_at: now, updated_at: now };
        }
        return c;
      });
    }

    if (modified) {
      saveLocalStore(store);
    }
  },

  subscribe(_hotelId: string | undefined, handlers: { onInsert: (card: KanbanV2Card) => void; onUpdate: (card: KanbanV2Card) => void; onDelete: (card: KanbanV2Card) => void; onStatus: (status: string) => void }) {
    const hotelId = KANBAN_TENANT_ID;

    // Notifica status inicial como ativo
    handlers.onStatus('SUBSCRIBED');

    // Escuta eventos locais na mesma janela e entre abas
    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<LocalStoreData>;
      if (custom.detail?.cards) {
        // Notifica atualização dos cards
        custom.detail.cards.forEach(card => handlers.onUpdate(normalizeCard(card)));
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed?.cards)) {
            parsed.cards.forEach((card: any) => handlers.onUpdate(normalizeCard(card)));
          }
        } catch {}
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_BUS_NAME, handleCustomEvent);
      window.addEventListener('storage', handleStorageEvent);
    }

    // Canal do Supabase se o banco estiver acessível
    let channel: any = null;
    try {
      channel = supabase.channel(`kanban-v2-${hotelId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onInsert(normalizeCard(payload.new)))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onUpdate(normalizeCard(payload.new)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onDelete(normalizeCard(payload.old)))
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            handlers.onStatus('SUBSCRIBED');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            handlers.onStatus('LOCAL');
          }
        });
    } catch {
      handlers.onStatus('LOCAL');
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_BUS_NAME, handleCustomEvent);
        window.removeEventListener('storage', handleStorageEvent);
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  },
};

