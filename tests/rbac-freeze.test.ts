import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const permissions = readFileSync('src/core/permissions/permissionService.ts', 'utf8');
const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const catalog = readFileSync('src/workspace-engine/widgetCatalog.ts', 'utf8');
const userAccess = readFileSync('src/workspace-engine/widgets/UserAccessWidget.tsx', 'utf8');

const forbiddenParallelAuthorization = [
  /createClient\(/,
  /localStorage|sessionStorage/i,
  /create table|alter table/i,
];

test('RBAC permanece centralizado no permissionService existente', () => {
  assert.match(permissions, /ROLE_DEFAULT_PERMISSIONS/);
  assert.match(permissions, /canAccessTab/);
  assert.match(permissions, /canAccessResource/);
  assert.match(permissions, /if \(role === 'admin'\) return true/);
  assert.match(permissions, /rule\.permissions\[role\]\?\.granted/);
});

test('runtime do Workspace filtra visibilidade e recurso RBAC antes da composição', () => {
  assert.match(runtime, /widget\.enabled !== false/);
  assert.match(runtime, /widget\.permissions\?\.view !== false/);
  assert.match(runtime, /getWidgetCatalogItem\(widget\.type\)\?\.requiredRbacResource/);
  assert.match(runtime, /canAccessResource\(rbacMatrix, role, requiredResource\)/);
});

test('catálogo mantém recursos RBAC financeiros já certificados sem nova fonte', () => {
  assert.match(catalog, /type: 'stay-finance'[\s\S]*requiredRbacResource: 'frontdesk'/);
  assert.match(catalog, /type: 'financial-summary'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'financial-transactions'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'financial-overview'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'financial-receivables'[\s\S]*requiredRbacResource: 'financial'/);
  assert.match(catalog, /type: 'financial-payables'[\s\S]*requiredRbacResource: 'financial'/);
});

test('Equipe & Acessos continua apenas como adapter do módulo administrativo existente', () => {
  assert.match(userAccess, /UsersOperationalAccessModule/);
  assert.match(userAccess, /Presentation adapter only/);
});

test('certificação RBAC não introduz autorização ou persistência paralela', () => {
  for (const source of [permissions, runtime, userAccess]) {
    for (const forbidden of forbiddenParallelAuthorization) assert.doesNotMatch(source, forbidden);
  }
});
