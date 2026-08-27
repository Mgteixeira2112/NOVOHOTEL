import { KanbanBoard, KanbanCard, KanbanColumn, KanbanPriority, KanbanCardAssignee, KanbanChecklistItem, KanbanCardComment } from '../../types/kanban';

export function mapDatabaseCardToKanbanCard(row: any): KanbanCard {
  if (!row) throw new Error('mapDatabaseCardToKanbanCard: linha do banco de dados inválida ou nula');
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const originDept = row.origin_department || meta.origin_department || row.departamento || undefined;
  const delegatedDept = row.delegated_to_department || meta.delegated_to_department || undefined;
  let serviceDetails: string[] = [];
  if (Array.isArray(row.service_details) && row.service_details.length > 0) serviceDetails = row.service_details.map(String);
  else if (typeof row.descricao === 'string' && row.descricao.trim().length > 0) serviceDetails = row.descricao.split('\n');
  else if (Array.isArray(meta.service_details)) serviceDetails = meta.service_details.map(String);
  const comments: KanbanCardComment[] = Array.isArray(row.comments) ? row.comments : (Array.isArray(meta.comments) ? meta.comments : []);
  const checklist: KanbanChecklistItem[] = Array.isArray(row.checklist) ? row.checklist : (Array.isArray(meta.checklist) ? meta.checklist : []);
  const tags: string[] = Array.isArray(row.tags) ? row.tags : (Array.isArray(meta.tags) ? meta.tags : []);
  let assignedTo: KanbanCardAssignee | null = null;
  if (row.assigned_to && typeof row.assigned_to === 'object') assignedTo = row.assigned_to as KanbanCardAssignee;
  else if (meta.assigned_to && typeof meta.assigned_to === 'object') assignedTo = meta.assigned_to as KanbanCardAssignee;
  return {
    id: String(row.id),
    board_id: String(row.board_id),
    column_id: String(row.column_id),
    title: String(row.titulo || row.title || 'Sem título'),
    location: String(row.location || ''),
    priority: (row.prioridade || row.priority || 'normal') as KanbanPriority,
    sla_target_minutes: Number(row.sla_target_minutes ?? meta.sla_target_minutes ?? 30),
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    started_at: row.started_at || meta.started_at || undefined,
    completed_at: row.completed_at || meta.completed_at || undefined,
    assigned_to: assignedTo,
    origin_department: originDept,
    delegated_to_department: delegatedDept,
    guest_name: row.guest_name || meta.guest_name || undefined,
    reservation_id: row.reservation_id || meta.reservation_id || undefined,
    room_number: row.room_number || meta.room_number || undefined,
    order_items: Array.isArray(row.order_items) ? row.order_items : (Array.isArray(meta.order_items) ? meta.order_items : undefined),
    service_details: serviceDetails,
    summary_category: row.summary_category || meta.summary_category || undefined,
    amount: row.amount !== undefined && row.amount !== null ? Number(row.amount) : (meta.amount !== undefined && meta.amount !== null ? Number(meta.amount) : undefined),
    comments,
    checklist,
    tags,
    is_archived: Boolean(row.is_archived ?? meta.is_archived ?? false),
    order: Number(row.ordem ?? row.order ?? 0),
    just_created: Boolean(meta.just_created ?? false),
  };
}

export function mapKanbanCardToDatabaseRow(card: KanbanCard, hotelId: string): Record<string, any> {
  const metadata = {
    sla_target_minutes: card.sla_target_minutes,
    started_at: card.started_at || null,
    completed_at: card.completed_at || null,
    reservation_id: card.reservation_id || null,
    guest_name: card.guest_name || null,
    room_number: card.room_number || null,
    order_items: card.order_items || [],
    service_details: card.service_details || [],
    summary_category: card.summary_category || null,
    amount: card.amount ?? null,
    tags: card.tags || [],
    origin_department: card.origin_department || null,
    delegated_to_department: card.delegated_to_department || null,
    assigned_to: card.assigned_to || null,
    is_archived: card.is_archived || false,
    just_created: card.just_created || false,
  };
  const serviceDetails = Array.isArray(card.service_details) ? card.service_details : [];
  return {
    id: card.id,
    hotel_id: hotelId,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.title,
    descricao: serviceDetails.length > 0 ? serviceDetails.join('\n') : null,
    prioridade: card.priority,
    ordem: card.order || 0,
    departamento: card.delegated_to_department || card.origin_department || null,
    location: card.location || '',
    room_number: card.room_number || null,
    guest_name: card.guest_name || null,
    reservation_id: card.reservation_id || null,
    assigned_to: card.assigned_to ? JSON.parse(JSON.stringify(card.assigned_to)) : null,
    origin_department: card.origin_department || null,
    delegated_to_department: card.delegated_to_department || null,
    sla_target_minutes: card.sla_target_minutes || 30,
    started_at: card.started_at || null,
    completed_at: card.completed_at || null,
    order_items: card.order_items ? JSON.parse(JSON.stringify(card.order_items)) : [],
    service_details: serviceDetails,
    summary_category: card.summary_category || null,
    amount: card.amount !== undefined && card.amount !== null ? Number(card.amount) : null,
    tags: card.tags || [],
    checklist: card.checklist ? JSON.parse(JSON.stringify(card.checklist)) : [],
    comments: card.comments ? JSON.parse(JSON.stringify(card.comments)) : [],
    metadata,
    is_archived: card.is_archived || false,
    created_at: card.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function mapDatabaseColumnToKanbanColumn(row: any): KanbanColumn {
  const config = row.configuracao && typeof row.configuracao === 'object' ? row.configuracao : {};
  return { id: String(row.id), board_id: String(row.board_id), title: String(row.nome || row.title || 'Coluna'), order: Number(row.ordem ?? row.order ?? 0), color: row.cor || config.color || '#64748b', wip_limit: row.wip_limit !== null && row.wip_limit !== undefined ? Number(row.wip_limit) : (config.wip_limit !== undefined ? Number(config.wip_limit) : undefined), is_final: Boolean(row.is_final ?? config.is_final ?? false), is_in_progress: Boolean(row.is_in_progress ?? config.is_in_progress ?? false), is_delegated: Boolean(row.is_delegated ?? config.is_delegated ?? false) };
}

export function mapKanbanColumnToDatabaseRow(column: KanbanColumn): Record<string, any> {
  return { id: column.id, board_id: column.board_id, nome: column.title, ordem: column.order || 0, cor: column.color || null, wip_limit: column.wip_limit ?? null, is_final: Boolean(column.is_final), is_in_progress: Boolean(column.is_in_progress), is_delegated: Boolean(column.is_delegated), configuracao: { color: column.color, wip_limit: column.wip_limit, is_final: column.is_final ?? false, is_in_progress: column.is_in_progress ?? false, is_delegated: column.is_delegated ?? false }, atualizado_em: new Date().toISOString() };
}

export function mapDatabaseBoardToKanbanBoard(row: any, columns: KanbanColumn[] = []): KanbanBoard {
  const config = row.configuracao && typeof row.configuracao === 'object' ? row.configuracao : {};
  const boardColumns = columns.filter(col => col.board_id === row.id).sort((a, b) => a.order - b.order);
  return { id: String(row.id), title: String(row.nome || row.title || 'Quadro'), department: String(row.departamento || row.department || 'geral'), icon_name: String(row.icon_name || config.icon_name || 'Layers'), description: String(row.descricao || row.description || ''), default_sla_minutes: Number(row.default_sla_minutes || config.default_sla_minutes || 60), allowed_roles_manage: Array.isArray(row.allowed_roles_manage) ? row.allowed_roles_manage : (Array.isArray(config.allowed_roles_manage) ? config.allowed_roles_manage : ['admin', 'gerente']), allowed_roles_view: Array.isArray(row.allowed_roles_view) ? row.allowed_roles_view : (Array.isArray(config.allowed_roles_view) ? config.allowed_roles_view : ['todas']), columns: boardColumns, is_custom: Boolean(row.is_custom ?? config.is_custom ?? false) };
}

export function mapKanbanBoardToDatabaseRow(board: KanbanBoard, hotelId: string): Record<string, any> {
  return { id: board.id, hotel_id: hotelId, nome: board.title, departamento: board.department, descricao: board.description || '', icon_name: board.icon_name || 'Layers', default_sla_minutes: board.default_sla_minutes || 60, allowed_roles_manage: board.allowed_roles_manage || ['admin', 'gerente'], allowed_roles_view: board.allowed_roles_view || ['todas'], ativo: true, configuracao: { icon_name: board.icon_name, default_sla_minutes: board.default_sla_minutes, allowed_roles_manage: board.allowed_roles_manage, allowed_roles_view: board.allowed_roles_view, is_custom: board.is_custom ?? false }, atualizado_em: new Date().toISOString() };
}
