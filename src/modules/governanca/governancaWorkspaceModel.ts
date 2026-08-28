import { KanbanV2Card } from '../../services/kanbanV2';

export const GOVERNANCA_STAGES = {
  pending: 'gov-col-a-limpar',
  working: 'gov-col-em-limpeza',
  inspection: 'gov-col-inspecao',
  done: 'gov-col-liberado',
} as const;

export type GovernancaStageFilter = 'all' | keyof typeof GOVERNANCA_STAGES;

export interface GovernancaWorkspaceAlert {
  id: 'priority' | 'inspection' | 'unassigned';
  label: string;
  description: string;
  count: number;
  stage?: GovernancaStageFilter;
}

export const getGovernancaAssignedUserId = (card: KanbanV2Card) =>
  (card as any).assigned_user_id || (card.assigned_to as any)?.id || '';

export const getGovernancaAssignedName = (card: KanbanV2Card) =>
  (card.assigned_to as any)?.name || '';

export const buildGovernancaWorkspaceAlerts = (cards: KanbanV2Card[]): GovernancaWorkspaceAlert[] => {
  const operational = cards.filter(card => !card.is_archived && card.column_id !== GOVERNANCA_STAGES.done);
  return [
    {
      id: 'priority',
      label: 'Prioridade alta',
      description: 'Tarefas que merecem atenção imediata.',
      count: operational.filter(card => card.prioridade === 'alta' || card.prioridade === 'urgente').length,
    },
    {
      id: 'inspection',
      label: 'Aguardando inspeção',
      description: 'Quartos esperando conferência antes da liberação.',
      count: operational.filter(card => card.column_id === GOVERNANCA_STAGES.inspection).length,
      stage: 'inspection',
    },
    {
      id: 'unassigned',
      label: 'Sem responsável',
      description: 'Tarefas do setor que ainda precisam ser assumidas.',
      count: operational.filter(card => !getGovernancaAssignedUserId(card)).length,
    },
  ];
};
