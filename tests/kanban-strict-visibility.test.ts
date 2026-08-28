import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterKanbanCardsForUser } from '../src/domain/kanbanAccess';

const kanbanModule = readFileSync('src/components/admin/KanbanModule.tsx', 'utf8');

test('operacional sem setor vê somente cards atribuídos diretamente', () => {
  const cards = [
    { id: 'assigned', departamento: 'manutencao', assigned_user_id: 'user-1', is_archived: false },
    { id: 'other', departamento: 'manutencao', assigned_user_id: 'user-2', is_archived: false },
    { id: 'unassigned', departamento: 'recepcao', assigned_user_id: null, is_archived: false },
  ];

  const visible = filterKanbanCardsForUser(cards, {
    userId: 'user-1',
    role: 'recepcionista',
    sectorIds: [],
    scope: 'sector_or_assigned',
  });

  assert.deepEqual(visible.map(card => card.id), ['assigned']);
});

test('operacional com setor vê união de setor e responsabilidade direta', () => {
  const cards = [
    { id: 'sector', departamento: 'governanca', assigned_user_id: 'user-2', is_archived: false },
    { id: 'assigned', departamento: 'manutencao', assigned_user_id: 'user-1', is_archived: false },
    { id: 'hidden', departamento: 'recepcao', assigned_user_id: 'user-3', is_archived: false },
  ];

  const visible = filterKanbanCardsForUser(cards, {
    userId: 'user-1',
    role: 'governanca',
    sectorIds: ['governanca'],
    scope: 'sector_or_assigned',
  });

  assert.deepEqual(visible.map(card => card.id), ['sector', 'assigned']);
});

test('interface não libera todos os cards quando setor está vazio ou indisponível', () => {
  assert.ok(kanbanModule.includes("if (hasFullKanbanVisibility) return activeCards;"));
  assert.ok(kanbanModule.includes("if (!currentUser?.id) return [];"));
  assert.ok(kanbanModule.includes("const selectiveVisibilityActive = !hasFullKanbanVisibility && Boolean(currentUser?.id);"));
  assert.ok(kanbanModule.includes('Serão exibidos somente os cards atribuídos diretamente a você.'));
  assert.equal(kanbanModule.includes('A visão completa foi mantida temporariamente'), false);
  assert.equal(kanbanModule.includes('Visão temporária completa'), false);
});
