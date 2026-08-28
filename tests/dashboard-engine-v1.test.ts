import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const engine = readFileSync('src/dashboard-engine/dashboardEngine.ts', 'utf8');
const registry = readFileSync('src/dashboard-engine/registry.ts', 'utf8');
const migration = readFileSync('supabase/migrations/20260829001000_dashboard_engine_v1.sql', 'utf8');

test('Dashboard Engine expõe contrato público para métricas e dashboards', () => {
  assert.match(engine, /registerDataSource/);
  assert.match(engine, /registerMetric/);
  assert.match(engine, /resolveMetric/);
  assert.match(engine, /resolveMetrics/);
  assert.match(engine, /listDashboards/);
  assert.match(engine, /saveDashboard/);
  assert.match(engine, /saveBlock/);
});

test('registry reaproveita a fonte oficial de métricas existente', () => {
  assert.match(registry, /metricService\.dashboard/);
  assert.match(registry, /hotel\.metrics\.summary/);
  assert.match(registry, /finance\.total_revenue/);
  assert.match(registry, /finance\.minibar_revenue/);
  assert.match(registry, /hotel\.occupancy/);
  assert.match(registry, /governance\.productivity/);
});

test('persistência suporta múltiplos dashboards e blocos sem localStorage', () => {
  assert.match(migration, /create table if not exists public\.hotel_os_dashboards/);
  assert.match(migration, /create table if not exists public\.hotel_os_dashboard_blocks/);
  assert.match(migration, /unique\(hotel_id,owner_user_id,slug\)/);
  assert.match(migration, /scope in \('PERSONAL','ROLE','HOTEL'\)/);
  assert.doesNotMatch(migration, /localStorage/);
});

test('RLS protege dashboards pessoais e escrita dos blocos', () => {
  assert.match(migration, /scope <> 'PERSONAL' or owner_user_id = auth\.uid\(\)/);
  assert.match(migration, /d\.owner_user_id = auth\.uid\(\)/);
  assert.match(migration, /public\.usuario_pode_hotel\(d\.hotel_id\)/);
});
