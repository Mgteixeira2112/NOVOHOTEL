import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogSource = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const registrationSource = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');
const userAccessSource = readFileSync('src/workspace-engine/widgets/UserAccessWidget.tsx', 'utf8');
const automationAdminSource = readFileSync('src/workspace-engine/widgets/AutomationAdminWidget.tsx', 'utf8');

const visibleCatalogSource = catalogSource.slice(
  catalogSource.indexOf('const allWorkspaceWidgetCatalog'),
  catalogSource.indexOf('// Compatibilidade interna'),
);

const catalogEntries = Array.from(
  visibleCatalogSource.matchAll(/\{ type: '([^']+)'[\s\S]*?readiness: '(ready|configurable|planned)'/g),
).map(match => ({ type: match[1], readiness: match[2] }));

const registeredTypes = Array.from(
  registrationSource.matchAll(/registerWorkspaceWidgetRenderer\('([^']+)'/g),
).map(match => match[1]);

const registered = new Set(registeredTypes);

test('todo widget oficial tem maturidade explícita e tipos únicos', () => {
  assert.equal(catalogEntries.length, 21, 'a biblioteca oficial deve manter 21 tipos auditados nesta baseline');
  assert.equal(new Set(catalogEntries.map(item => item.type)).size, catalogEntries.length, 'não pode haver tipo oficial duplicado');
  for (const item of catalogEntries) {
    assert.ok(['ready', 'configurable', 'planned'].includes(item.readiness), `maturidade ausente: ${item.type}`);
  }
});

test('nenhum widget marcado ready pode ficar sem renderer builtin', () => {
  const readyWithoutRenderer = catalogEntries
    .filter(item => item.readiness === 'ready' && !registered.has(item.type))
    .map(item => item.type);

  assert.deepEqual(readyWithoutRenderer, []);
});

test('somente Pedidos e Atalhos ficam fora do runtime e ambos são planned', () => {
  const missing = catalogEntries
    .filter(item => !registered.has(item.type))
    .map(item => `${item.type}:${item.readiness}`)
    .sort();

  assert.deepEqual(missing, [
    'orders:planned',
    'shortcuts:planned',
  ]);
});

test('runtime registra 17 renderers operacionais e dois adapters administrativos', () => {
  assert.equal(registered.size, 19);
  for (const type of [
    'metrics',
    'dashboard',
    'stay-finance',
    'frigobar',
    'task-kanban',
    'room-map',
    'room-details',
    'quick-actions',
    'maintenance',
    'team',
    'user-access',
    'automation-admin',
    'guests',
    'reservations-list',
    'occupancy-calendar',
    'active-stays',
    'arrivals',
    'departures',
    'alerts',
  ]) {
    assert.ok(registered.has(type), `renderer builtin ausente: ${type}`);
  }
});

test('Equipe & Acessos é somente adapter de apresentação do módulo administrativo existente', () => {
  assert.match(userAccessSource, /UsersOperationalAccessModule/);
  assert.match(userAccessSource, /data-workspace-user-access-adapter/);
  assert.doesNotMatch(userAccessSource, /supabase|localStorage|sessionStorage|fetch\(|insert\(|update\(|delete\(/i);
});

test('Automações & Fechaduras é somente adapter de apresentação do módulo administrativo existente', () => {
  assert.match(automationAdminSource, /AutomationModule/);
  assert.match(automationAdminSource, /data-workspace-automation-admin-adapter/);
  assert.doesNotMatch(automationAdminSource, /supabase|localStorage|sessionStorage|fetch\(|insert\(|update\(|delete\(/i);
});
