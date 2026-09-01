import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const maintenance = readFileSync('src/workspace-engine/widgets/MaintenanceWidget.tsx', 'utf8');
const kanban = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');

const forbiddenParallelSources = [
  /from ['\"]@?\/?[^'\"]*supabase[^'\"]*['\"]/i,
  /from ['\"][^'\"]*\/(repositories|services)\/[^'\"]*['\"]/i,
];

test('Manutenção continua usando o board e o renderer Kanban oficiais', () => {
  assert.match(maintenance, /kanban-board-manutencao/);
  assert.match(maintenance, /TaskKanbanWidget/);
  assert.match(maintenance, /dataSource: 'kanban'/);
});

test('Kanban de Manutenção mantém realtime e governança de ações existentes', () => {
  assert.match(kanban, /kanbanV2\.load/);
  assert.match(kanban, /subscribeKanbanRealtime/);
  assert.match(kanban, /kanbanCardGovernance\.moveCard/);
  assert.match(kanban, /kanbanCardGovernance\.updateCard/);
  assert.match(kanban, /kanbanCardGovernance\.softDeleteCard/);
  assert.match(kanban, /canPerformKanbanAction/);
});

test('ações críticas continuam condicionadas às permissões existentes', () => {
  assert.match(kanban, /widget\.permissions\?\.edit !== false/);
  assert.match(kanban, /widget\.permissions\?\.move !== false/);
  assert.match(kanban, /widget\.permissions\?\.assign !== false/);
  assert.match(kanban, /widget\.permissions\?\.archive !== false/);
  assert.match(kanban, /hasFullKanbanVisibility/);
});

test('certificação de Manutenção não cria fonte paralela no adapter do widget', () => {
  for (const forbidden of forbiddenParallelSources) {
    assert.doesNotMatch(maintenance, forbidden);
  }
});