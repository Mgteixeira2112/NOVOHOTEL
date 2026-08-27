import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canCreateKanbanCardInSector,
  canPerformKanbanAction,
  canViewKanbanCard,
  defaultKanbanCapabilities,
  defaultKanbanVisibilityScope,
  filterKanbanCardsForUser,
  resolveCardAssignedUserId,
} from '../src/domain/kanbanAccess';

const cards = [
  { id: '1', departamento: 'manutencao', assigned_user_id: 'joao', is_archived: false },
  { id: '2', departamento: 'manutencao', assigned_user_id: 'carlos', is_archived: false },
  { id: '3', departamento: 'governanca', assigned_user_id: 'joao', is_archived: false },
  { id: '4', departamento: 'recepcao', assigned_user_id: null, is_archived: false },
  { id: '5', departamento: 'manutencao', assigned_user_id: 'joao', is_archived: true },
  { id: '6', departamento: 'manutencao', assigned_user_id: 'joao', is_archived: false, deleted_at: '2026-08-27T00:00:00Z' },
];

test('admin e gerente começam com escopo total', () => {
  assert.equal(defaultKanbanVisibilityScope('admin'), 'all');
  assert.equal(defaultKanbanVisibilityScope('gerente'), 'all');
  assert.equal(defaultKanbanVisibilityScope('governanca'), 'sector_or_assigned');
});

test('operacional vê cards do setor e cards atribuídos diretamente', () => {
  const visible = filterKanbanCardsForUser(cards, {
    userId: 'joao',
    role: 'recepcionista',
    sectorIds: ['manutencao'],
    scope: 'sector_or_assigned',
  });

  assert.deepEqual(visible.map(card => card.id), ['1', '2', '3']);
});

test('escopo assigned limita a fila ao próprio usuário', () => {
  assert.equal(canViewKanbanCard(
    { userId: 'joao', role: 'governanca', sectorIds: ['governanca'], scope: 'assigned' },
    cards[0],
  ), true);
  assert.equal(canViewKanbanCard(
    { userId: 'joao', role: 'governanca', sectorIds: ['governanca'], scope: 'assigned' },
    cards[1],
  ), false);
});

test('compatibilidade lê responsável do assigned_to legado', () => {
  assert.equal(resolveCardAssignedUserId({ id: 'legacy', assigned_to: { id: 'maria', name: 'Maria' } }), 'maria');
});

test('cards arquivados ou excluídos logicamente nunca entram na visão ativa', () => {
  const context = { userId: 'joao', role: 'admin', sectorIds: [], scope: 'all' as const };
  assert.equal(canViewKanbanCard(context, cards[4]), false);
  assert.equal(canViewKanbanCard(context, cards[5]), false);
});

test('capacidades padrão separam operação de gestão', () => {
  assert.deepEqual(defaultKanbanCapabilities('gerente'), {
    view: true, create: true, edit: true, move: true, assign: true, delete: true,
  });
  assert.deepEqual(defaultKanbanCapabilities('governanca'), {
    view: true, create: true, edit: true, move: true, assign: false, delete: false,
  });
  assert.equal(defaultKanbanCapabilities('financeiro').view, false);
});

test('operacional pode editar e mover apenas cards visíveis, sem atribuir ou excluir', () => {
  const context = {
    userId: 'joao',
    role: 'governanca',
    sectorIds: ['governanca'] as const,
    scope: 'sector_or_assigned' as const,
  };

  assert.equal(canPerformKanbanAction(context, 'edit', cards[2]), true);
  assert.equal(canPerformKanbanAction(context, 'move', cards[2]), true);
  assert.equal(canPerformKanbanAction(context, 'edit', cards[3]), false);
  assert.equal(canPerformKanbanAction(context, 'assign', cards[2]), false);
  assert.equal(canPerformKanbanAction(context, 'delete', cards[2]), false);
});

test('admin e gerente podem atribuir e excluir cards ativos', () => {
  const admin = { userId: 'admin-1', role: 'admin', sectorIds: [], scope: 'all' as const };
  const gerente = { userId: 'ger-1', role: 'gerente', sectorIds: [], scope: 'all' as const };

  assert.equal(canPerformKanbanAction(admin, 'assign', cards[0]), true);
  assert.equal(canPerformKanbanAction(admin, 'delete', cards[0]), true);
  assert.equal(canPerformKanbanAction(gerente, 'assign', cards[0]), true);
  assert.equal(canPerformKanbanAction(gerente, 'delete', cards[0]), true);
  assert.equal(canPerformKanbanAction(admin, 'edit', cards[4]), false);
});

test('criação operacional respeita setores quando configurados e preserva fallback legado sem setores', () => {
  const configured = {
    userId: 'joao',
    role: 'recepcionista',
    sectorIds: ['recepcao'] as const,
    scope: 'sector_or_assigned' as const,
  };
  const fallback = { ...configured, sectorIds: [] };

  assert.equal(canCreateKanbanCardInSector(configured, 'recepcao'), true);
  assert.equal(canCreateKanbanCardInSector(configured, 'governanca'), false);
  assert.equal(canCreateKanbanCardInSector(fallback, 'governanca'), true);
});
