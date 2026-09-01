import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const automation = readFileSync('src/workspace-engine/widgets/AutomationAdminWidget.tsx', 'utf8');
const commandCenter = readFileSync('src/workspace-engine/widgets/HotelOSCommandCenterWidget.tsx', 'utf8');
const quickActions = readFileSync('src/workspace-engine/widgets/QuickActionsWidget.tsx', 'utf8');

const forbiddenParallelInfrastructure = [
  /create table/i,
  /alter table/i,
  /supabase\/migrations/i,
  /createClient\(/,
  /from\(['"`]/,
];

test('widgets administrativos auxiliares continuam apenas como adaptadores dos módulos existentes', () => {
  assert.match(automation, /import \{ AutomationModule \} from '\.\.\/\.\.\/components\/admin\/AutomationModule'/);
  assert.match(automation, /<AutomationModule \/>/);
  assert.match(commandCenter, /import \{ HotelOSCommandCenter \} from '\.\.\/\.\.\/components\/admin\/HotelOSCommandCenter'/);
  assert.match(commandCenter, /<HotelOSCommandCenter \/>/);
});

test('ações rápidas reutilizam somente widgets existentes e autorizados da composição', () => {
  assert.match(quickActions, /candidate\.enabled !== false/);
  assert.match(quickActions, /candidate\.permissions\?\.view !== false/);
  assert.match(quickActions, /widget\.actions\?\.\[action\.type\] === false/);
  assert.match(quickActions, /catalog\?\.readiness === 'planned'/);
  assert.match(quickActions, /workspace\.widgets\.find/);
});

test('ações rápidas abrem o runtime existente sem criar execução paralela', () => {
  assert.match(quickActions, /button\[aria-haspopup="dialog"\]/);
  assert.match(quickActions, /dialogButton\.click\(\)/);
  assert.match(quickActions, /scrollIntoView/);
});

test('certificação dos widgets auxiliares não introduz infraestrutura ou fonte de dados paralela', () => {
  for (const forbidden of forbiddenParallelInfrastructure) {
    assert.doesNotMatch(automation, forbidden);
    assert.doesNotMatch(commandCenter, forbidden);
    assert.doesNotMatch(quickActions, forbidden);
  }
});
