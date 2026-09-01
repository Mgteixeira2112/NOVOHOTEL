import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const widget = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');
const access = readFileSync('src/domain/kanbanAccess.ts', 'utf8');
const governance = readFileSync('src/services/kanbanCardGovernanceService.ts', 'utf8');

const forbiddenNewInfrastructure = [
  /create table/i,
  /alter table/i,
  /supabase\/migrations/i,
];

test('Kanban continua usando runtime, realtime e governança oficiais', () => {
  assert.match(widget, /kanbanV2\.load\(KANBAN_TENANT_ID\)/);
  assert.match(widget, /subscribeKanbanRealtime\(KANBAN_TENANT_ID/);
  assert.match(widget, /kanbanCardGovernance\.moveCard/);
  assert.match(widget, /kanbanCardGovernance\.updateCard/);
  assert.match(widget, /kanbanCardGovernance\.softDeleteCard/);
});

test('ações do Kanban continuam condicionadas ao contrato de acesso e permissões do widget', () => {
  assert.match(widget, /canPerformKanbanAction\(actionAccessContext, 'edit', card\)/);
  assert.match(widget, /canPerformKanbanAction\(actionAccessContext, 'move', card\)/);
  assert.match(widget, /canPerformKanbanAction\(actionAccessContext, 'assign', card\)/);
  assert.match(widget, /widget\.permissions\?\.delete !== false/);
  assert.match(access, /defaultKanbanVisibilityScope/);
  assert.match(access, /canViewKanbanCard/);
  assert.match(access, /canCreateKanbanCardInSector/);
});

test('governança mantém boards operacionais e arquivamento existentes', () => {
  assert.match(governance, /kanban-board-governanca/);
  assert.match(governance, /kanban-board-recepcao/);
  assert.match(governance, /kanban-board-manutencao/);
  assert.match(governance, /kanban-board-cozinha/);
  assert.match(governance, /is_archived: true/);
  assert.match(governance, /restoreCard/);
});

test('certificação Kanban não introduz infraestrutura paralela', () => {
  for (const forbidden of forbiddenNewInfrastructure) {
    assert.doesNotMatch(widget, forbidden);
    assert.doesNotMatch(access, forbidden);
    assert.doesNotMatch(governance, forbidden);
  }
});
