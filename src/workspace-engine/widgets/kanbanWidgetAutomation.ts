import { KanbanV2Card, kanbanV2, KANBAN_TENANT_ID } from '../../services/kanbanV2';
import { kanbanCardGovernance } from '../../services/kanbanCardGovernanceService';
import { WorkspaceWidgetDefinition } from '../types';
import { WORKSPACE_BOARD_OPTIONS } from '../workspaceFactory';

export type KanbanAutomationEvent = 'card_created';
export type KanbanAutomationAction = 'create_card';

export interface KanbanAutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  event: KanbanAutomationEvent;
  condition: {
    field: string;
    operator: 'equals';
    value: string;
  };
  action: {
    type: KanbanAutomationAction;
    targetBoardId: string;
  };
}

export interface KanbanWidgetAutomationSettings {
  version: 1;
  rules: KanbanAutomationRule[];
}

export interface KanbanAutomationRelation {
  version: 1;
  relationId: string;
  sourceWidgetId: string;
  sourceBoardId: string;
  sourceCardId: string;
  ruleId: string;
  targetBoardId: string;
}

export interface KanbanAutomationExecutionResult {
  ruleId: string;
  ruleName: string;
  status: 'created' | 'skipped' | 'error';
  message: string;
  targetCardId?: string;
  relationId?: string;
}

const emptySettings: KanbanWidgetAutomationSettings = { version: 1, rules: [] };
const AUTOMATION_NOTE_PREFIX = '[workspace-kanban-automation:v1]';
const processingKeys = new Set<string>();

export const readKanbanAutomationSettings = (widget: WorkspaceWidgetDefinition): KanbanWidgetAutomationSettings => {
  const raw = widget.settings?.kanbanAutomation;
  if (!raw || typeof raw !== 'object') return emptySettings;
  const candidate = raw as Partial<KanbanWidgetAutomationSettings>;
  return {
    version: 1,
    rules: Array.isArray(candidate.rules) ? candidate.rules : [],
  };
};

const normalized = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('pt-BR');

const readCardField = (card: KanbanV2Card, field: string): unknown => {
  const key = field.trim();
  if (!key) return undefined;
  if (key === 'category' || key === 'categoria' || key === 'sector' || key === 'setor') return card.departamento;
  if (key.startsWith('metadata.')) return card.metadata?.[key.slice('metadata.'.length)];
  return (card as unknown as Record<string, unknown>)[key];
};

export const kanbanAutomationRuleMatches = (rule: KanbanAutomationRule, card: KanbanV2Card): boolean => {
  if (!rule.enabled || rule.event !== 'card_created' || rule.condition.operator !== 'equals') return false;
  const expected = normalized(rule.condition.value);
  if (!expected) return false;
  return normalized(readCardField(card, rule.condition.field)) === expected;
};

const relationIdFor = (sourceCardId: string, ruleId: string, targetBoardId: string) =>
  `${sourceCardId}:${ruleId}:${targetBoardId}`;

const relationNote = (relation: KanbanAutomationRelation) =>
  `${AUTOMATION_NOTE_PREFIX} relation=${relation.relationId} sourceWidget=${relation.sourceWidgetId} sourceBoard=${relation.sourceBoardId} sourceCard=${relation.sourceCardId} rule=${relation.ruleId} targetBoard=${relation.targetBoardId}`;

export const readKanbanAutomationRelation = (card: KanbanV2Card): KanbanAutomationRelation | null => {
  const firstLine = typeof card.notes === 'string' ? card.notes.split('\n')[0] : '';
  if (!firstLine.startsWith(AUTOMATION_NOTE_PREFIX)) return null;
  const values = Object.fromEntries(firstLine.split(' ').slice(1).map(part => {
    const separator = part.indexOf('=');
    return separator > 0 ? [part.slice(0, separator), part.slice(separator + 1)] : [part, ''];
  }));
  if (!values.relation || !values.sourceWidget || !values.sourceBoard || !values.sourceCard || !values.rule || !values.targetBoard) return null;
  return {
    version: 1,
    relationId: values.relation,
    sourceWidgetId: values.sourceWidget,
    sourceBoardId: values.sourceBoard,
    sourceCardId: values.sourceCard,
    ruleId: values.rule,
    targetBoardId: values.targetBoard,
  };
};

const isAutomationGeneratedCard = (card: KanbanV2Card) => readKanbanAutomationRelation(card) !== null;

export async function executeKanbanWidgetCardCreatedAutomations(input: {
  widget: WorkspaceWidgetDefinition;
  card: KanbanV2Card;
  userId?: string | null;
}): Promise<KanbanAutomationExecutionResult[]> {
  const { widget, card, userId } = input;
  if (widget.type !== 'task-kanban' || card.board_id !== widget.boardId || isAutomationGeneratedCard(card)) return [];

  const settings = readKanbanAutomationSettings(widget);
  const matchingRules = settings.rules.filter(rule => kanbanAutomationRuleMatches(rule, card));
  if (matchingRules.length === 0) return [];

  const store = await kanbanV2.load(KANBAN_TENANT_ID);
  const results: KanbanAutomationExecutionResult[] = [];

  for (const rule of matchingRules) {
    const targetBoardId = rule.action.targetBoardId;
    if (rule.action.type !== 'create_card' || !targetBoardId || targetBoardId === card.board_id) {
      results.push({ ruleId: rule.id, ruleName: rule.name, status: 'skipped', message: 'Regra ignorada por destino inválido.' });
      continue;
    }

    const relation: KanbanAutomationRelation = {
      version: 1,
      relationId: relationIdFor(card.id, rule.id, targetBoardId),
      sourceWidgetId: widget.id,
      sourceBoardId: card.board_id,
      sourceCardId: card.id,
      ruleId: rule.id,
      targetBoardId,
    };
    const processKey = relation.relationId;
    if (processingKeys.has(processKey)) {
      results.push({ ruleId: rule.id, ruleName: rule.name, status: 'skipped', message: 'Esta execução já está em processamento.', relationId: relation.relationId });
      continue;
    }

    const existing = store.cards.find(item => readKanbanAutomationRelation(item)?.relationId === relation.relationId);
    if (existing) {
      results.push({ ruleId: rule.id, ruleName: rule.name, status: 'skipped', message: 'Card relacionado já existe no Kanban de destino.', targetCardId: existing.id, relationId: relation.relationId });
      continue;
    }

    const targetColumn = store.columns
      .filter(column => column.board_id === targetBoardId)
      .sort((a, b) => a.ordem - b.ordem)[0];
    if (!targetColumn) {
      results.push({ ruleId: rule.id, ruleName: rule.name, status: 'error', message: 'Kanban de destino não possui coluna inicial configurada.', relationId: relation.relationId });
      continue;
    }

    processingKeys.add(processKey);
    try {
      const targetBoard = WORKSPACE_BOARD_OPTIONS.find(board => board.id === targetBoardId);
      const created = await kanbanCardGovernance.createCard({
        boardId: targetBoardId,
        columnId: targetColumn.id,
        titulo: card.titulo,
        descricao: card.descricao || undefined,
        prioridade: card.prioridade,
        departamento: targetBoard?.sector || card.departamento || undefined,
        room_number: card.room_number || undefined,
        location: card.location || undefined,
        guest_name: card.guest_name || undefined,
        notes: `${relationNote(relation)}\nOrigem: ${card.board_id} / ${card.id}`,
      }, { userId });
      store.cards.push(created);
      results.push({ ruleId: rule.id, ruleName: rule.name, status: 'created', message: `Card criado em ${targetBoard?.label || targetBoardId}.`, targetCardId: created.id, relationId: relation.relationId });
    } catch (error: any) {
      results.push({ ruleId: rule.id, ruleName: rule.name, status: 'error', message: error?.message || 'Não foi possível executar a automação.', relationId: relation.relationId });
    } finally {
      processingKeys.delete(processKey);
    }
  }

  return results;
}
