import type { KanbanV2Card } from '../services/kanbanV2';

export type KanbanTaskContextType = 'hotel' | 'room' | 'sector' | 'role' | 'user' | 'user_room';

export interface KanbanTaskContext {
  type: KanbanTaskContextType;
  roomId: string | null;
  roomNumber: string | null;
  targetUserId: string | null;
  targetSector: string | null;
  targetRole: string | null;
  assignedUserId: string | null;
}

const text = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value.trim() : null;

export function inferKanbanTaskContext(card: KanbanV2Card): KanbanTaskContext {
  const row = card as KanbanV2Card & Record<string, unknown>;
  const metadata = card.metadata && typeof card.metadata === 'object' ? card.metadata as Record<string, unknown> : {};
  const assigned = text(row.assigned_user_id) || text((card.assigned_to as Record<string, unknown> | null)?.id);
  const roomId = text(row.room_id) || text(metadata.room_id);
  const roomNumber = text(card.room_number);
  const targetUserId = text(row.target_user_id) || text(metadata.target_user_id);
  const targetSector = text(row.target_sector) || text(metadata.target_sector) || text(card.departamento);
  const targetRole = text(row.target_role) || text(metadata.target_role);
  const explicit = text(row.task_context_type) || text(metadata.task_context_type);
  const hasRoom = Boolean(roomId || roomNumber);
  const userTarget = targetUserId || assigned;

  let type: KanbanTaskContextType;
  if (explicit && ['hotel', 'room', 'sector', 'role', 'user', 'user_room'].includes(explicit)) {
    type = explicit as KanbanTaskContextType;
  } else if (hasRoom && userTarget) {
    type = 'user_room';
  } else if (hasRoom) {
    type = 'room';
  } else if (targetUserId) {
    type = 'user';
  } else if (targetRole) {
    type = 'role';
  } else if (targetSector) {
    type = 'sector';
  } else {
    type = 'hotel';
  }

  return { type, roomId, roomNumber, targetUserId, targetSector, targetRole, assignedUserId: assigned };
}

export const taskContextHasRoom = (context: KanbanTaskContext) => context.type === 'room' || context.type === 'user_room';

export const taskContextLabel = (context: KanbanTaskContext): string => {
  switch (context.type) {
    case 'room': return `Quarto${context.roomNumber ? ` ${context.roomNumber}` : ''}`;
    case 'user_room': return `Usuário + quarto${context.roomNumber ? ` ${context.roomNumber}` : ''}`;
    case 'user': return 'Usuário';
    case 'role': return `Cargo${context.targetRole ? ` · ${context.targetRole}` : ''}`;
    case 'sector': return `Setor${context.targetSector ? ` · ${context.targetSector}` : ''}`;
    default: return 'Hotel';
  }
};
