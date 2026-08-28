import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('dashboard é um widget oficial do Workspace sem alterar o runtime', () => {
  const types = read('src/workspace-engine/types.ts');
  const catalog = read('src/workspace-engine/widgetCatalog.ts');
  const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');
  const runtime = read('src/workspace-engine/widgetRuntimeRegistry.tsx');

  assert.match(types, /'dashboard'/);
  assert.match(types, /\| 'dashboard'\n  \| 'kanban'/);
  assert.match(catalog, /type: 'dashboard'/);
  assert.match(catalog, /defaultDataSource: 'dashboard'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('dashboard', DashboardWidget\)/);
  assert.doesNotMatch(runtime, /DashboardWidget|dashboardEngine/);
});

test('widget Dashboard consome exclusivamente a API pública do Dashboard Engine', () => {
  const widget = read('src/workspace-engine/widgets/DashboardWidget.tsx');

  assert.match(widget, /dashboardEngine\.listDashboards/);
  assert.match(widget, /dashboardEngine\.getDashboard/);
  assert.match(widget, /dashboardEngine\.resolveMetrics/);
  assert.match(widget, /dashboardEngine\.saveDashboard/);
  assert.match(widget, /dashboardEngine\.saveBlock/);
  assert.match(widget, /dashboardEngine\.deleteBlock/);
  assert.doesNotMatch(widget, /localStorage/);
  assert.doesNotMatch(widget, /supabase\.from|supabase\.rpc/);
});

test('composer permite escolher métrica, visual, largura e reordenar blocos', () => {
  const widget = read('src/workspace-engine/widgets/DashboardWidget.tsx');

  assert.match(widget, /KPI/);
  assert.match(widget, /Gráfico/);
  assert.match(widget, /Tabela/);
  assert.match(widget, /Ranking/);
  assert.match(widget, /Progresso/);
  assert.match(widget, /Alerta/);
  assert.match(widget, /WIDTHS = \[3, 4, 6, 12\]/);
  assert.match(widget, /positionY: Math\.max\(0, block\.positionY - 1\)/);
  assert.match(widget, /positionY: block\.positionY \+ 1/);
  assert.match(widget, /Personalizar/);
});
