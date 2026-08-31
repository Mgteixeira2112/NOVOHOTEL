import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('calendário de ocupação é um widget independente registrado na recepção', () => {
  const types = read('src/workspace-engine/types.ts');
  const catalog = read('src/workspace-engine/widgetCatalog.ts');
  const registry = read('src/workspace-engine/registerBuiltinWidgets.ts');
  const workspaces = read('src/workspace-engine/workspaceOfficialFactory.ts');

  assert.match(types, /'occupancy-calendar'/);
  assert.match(catalog, /type: 'occupancy-calendar'/);
  assert.match(registry, /registerWorkspaceWidgetRenderer\('occupancy-calendar', OccupancyCalendarWidget\)/);
  assert.match(workspaces, /id: 'recepcao-calendario-ocupacao', type: 'occupancy-calendar'/);
});

test('calendário usa reservas ativas e bloqueios do Supabase', () => {
  const widget = read('src/workspace-engine/widgets/OccupancyCalendarWidget.tsx');

  assert.match(widget, /ACTIVE_RESERVATION_STATUSES = \['pendente', 'confirmada', 'checkin_realizado'\]/);
  assert.match(widget, /\.from\('bloqueios'\)/);
  assert.match(widget, /start <= day && day < end/);
  assert.match(widget, /Quarto da hospedagem|Calendário de ocupação|Diárias reservadas/);
});

test('calendário oferece janelas de 7, 14 e 30 dias', () => {
  const widget = read('src/workspace-engine/widgets/OccupancyCalendarWidget.tsx');
  assert.match(widget, /<option value=\{7\}>7 dias<\/option>/);
  assert.match(widget, /<option value=\{14\}>14 dias<\/option>/);
  assert.match(widget, /<option value=\{30\}>30 dias<\/option>/);
});
