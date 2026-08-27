import { supabase } from '../lib/supabase';
import { KANBAN_TENANT_ID, kanbanV2, KanbanV2Card } from './kanbanV2';

export type KanbanCardEventType =
  | 'created'
  | 'updated'
  | 'moved'
  | 'assigned'
  | 'completed'
  | 'reopened'
  | 'deleted'
  | 'restored';

export interface KanbanGovernanceActor {
  userId?: string | null;
}

export interface CreateGovernedKanbanCardInput {
  hotelId?: string;
  boardId: string;
  columnId: string;
  titulo: string;
  descricao?: string;
  prioridade?: string;
  departamento?: string;
  room_number?: string;
  location?: string;
  assigned_to?: Record<string, unknown> | null;
  guest_name?: string;
  notes?: string;
}

export interface KanbanCardAuditEvent {
  id: string;
  hotel_id: string;
  card_id: string;
  user_id: string | null;
  event_type: KanbanCardEventType;
  from_value: Record<string, unknown> | null;
  to_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface KanbanAuditReadResult<T> {
  available: boolean;
  data: T[];
  message?: string;
}

type DepartmentBoardTarget = {
  boardId: string;
  initialColumnId: string;
};

const DEPARTMENT_BOARD_TARGETS: Record<string, DepartmentBoardTarget> = {
  operacao: {
    boardId: 'kanban-default-board',
    initialColumnId: 'kanban-default-column-entrada',
  },
  governanca: {
    boardId: 'kanban-board-governanca',
    initialColumnId: 'gov-col-a-limpar',
  },
  recepcao: {
    boardId: 'kanban-board-recepcao',
    initialColumnId: 'rec-col-novos',
  },
  manutencao: {
    boardId: 'kanban-board-manutencao',
    initialColumnId: 'man-col-chamados',
  },
  cozinha: {
    boardId: 'kanban-board-cozinha',
    initialColumnId: 'coz-col-pedidos',
  },
};

function assignedUserId(value: Record<string, unknown> | null | undefined): string | null {
  const id = value?.id;
  return typeof id === 'string' && id ? id : null;
}

function normalizedAssignedUserId(card: KanbanV2Card): string | null {
  const normalized = (card as any).assigned_user_id;
  return typeof normalized === 'string' && normalized
    ? normalized
    : assignedUserId(card.assigned_to);
}

function normalizeGovernedCard(row: any): KanbanV2Card {
  return {
    ...row,
    id: String(row.id),
    hotel_id: String(row.hotel_id || KANBAN_TENANT_ID),
    board_id: String(row.board_id || ''),
    column_id: String(row.column_id || ''),
    ordem: Number(row.ordem ?? 0),
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
  } as KanbanV2Card;
}

function compactCardSnapshot(card: KanbanV2Card | null | undefined) {
  if (!card) return null;
  const extended = card as any;
  return {
    id: card.id,
    board_id: card.board_id,
    column_id: card.column_id,
    titulo: card.titulo,
    prioridade: card.prioridade,
    departamento: card.departamento,
    assigned_user_id: normalizedAssignedUserId(card),
    room_number: card.room_number,
    completed_at: card.completed_at,
    is_archived: card.is_archived,
    deleted_at: extended.deleted_at || null,
  };
}

function normalizeDepartmentTransition(
  currentCard: KanbanV2Card,
  updates: Partial<KanbanV2Card>,
): Partial<KanbanV2Card> {
  const requestedDepartment = typeof updates.departamento === 'string'
    ? updates.departamento.trim().toLowerCase()
    : null;
  const currentDepartment = (currentCard.departamento || '').trim().toLowerCase();

  if (!requestedDepartment || requestedDepartment === currentDepartment) {
    return updates;
  }

  const target = DEPARTMENT_BOARD_TARGETS[requestedDepartment];
  if (!target) {
    throw new Error('O setor selecionado não possui um quadro operacional configurado.');
  }

  return {
    ...updates,
    departamento: requestedDepartment,
    board_id: target.boardId,
    column_id: target.initialColumnId,
    completed_at: null,
  };
}

async function bestEffortAuditFields(input: {
  cardId: string;
  actorUserId?: string | null;
  assignedUserId?: string | null;
  created?: boolean;
  deleted?: boolean;
  restored?: boolean;
}) {
  const payload: Record<string, unknown> = {};

  if (input.actorUserId) {
    payload.updated_by_user_id = input.actorUserId;
    if (input.created) payload.created_by_user_id = input.actorUserId;
    if (input.deleted) payload.deleted_by_user_id = input.actorUserId;
  }

  if (input.assignedUserId !== undefined) payload.assigned_user_id = input.assignedUserId;
  if (input.deleted) payload.deleted_at = new Date().toISOString();
  if (input.restored) {
    payload.deleted_at = null;
    payload.deleted_by_user_id = null;
  }

  if (Object.keys(payload).length === 0) return;

  try {
    await supabase.from('kanban_cards').update(payload).eq('id', input.cardId);
  } catch {
    // A migration de auditoria é aditiva. Falhas aqui nunca bloqueiam o fluxo operacional.
  }
}

async function appendEvent(input: {
  cardId: string;
  actorUserId?: string | null;
  eventType: KanbanCardEventType;
  fromValue?: unknown;
  toValue?: unknown;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabase.from('kanban_card_events').insert({
      hotel_id: KANBAN_TENANT_ID,
      card_id: input.cardId,
      user_id: input.actorUserId || null,
      event_type: input.eventType,
      from_value: input.fromValue ?? null,
      to_value: input.toValue ?? null,
      metadata: input.metadata || {},
    });
  } catch {
    // Compatibilidade enquanto a tabela de eventos ainda não existir no banco real.
  }
}

function assignmentChanged(before: KanbanV2Card, after: KanbanV2Card): boolean {
  return normalizedAssignedUserId(before) !== normalizedAssignedUserId(after);
}

export const kanbanCardGovernance = {
  async createCard(input: CreateGovernedKanbanCardInput, actor: KanbanGovernanceActor = {}) {
    const card = await kanbanV2.createCard(input);
    const responsibleId = assignedUserId(card.assigned_to);

    await bestEffortAuditFields({
      cardId: card.id,
      actorUserId: actor.userId,
      assignedUserId: responsibleId,
      created: true,
    });
    await appendEvent({
      cardId: card.id,
      actorUserId: actor.userId,
      eventType: 'created',
      toValue: compactCardSnapshot(card),
    });

    return {
      ...card,
      assigned_user_id: responsibleId,
      created_by_user_id: actor.userId || null,
      updated_by_user_id: actor.userId || null,
    } as KanbanV2Card;
  },

  async updateCard(
    currentCard: KanbanV2Card,
    updates: Partial<KanbanV2Card>,
    actor: KanbanGovernanceActor = {},
  ) {
    const governedUpdates = normalizeDepartmentTransition(currentCard, updates);
    const updated = await kanbanV2.updateCard(currentCard.id, governedUpdates);
    const responsibleId = assignedUserId(updated.assigned_to);
    const eventType: KanbanCardEventType = assignmentChanged(currentCard, updated) ? 'assigned' : 'updated';

    await bestEffortAuditFields({
      cardId: updated.id,
      actorUserId: actor.userId,
      assignedUserId: responsibleId,
    });
    await appendEvent({
      cardId: updated.id,
      actorUserId: actor.userId,
      eventType,
      fromValue: compactCardSnapshot(currentCard),
      toValue: compactCardSnapshot(updated),
      metadata: currentCard.departamento !== updated.departamento
        ? {
            department_changed: true,
            from_department: currentCard.departamento,
            to_department: updated.departamento,
            from_board_id: currentCard.board_id,
            to_board_id: updated.board_id,
          }
        : {},
    });

    return {
      ...updated,
      assigned_user_id: responsibleId,
      updated_by_user_id: actor.userId || null,
    } as KanbanV2Card;
  },

  async moveCard(
    currentCard: KanbanV2Card,
    targetColumnId: string,
    actor: KanbanGovernanceActor = {},
  ) {
    const moved = await kanbanV2.moveCard(KANBAN_TENANT_ID, currentCard.id, targetColumnId);
    const wasDone = Boolean(currentCard.completed_at);
    const isDone = Boolean(moved.completed_at);
    const eventType: KanbanCardEventType = !wasDone && isDone
      ? 'completed'
      : wasDone && !isDone
        ? 'reopened'
        : 'moved';

    await bestEffortAuditFields({ cardId: moved.id, actorUserId: actor.userId });
    await appendEvent({
      cardId: moved.id,
      actorUserId: actor.userId,
      eventType,
      fromValue: { column_id: currentCard.column_id, completed_at: currentCard.completed_at },
      toValue: { column_id: moved.column_id, completed_at: moved.completed_at },
    });

    return { ...moved, updated_by_user_id: actor.userId || null } as KanbanV2Card;
  },

  /**
   * Exclusão lógica: usa a coluna is_archived que já existe no fluxo estável.
   * deleted_at/deleted_by_user_id e a trilha de eventos são preenchidos em modo
   * best-effort quando a migration de auditoria já estiver aplicada.
   */
  async softDeleteCard(currentCard: KanbanV2Card, actor: KanbanGovernanceActor = {}) {
    const archived = await kanbanV2.updateCard(currentCard.id, { is_archived: true });
    const deletedAt = new Date().toISOString();

    await bestEffortAuditFields({
      cardId: archived.id,
      actorUserId: actor.userId,
      deleted: true,
    });
    await appendEvent({
      cardId: archived.id,
      actorUserId: actor.userId,
      eventType: 'deleted',
      fromValue: compactCardSnapshot(currentCard),
      toValue: { ...compactCardSnapshot(archived), deleted_at: deletedAt },
    });

    return {
      ...archived,
      is_archived: true,
      deleted_at: deletedAt,
      deleted_by_user_id: actor.userId || null,
      updated_by_user_id: actor.userId || null,
    } as KanbanV2Card;
  },

  async restoreCard(currentCard: KanbanV2Card, actor: KanbanGovernanceActor = {}) {
    const restored = await kanbanV2.updateCard(currentCard.id, { is_archived: false });

    await bestEffortAuditFields({
      cardId: restored.id,
      actorUserId: actor.userId,
      restored: true,
    });
    await appendEvent({
      cardId: restored.id,
      actorUserId: actor.userId,
      eventType: 'restored',
      fromValue: compactCardSnapshot(currentCard),
      toValue: compactCardSnapshot(restored),
    });

    return {
      ...restored,
      is_archived: false,
      deleted_at: null,
      deleted_by_user_id: null,
      updated_by_user_id: actor.userId || null,
    } as KanbanV2Card;
  },

  async fetchArchivedCards(): Promise<KanbanAuditReadResult<KanbanV2Card>> {
    try {
      const { data, error } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('hotel_id', KANBAN_TENANT_ID)
        .eq('is_archived', true)
        .order('updated_at', { ascending: false });

      if (error) {
        return { available: false, data: [], message: error.message };
      }

      return {
        available: true,
        data: Array.isArray(data) ? data.map(normalizeGovernedCard) : [],
      };
    } catch (error: any) {
      return {
        available: false,
        data: [],
        message: String(error?.message || error || 'Não foi possível carregar cards arquivados.'),
      };
    }
  },

  async fetchAuditEvents(limit = 50): Promise<KanbanAuditReadResult<KanbanCardAuditEvent>> {
    try {
      const safeLimit = Math.min(Math.max(Math.trunc(limit) || 50, 1), 200);
      const { data, error } = await supabase
        .from('kanban_card_events')
        .select('*')
        .eq('hotel_id', KANBAN_TENANT_ID)
        .order('created_at', { ascending: false })
        .limit(safeLimit);

      if (error) {
        return {
          available: false,
          data: [],
          message: 'Histórico detalhado aguardando a migration de auditoria no Supabase.',
        };
      }

      const events = Array.isArray(data)
        ? data.map((row: any) => ({
            id: String(row.id),
            hotel_id: String(row.hotel_id || KANBAN_TENANT_ID),
            card_id: String(row.card_id || ''),
            user_id: row.user_id ? String(row.user_id) : null,
            event_type: row.event_type as KanbanCardEventType,
            from_value: row.from_value && typeof row.from_value === 'object' ? row.from_value : null,
            to_value: row.to_value && typeof row.to_value === 'object' ? row.to_value : null,
            metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
            created_at: String(row.created_at || ''),
          }))
        : [];

      return { available: true, data: events };
    } catch {
      return {
        available: false,
        data: [],
        message: 'Histórico detalhado aguardando a migration de auditoria no Supabase.',
      };
    }
  },
};
