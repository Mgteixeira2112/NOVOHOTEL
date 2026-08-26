import { supabase } from '../lib/supabase';
import { KanbanBoard, KanbanCard, KanbanColumn } from '../types/kanban';

export type KanbanRealtimeTable = 'kanban_boards' | 'kanban_columns' | 'kanban_cards';

const boardToRow = (board: KanbanBoard, hotelId: string) => ({
  id: board.id,
  hotel_id: hotelId,
  nome: board.title,
  departamento: board.department,
  descricao: board.description,
  configuracao: {
    icon_name: board.icon_name,
    default_sla_minutes: board.default_sla_minutes,
    allowed_roles_manage: board.allowed_roles_manage,
    allowed_roles_view: board.allowed_roles_view,
    is_custom: board.is_custom ?? false,
  },
});

const columnToRow = (column: KanbanColumn) => ({
  id: column.id,
  board_id: column.board_id,
  nome: column.title,
  ordem: column.order,
  configuracao: {
    color: column.color,
    wip_limit: column.wip_limit,
    is_final: column.is_final ?? false,
    is_in_progress: column.is_in_progress ?? false,
    is_delegated: column.is_delegated ?? false,
  },
});

const cardToRow = (card: KanbanCard, hotelId: string) => ({
  id: card.id,
  hotel_id: hotelId,
  board_id: card.board_id,
  column_id: card.column_id,
  titulo: card.title,
  descricao: card.service_details?.join('\n') || null,
  prioridade: card.priority,
  ordem: card.order,
  departamento: card.delegated_to_department || card.origin_department || null,
  room_number: card.room_number || null,
  location: card.location,
  assigned_to: card.assigned_to || null,
  checklist: card.checklist || [],
  comments: card.comments || [],
  metadata: {
    sla_target_minutes: card.sla_target_minutes,
    started_at: card.started_at,
    reservation_id: card.reservation_id,
    guest_name: card.guest_name,
    order_items: card.order_items,
    summary_category: card.summary_category,
    amount: card.amount,
    tags: card.tags,
    is_archived: card.is_archived,
    just_created: card.just_created,
  },
  completed_at: card.completed_at || null,
  created_at: card.created_at,
  updated_at: new Date().toISOString(),
});

const rowToCard = (row: any): KanbanCard => ({
  id: row.id,
  board_id: row.board_id,
  column_id: row.column_id,
  title: row.titulo,
  location: row.location || '',
  priority: row.prioridade,
  sla_target_minutes: Number(row.metadata?.sla_target_minutes || 0),
  created_at: row.created_at,
  started_at: row.metadata?.started_at || undefined,
  completed_at: row.completed_at || undefined,
  assigned_to: row.assigned_to || null,
  origin_department: row.metadata?.origin_department || row.departamento || undefined,
  delegated_to_department: row.metadata?.delegated_to_department || row.departamento || undefined,
  guest_name: row.metadata?.guest_name,
  reservation_id: row.metadata?.reservation_id,
  room_number: row.room_number || undefined,
  order_items: row.metadata?.order_items,
  service_details: row.descricao ? String(row.descricao).split('\n') : [],
  summary_category: row.metadata?.summary_category,
  amount: row.metadata?.amount,
  comments: row.comments || [],
  checklist: row.checklist || [],
  tags: row.metadata?.tags,
  is_archived: row.metadata?.is_archived,
  order: Number(row.ordem || 0),
  just_created: row.metadata?.just_created,
});

const rowToColumn = (row: any): KanbanColumn => ({
  id: row.id,
  board_id: row.board_id,
  title: row.nome,
  order: Number(row.ordem || 0),
  color: row.configuracao?.color,
  wip_limit: row.configuracao?.wip_limit,
  is_final: row.configuracao?.is_final,
  is_in_progress: row.configuracao?.is_in_progress,
  is_delegated: row.configuracao?.is_delegated,
});

const rowToBoard = (row: any, columns: KanbanColumn[]): KanbanBoard => ({
  id: row.id,
  title: row.nome,
  department: row.departamento,
  icon_name: row.configuracao?.icon_name || 'Layers',
  description: row.descricao || '',
  default_sla_minutes: Number(row.configuracao?.default_sla_minutes || 60),
  allowed_roles_manage: row.configuracao?.allowed_roles_manage || [],
  allowed_roles_view: row.configuracao?.allowed_roles_view || [],
  columns: columns.filter(column => column.board_id === row.id).sort((a, b) => a.order - b.order),
  is_custom: row.configuracao?.is_custom ?? true,
});

export async function loadPersistentKanban(hotelId: string) {
  const [{ data: boardRows, error: boardError }, { data: columnRows, error: columnError }, { data: cardRows, error: cardError }] = await Promise.all([
    supabase.from('kanban_boards').select('*').eq('hotel_id', hotelId).eq('ativo', true),
    supabase.from('kanban_columns').select('*'),
    supabase.from('kanban_cards').select('*').eq('hotel_id', hotelId),
  ]);

  if (boardError) throw boardError;
  if (columnError) throw columnError;
  if (cardError) throw cardError;

  const columns = (columnRows || []).map(rowToColumn);
  return {
    boards: (boardRows || []).map(row => rowToBoard(row, columns)),
    cards: (cardRows || []).map(rowToCard),
  };
}

export async function upsertKanbanBoard(hotelId: string, board: KanbanBoard) {
  const { error } = await supabase.from('kanban_boards').upsert(boardToRow(board, hotelId));
  if (error) throw error;
  if (board.columns.length) {
    const { error: columnsError } = await supabase.from('kanban_columns').upsert(board.columns.map(columnToRow));
    if (columnsError) throw columnsError;
  }
}

export async function upsertKanbanCard(hotelId: string, card: KanbanCard) {
  const { error } = await supabase.from('kanban_cards').upsert(cardToRow(card, hotelId));
  if (error) throw error;
}

export async function deletePersistentKanbanCard(cardId: string) {
  const { error } = await supabase.from('kanban_cards').delete().eq('id', cardId);
  if (error) throw error;
}

export function subscribeToKanbanRealtime(hotelId: string, handlers: {
  onCardChange?: (payload: any) => void;
  onBoardChange?: (payload: any) => void;
  onColumnChange?: (payload: any) => void;
}) {
  const channel = supabase.channel(`hotel-kanban-${hotelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_cards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onCardChange?.(payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_boards', filter: `hotel_id=eq.${hotelId}` }, payload => handlers.onBoardChange?.(payload))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_columns' }, payload => handlers.onColumnChange?.(payload))
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
