import { KanbanV2Card } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';

export type GovernancaDemandSector = 'governanca' | 'recepcao' | 'manutencao' | 'cozinha' | 'operacao';

export const GOVERNANCA_DEMAND_TARGETS: Record<GovernancaDemandSector, { label: string; boardId: string; columnId: string }> = {
  governanca: { label: 'Governança', boardId: 'kanban-board-governanca', columnId: 'gov-col-a-limpar' },
  recepcao: { label: 'Recepção', boardId: 'kanban-board-recepcao', columnId: 'rec-col-novos' },
  manutencao: { label: 'Manutenção', boardId: 'kanban-board-manutencao', columnId: 'man-col-chamados' },
  cozinha: { label: 'Cozinha & Room Service', boardId: 'kanban-board-cozinha', columnId: 'coz-col-pedidos' },
  operacao: { label: 'Operação Geral', boardId: 'kanban-default-board', columnId: 'kanban-default-column-entrada' },
};

export interface CreateGovernancaDemandInput {
  sector: GovernancaDemandSector;
  title: string;
  description?: string;
  priority?: string;
  roomNumber?: string;
  sourceCard?: KanbanV2Card | null;
  actorUserId?: string | null;
}

export async function createGovernancaDemand(input: CreateGovernancaDemandInput) {
  const target = GOVERNANCA_DEMAND_TARGETS[input.sector];
  const source = input.sourceCard;
  const sourceNote = source
    ? `Demanda derivada do card ${source.id} — ${source.titulo}${source.room_number ? ` — Quarto ${source.room_number}` : ''}.`
    : undefined;

  return kanbanCardGovernance.createCard({
    boardId: target.boardId,
    columnId: target.columnId,
    titulo: input.title.trim(),
    descricao: input.description?.trim() || undefined,
    prioridade: input.priority || source?.prioridade || 'normal',
    departamento: input.sector,
    room_number: input.roomNumber?.trim() || source?.room_number || undefined,
    location: input.roomNumber || source?.room_number ? `Quarto ${input.roomNumber || source?.room_number}` : 'Geral',
    assigned_to: null,
    notes: sourceNote,
    metadata: {
      ...(source ? {
        source_card_id: source.id,
        source_board_id: source.board_id,
        source_sector: source.departamento || 'governanca',
        relation_type: 'derived_demand',
      } : {}),
      requested_from_sector: 'governanca',
      target_sector: input.sector,
    },
  }, { userId: input.actorUserId });
}
