import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtimeSource = readFileSync('src/workspace-engine/widgets/kanbanWidgetAutomation.ts', 'utf8');
const widgetSource = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');
const editorSource = readFileSync('src/components/admin/KanbanWidgetAutomationEditor.tsx', 'utf8');
const realtimeSource = readFileSync('src/services/kanbanRealtimeSubscription.ts', 'utf8');

test('widget kanban conecta card_created ao orquestrador sem alterar o motor base', () => {
  assert.match(widgetSource, /onInsert: card =>/);
  assert.match(widgetSource, /executeKanbanWidgetCardCreatedAutomations\(\{ widget, card, userId: currentUser\?\.id \}\)/);
  assert.match(runtimeSource, /kanbanCardGovernance\.createCard/);
  assert.doesNotMatch(widgetSource, /supabase\.from\(/);
});

test('runtime usa configuracao do proprio widget e bloqueia loops basicos', () => {
  assert.match(runtimeSource, /widget\.settings\?\.kanbanAutomation/);
  assert.match(runtimeSource, /targetBoardId === card\.board_id/);
  assert.match(runtimeSource, /AUTOMATION_NOTE_PREFIX/);
  assert.match(runtimeSource, /isAutomationGeneratedCard\(card\)/);
  assert.match(runtimeSource, /processingKeys\.has\(processKey\)/);
});

test('runtime formaliza relacionamento origem destino e evita duplicacao conhecida', () => {
  assert.match(runtimeSource, /export interface KanbanAutomationRelation/);
  assert.match(runtimeSource, /sourceWidgetId: widget\.id/);
  assert.match(runtimeSource, /sourceBoardId: card\.board_id/);
  assert.match(runtimeSource, /sourceCardId: card\.id/);
  assert.match(runtimeSource, /targetBoardId/);
  assert.match(runtimeSource, /readKanbanAutomationRelation\(item\)\?\.relationId === relation\.relationId/);
});

test('runtime escolhe primeira coluna do board destino', () => {
  assert.match(runtimeSource, /filter\(column => column\.board_id === targetBoardId\)/);
  assert.match(runtimeSource, /sort\(\(a, b\) => a\.ordem - b\.ordem\)\[0\]/);
});

test('editor e runtime compartilham o mesmo contrato de automacao', () => {
  assert.match(editorSource, /KanbanAutomationRule, readKanbanAutomationSettings/);
  assert.match(runtimeSource, /export interface KanbanAutomationRule/);
  assert.doesNotMatch(editorSource, /export interface KanbanAutomationRule/);
});

test('cada widget Kanban usa canal Realtime exclusivo e só confirma após Supabase', () => {
  assert.match(widgetSource, /subscribeKanbanRealtime\(KANBAN_TENANT_ID/);
  assert.match(realtimeSource, /const instanceId = makeInstanceId\(\)/);
  assert.match(realtimeSource, /`kanban-v2-\$\{hotelId\}-\$\{instanceId\}`/);
  assert.match(realtimeSource, /handlers\.onStatus\('CONNECTING'\)/);
  assert.match(realtimeSource, /status === 'SUBSCRIBED'/);
  assert.doesNotMatch(realtimeSource, /handlers\.onStatus\('SUBSCRIBED'\);\s*\n\s*const channel/);
});
