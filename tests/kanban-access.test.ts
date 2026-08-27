import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
