import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogSource = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const registrationSource = readFileSync('src/workspace-engine/registerBuiltinWidgets.ts', 'utf8');

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
  assert.equal(catalogEntries.length, 19, 'a biblioteca oficial deve manter 19 tipos auditados nesta baseline');
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

test('matriz atual de widgets sem renderer fica explícita para evolução controlada', () => {
  const missing = catalogEntries
    .filter(item => !registered.has(item.type))
    .map(item => `${item.type}:${item.readiness}`)
    .sort();

  assert.deepEqual(missing, [
    'maintenance:configurable',
    'orders:planned',
    'quick-actions:configurable',
    'room-details:configurable',
    'shortcuts:configurable',
    'team:configurable',
  ]);
});

test('baseline registra exatamente os 13 renderers operacionais já existentes', () => {
  assert.equal(registered.size, 13);
  for (const type of [
    'metrics',
    'dashboard',
    'stay-finance',
    'frigobar',
    'task-kanban',
    'room-map',
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
