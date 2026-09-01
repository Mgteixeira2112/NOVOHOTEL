import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const automation = readFileSync('src/workspace-engine/widgets/AutomationAdminWidget.tsx', 'utf8');
const commandCenter = readFileSync('src/workspace-engine/widgets/HotelOSCommandCenterWidget.tsx', 'utf8');
const quickActions = readFileSync('src/workspace-engine/widgets/QuickActionsWidget.tsx', 'utf8');
const dashboard = readFileSync('src/workspace-engine/widgets/DashboardWidget.tsx', 'utf8');
const frigobar = readFileSync('src/workspace-engine/widgets/FrigobarWidget.tsx', 'utf8');
const team = readFileSync('src/workspace-engine/widgets/TeamWidget.tsx', 'utf8');
const userAccess = readFileSync('src/workspace-engine/widgets/UserAccessWidget.tsx', 'utf8');

const forbiddenParallelInfrastructure = [
  /create table/i,
  /alter table/i,
  /supabase\/migrations/i,
  /createClient\(/,
];

test('widgets administrativos auxiliares continuam apenas como adaptadores dos módulos existentes', () => {
  assert.match(automation, /import \{ AutomationModule \} from '\.\.\/\.\.\/components\/admin\/AutomationModule'/);
  assert.match(automation, /<AutomationModule \/>/);
  assert.match(commandCenter, /import \{ HotelOSCommandCenter \} from '\.\.\/\.\.\/components\/admin\/HotelOSCommandCenter'/);
  assert.match(commandCenter, /<HotelOSCommandCenter \/>/);
  assert.match(userAccess, /UsersOperationalAccessModule/);
  assert.match(userAccess, /Presentation adapter only/);
});

test('dashboard continua usando Dashboard Engine e identidade autorizada existentes', () => {
  assert.match(dashboard, /dashboardEngine/);
  assert.match(dashboard, /tenantService/);
  assert.match(dashboard, /getOperationalDateRange/);
  assert.match(dashboard, /widget\.permissions\?\.edit !== false/);
  assert.match(dashboard, /Dashboard Engine · fonte oficial Supabase/);
});

test('frigobar continua usando Frigobar Core e somente hospedagens ativas', () => {
  assert.match(frigobar, /frigobarCore/);
  assert.match(frigobar, /hotelIdentityService/);
  assert.match(frigobar, /item\.status === 'checkin_realizado'/);
  assert.match(frigobar, /frigobarCore\.registerConsumption/);
  assert.match(frigobar, /frigobarCore\.restock/);
  assert.match(frigobar, /widget\.actions\?\.consumeMinibar !== false/);
  assert.match(frigobar, /widget\.actions\?\.restockMinibar !== false/);
});

test('equipe continua derivada dos usuários ativos e vínculos setoriais existentes', () => {
  assert.match(team, /const \{ users \} = useHotel\(\)/);
  assert.match(team, /user\.ativo !== false/);
  assert.match(team, /fetchUserOperationalSectorsState/);
  assert.match(team, /workspace\.sectors\.length/);
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

test('certificação dos widgets auxiliares não introduz infraestrutura paralela', () => {
  for (const source of [automation, commandCenter, quickActions, dashboard, frigobar, team, userAccess]) {
    for (const forbidden of forbiddenParallelInfrastructure) assert.doesNotMatch(source, forbidden);
  }
});
