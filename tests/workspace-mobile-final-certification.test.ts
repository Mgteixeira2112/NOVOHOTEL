import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync('src/workspace-engine/WidgetDrivenWorkspace.tsx', 'utf8');
const presentation = readFileSync('src/workspace-engine/presentation.ts', 'utf8');

test('Mobile mantém somente a estratégia já existente, sem runtime ou editor paralelo', () => {
  assert.match(runtime, /window\.matchMedia\('\(max-width: 767px\)'\)/);
  assert.match(runtime, /viewport === 'mobile' \? 'flex flex-col gap-4 p-4'/);
  assert.match(runtime, /viewport === 'desktop'/);
  assert.match(runtime, /renderDesktopSurface\(\)/);
  assert.match(runtime, /renderDesktopSpatialWidgets\(\)/);
  assert.match(runtime, /renderDesktopSidebar\(\)/);
  assert.doesNotMatch(runtime, /desktopSpatialEntries = viewport === 'mobile'/);
  assert.doesNotMatch(runtime, /desktopSidebarActive = viewport === 'mobile'/);
});

test('Mobile automático permanece vertical e em largura total', () => {
  assert.match(presentation, /if \(viewport === 'mobile' && deviceMode === 'auto'\) width = 'full'/);
  assert.match(runtime, /viewport === 'mobile' \? 'flex flex-col gap-4 p-4'/);
});

test('Mobile personalizado reutiliza apenas os overrides já existentes', () => {
  assert.match(presentation, /definition\.widgets\.some\(widget => hasOverrideValues\(widget\.presentation\?\.mobile\)\)/);
  assert.match(presentation, /base\.mobile/);
  assert.match(presentation, /override\.display === 'summary' && viewport === 'mobile'/);
  assert.match(presentation, /override\.display === 'button' \|\| override\.display === 'panel'/);
  assert.match(presentation, /hidden = override\.hidden === true/);
  assert.match(presentation, /order = override\.order \?\? order/);
});

test('Resumo e botão Mobile abrem o mesmo widget existente, sem fonte de dados paralela', () => {
  assert.match(runtime, /presentation\.display === 'summary'/);
  assert.match(runtime, /presentation\.display === 'button'/);
  assert.match(runtime, /openWidgetPanel\(widget\.id\)/);
  assert.match(runtime, /getWorkspaceWidgetRenderer\(openWidget\.type\)/);
  assert.match(runtime, /createPortal/);
  assert.doesNotMatch(runtime, /supabase\.from/);
  assert.doesNotMatch(runtime, /fetch\(/);
});

test('RBAC e visibilidade continuam aplicados antes da composição Mobile', () => {
  assert.match(runtime, /widget\.enabled !== false/);
  assert.match(runtime, /widget\.permissions\?\.view !== false/);
  assert.match(runtime, /canAccessResource\(rbacMatrix, role, requiredResource\)/);
  assert.match(runtime, /!presentation\.hidden/);
});
