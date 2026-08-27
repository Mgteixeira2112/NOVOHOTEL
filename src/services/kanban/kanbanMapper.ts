import { KanbanBoard, KanbanCard, KanbanColumn, KanbanPriority, KanbanCardAssignee, KanbanChecklistItem, KanbanCardComment } from '../../types/kanban';

/**
 * The production Kanban schema is intentionally small. Optional/domain-specific
 * fields live in metadata so INSERT/UPDATE never sends columns that do not exist.
 */
export function mapDatabaseCardToKanbanCard(row: any): KanbanCard {
  if (!row) throw new Error('mapDatabaseCardToKanbanCard: linha do banco de dados inválida ou nula');
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const originDept = meta.origin_department || row.departamento || undefined;
  const delegatedDept = meta.delegated_to_department || undefined;
  const rawServiceDetails = row.service_details;
  let serviceDetails: string[] = [];
  if (Array.isArray(rawServiceDetails)) serviceDetails = rawServiceDetails.map(String);
  else if (typeof rawServiceDetails === 'string' && rawServiceDetails.trim()) serviceDetails = rawServiceDetails.split('\n').filter(Boolean);
  else if (Array.isArray(meta.service_details)) serviceDetails = meta.service_details.map(String);
  const comments: KanbanCardComment[] = Array.isArray(row.comments) ? row.comments : (Array.isArray(meta.comments) ? meta.comments : []);
  const checklist: KanbanChecklistItem[] = Array.isArray(row.checklist) ? row.checklist : (Array.isArray(meta.checklist) ? meta.checklist : []);
  const tags: string[] = Array.isArray(row.tags) ? row.tags : (Array.isArray(meta.tags) ? meta.tags : []);
  let assignedTo: KanbanCardAssignee | null = null;
  if (row.assigned_to && typeof row.assigned_to === 'object') assignedTo = row.assigned_to as KanbanCardAssignee;
  else if (meta.assigned_to && typeof meta.assigned_to === 'object') assignedTo = meta.assigned_to as KanbanCardAssignee;
  return {
    id: String(row.id), board_id: String(row.board_id), column_id: String(row.column_id),
    title: String(row.titulo || 'Sem título'), location: String(row.location || ''),
    priority: (row.prioridade || 'normal') as KanbanPriority,
    sla_target_minutes: Number(meta.sla_target_minutes ?? 30),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    started_at: meta.started_at || undefined, completed_at: row.completed_at || meta.completed_at || undefined,
    assigned_to: assignedTo, origin_department: originDept, delegated_to_department: delegatedDept,
    guest_name: row.guest_name || meta.guest_name || undefined,
    reservation_id: row.reservation_id || meta.reservation_id || undefined,
    room_number: row.room_number || meta.room_number || undefined,
    order_items: Array.isArray(meta.order_items) ? meta.order_items : undefined,
    service_details: serviceDetails, summary_category: meta.summary_category || undefined,
    amount: meta.amount !== undefined && meta.amount !== null ? Number(meta.amount) : undefined,
    comments, checklist, tags,
    is_archived: Boolean(row.is_archived ?? meta.is_archived ?? false),
    order: Number(row.ordem ?? 0), just_created: Boolean(meta.just_created ?? false),
  };
}

export function mapKanbanCardToDatabaseRow(card: KanbanCard, hotelId: string): Record<string, any> {
  const metadata = {
    sla_target_minutes: card.sla_target_minutes ?? 30,
    started_at: card.started_at || null,
    reservation_id: card.reservation_id || null,
    guest_name: card.guest_name || null,
    room_number: card.room_number || null,
    order_items: card.order_items || [],
    service_details: card.service_details || [],
    summary_category: card.summary_category || null,
    amount: card.amount ?? null,
    origin_department: card.origin_department || null,
    delegated_to_department: card.delegated_to_department || null,
    assigned_to: card.assigned_to || null,
    is_archived: card.is_archived || false,
    just_created: card.just_created || false,
  };
  return {
    id: card.id,
    hotel_id: hotelId,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.title,
    descricao: Array.isArray(card.service_details) && card.service_details.length ? card.service_details.join('\n') : null,
    prioridade: card.priority,
    ordem: card.order || 0,
    departamento: card.delegated_to_department || card.origin_department || null,
    room_number: card.room_number || null,
    location: card.location || '',
    assigned_to: card.assigned_to ? JSON.parse(JSON.stringify(card.assigned_to)) : null,
    checklist: card.checklist ? JSON.parse(JSON.stringify(card.checklist)) : [],
    comments: card.comments ? JSON.parse(JSON.stringify(card.comments)) : [],
    metadata,
    completed_at: card.completed_at || null,
    created_at: card.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_archived: card.is_archived || false,
    guest_name: card.guest_name || null,
    reservation_id: card.reservation_id || null,
    service_details: Array.isArray(card.service_details) ? card.service_details.join('\n') : null,
    tags: card.tags || [],
    notes: card.notes || null,
  };
}

export function mapDatabaseColumnToKanbanColumn(row: any): KanbanColumn {
  const config = row.configuracao && typeof row.configuracao === 'object' ? row.configuracao : {};
  return {
    id: String(row.id), board_id: String(row.board_id), title: String(row.nome || 'Coluna'),
    order: Number(row.ordem ?? 0), color: config.color || '#64748b',
    wip_limit: config.wip_limit !== undefined ? Number(config.wip_limit) : undefined,
    is_final: Boolean(config.is_final ?? false), is_in_progress: Boolean(config.is_in_progress ?? false),
    is_delegated: Boolean(config.is_delegated ?? false)
  };
}

export function mapKanbanColumnToDatabaseRow(column: KanbanColumn): Record<string, any> {
  return {
    id: column.id,
    board_id: column.board_id,
    nome: column.title,
    ordem: column.order || 0,
    configuracao: {
      color: column.color,
      wip_limit: column.wip_limit,
      is_final: Boolean(column.is_final),
      is_in_progress: Boolean(column.is_in_progress),
      is_delegated: Boolean(column.is_delegated)
    },
    atualizado_em: new Date().toISOString()
  };
}

export function mapDatabaseBoardToKanbanBoard(row: any, columns: KanbanColumn[] = []): KanbanBoard {
  const config = row.configuracao && typeof row.configuracao === 'object' ? row.configuracao : {};
  const boardColumns = columns.filter(col => col.board_id === String(row.id)).sort((a, b) => a.order - b.order);
  return {
    id: String(row.id), title: String(row.nome || 'Quadro'),
    department: String(row.departamento || 'geral'), icon_name: String(config.icon_name || 'Layers'),
    description: String(row.descricao || ''), default_sla_minutes: Number(config.default_sla_minutes || 60),
    allowed_roles_manage: Array.isArray(config.allowed_roles_manage) ? config.allowed_roles_manage : ['admin', 'gerente'],
    allowed_roles_view: Array.isArray(config.allowed_roles_view) ? config.allowed_roles_view : ['todas'],
    columns: boardColumns, is_custom: Boolean(config.is_custom ?? false)
  };
}

export function mapKanbanBoardToDatabaseRow(board: KanbanBoard, hotelId: string): Record<string, any> {
  return {
    id: board.id,
    hotel_id: hotelId,
    nome: board.title,
    departamento: board.department,
    descricao: board.description || '',
    ativo: true,
    criado_por: null,
    configuracao: {
      icon_name: board.icon_name || 'Layers',
      default_sla_minutes: board.default_sla_minutes || 60,
      allowed_roles_manage: board.allowed_roles_manage || ['admin', 'gerente'],
      allowed_roles_view: board.allowed_roles_view || ['todas'],
      is_custom: board.is_custom ?? false
    },
    atualizado_em: new Date().toISOString()
  };
}