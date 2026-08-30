import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('Dashboard continua isolado na API pública do Dashboard Engine', () => {
  const widget = read('src/workspace-engine/widgets/DashboardWidget.tsx');
  assert.match(widget, /dashboardEngine\.listDashboards/);
  assert.match(widget, /dashboardEngine\.getDashboard/);
  assert.match(widget, /dashboardEngine\.resolveMetrics/);
  assert.match(widget, /dashboardEngine\.saveDashboard/);
  assert.match(widget, /dashboardEngine\.saveBlock/);
  assert.match(widget, /dashboardEngine\.deleteBlock/);
  assert.doesNotMatch(widget, /supabase\.from|supabase\.rpc|localStorage/);
});

test('Financeiro opera apenas hospedagens em quartos ativos e usa Financial Engine', () => {
  const widget = read('src/workspace-engine/widgets/StayFinanceWidget.tsx');
  assert.match(widget, /new Set\(rooms\.filter\(room => room\.ativo !== false\)\.map\(room => room\.id\)\)/);
  assert.match(widget, /item\.status === 'checkin_realizado'[\s\S]*activeRoomIds\.has\(item\.quarto_id\)/);
  assert.match(widget, /financialEngine\.getFolioByStay/);
  assert.match(widget, /financialEngine\.addCharge/);
  assert.match(widget, /financialEngine\.receivePayment/);
  assert.match(widget, /financialEngine\.voidCharge/);
  assert.doesNotMatch(widget, /supabase\.|localStorage/);
});

test('Frigobar opera apenas hospedagens em quartos ativos e usa Frigobar Core', () => {
  const widget = read('src/workspace-engine/widgets/FrigobarWidget.tsx');
  assert.match(widget, /new Set\(rooms\.filter\(room => room\.ativo !== false\)\.map\(room => room\.id\)\)/);
  assert.match(widget, /item\.status === 'checkin_realizado'[\s\S]*activeRoomIds\.has\(item\.quarto_id\)/);
  assert.match(widget, /frigobarCore\.getRoomSnapshot/);
  assert.match(widget, /frigobarCore\.registerConsumption/);
  assert.match(widget, /frigobarCore\.restock/);
  assert.doesNotMatch(widget, /supabase\.|localStorage|mockFrigobarData/);
});
