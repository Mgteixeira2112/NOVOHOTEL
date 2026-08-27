import { OperationalSectorId, isOperationalSectorId } from './operationalSectors';

export type KanbanVisibilityScope = 'all' | 'sector' | 'assigned' | 'sector_or_assigned';
export type KanbanAction = 'view' | 'create' | 'edit' | 'move' | 'assign' | 'delete';

export interface KanbanAccessContext {
  userId: string;
  role: string;
  sectorIds: OperationalSectorId[];
  scope: KanbanVisibilityScope;
}

export interface KanbanAccessCard {
  id: string;
  departamento?: string | null;
  assigned_user_id?: string | null;
  assigned_to?: Record<string, unknown> | null;
  is_archived?: boolean;
  deleted_at?: string | null;
}

export interface KanbanCapabilities {
  view: boolean;
  create: boolean;
  edit: boolean;
  move: boolean;
  assign: boolean;
  delete: boolean;
}

export function resolveCardAssignedUserId(card: KanbanAccessCard): string | null {
  if (card.assigned_user_id) return String(card.assigned_user_id);
  const legacyId = card.assigned_to?.id;
  return typeof legacyId === 'string' && legacyId ? legacyId : null;
}

export function resolveCardOperationalSector(card: KanbanAccessCard): OperationalSectorId | null {
  return isOperationalSectorId(card.departamento) ? card.departamento : null;
}

export function defaultKanbanVisibilityScope(role: string): KanbanVisibilityScope {
  if (role === 'admin' || role === 'gerente') return 'all';
  return 'sector_or_assigned';
}

export function defaultKanbanCapabilities(role: string): KanbanCapabilities {
  if (role === 'admin' || role === 'gerente') {
    return { view: true, create: true, edit: true, move: true, assign: true, delete: true };
  }

  if (role === 'recepcionista' || role === 'governanca' || role === 'cozinha_only') {
    return { view: true, create: true, edit: true, move: true, assign: false, delete: false };
  }

  return { view: false, create: false, edit: false, move: false, assign: false, delete: false };
}

export function canViewKanbanCard(context: KanbanAccessContext, card: KanbanAccessCard): boolean {
  if (card.is_archived || card.deleted_at) return false;
  if (!context.userId) return false;

  const assignedUserId = resolveCardAssignedUserId(card);
  const cardSector = resolveCardOperationalSector(card);
  const isAssigned = assignedUserId === context.userId;
  const isInSector = cardSector !== null && context.sectorIds.includes(cardSector);

  switch (context.scope) {
    case 'all':
      return true;
    case 'sector':
      return isInSector;
    case 'assigned':
      return isAssigned;
    case 'sector_or_assigned':
      return isInSector || isAssigned;
    default:
      return false;
  }
}

export function filterKanbanCardsForUser<T extends KanbanAccessCard>(
  cards: T[],
  context: KanbanAccessContext,
): T[] {
  return cards.filter(card => canViewKanbanCard(context, card));
}

/**
 * Permissão efetiva de uma ação sobre um card.
 *
 * - admin/gerente possuem controle integral;
 * - perfis operacionais podem editar/mover apenas cards que já podem visualizar;
 * - atribuição de outro responsável e exclusão ficam reservadas à gestão;
 * - cards arquivados/excluídos nunca podem ser alterados pelo fluxo operacional ativo.
 */
export function canPerformKanbanAction(
  context: KanbanAccessContext,
  action: KanbanAction,
  card?: KanbanAccessCard | null,
): boolean {
  const capabilities = defaultKanbanCapabilities(context.role);
  if (!capabilities[action]) return false;

  if (action === 'create') return Boolean(context.userId);
  if (!card) return false;

  if (action === 'view') return canViewKanbanCard(context, card);
  if (card.is_archived || card.deleted_at) return false;

  if (context.role === 'admin' || context.role === 'gerente') return true;

  // A operação só modifica cards que já fazem parte da sua fila autorizada.
  return canViewKanbanCard(context, card);
}

/**
 * Restringe a criação a setores vinculados ao usuário quando a configuração
 * setorial estiver disponível. Um array vazio preserva o comportamento legado
 * de fallback até a associação de setores estar pronta no banco.
 */
export function canCreateKanbanCardInSector(
  context: KanbanAccessContext,
  sector: string | null | undefined,
): boolean {
  if (!canPerformKanbanAction(context, 'create')) return false;
  if (context.role === 'admin' || context.role === 'gerente') return true;
  if (context.sectorIds.length === 0) return true;
  return isOperationalSectorId(sector) && context.sectorIds.includes(sector);
}
