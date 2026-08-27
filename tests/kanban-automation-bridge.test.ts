import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canonicalKanbanAutomationId,
  isKanbanAutomationCard,
  kanbanAutomationRoomNumber,
} from '../src/domain/kanbanAutomation';

const layout = readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');
const engine = readFileSync('src/services/kanbanV2.ts', 'utf8');

test('classificação distingue cards automáticos de cards manuais e demonstrativos', () => {
  assert.equal(isKanbanAutomationCard({ id: 'card-init-1', titulo: 'Demo' }), false);
  assert.equal(isKanbanAutomationCard({ id: 'card_manual_1', titulo: 'Manual' }), false);
  assert.equal(isKanbanAutomationCard({ id: 'gov_card_101_1', titulo: 'Limpeza', departamento: 'governanca', room_number: '101' }), true);
  assert.equal(isKanbanAutomationCard({ id: 'card_x', titulo: 'Reserva', reservation_id: 'res-1' }), true);
  assert.equal(isKanbanAutomationCard({ id: 'card_y', titulo: 'Frigobar', metadata: { type: 'frigobar_restock' } }), true);
});

test('IDs canônicos são determinísticos por reserva ou quarto', () => {
  assert.equal(canonicalKanbanAutomationId({ id: 'rec_card_old', reservation_id: 'res/123' }), 'auto-res-res_123');
  assert.equal(canonicalKanbanAutomationId({ id: 'gov_card_101_old', titulo: 'Limpeza', departamento: 'governanca', room_number: '101' }), 'auto-gov-room-101');
  assert.equal(canonicalKanbanAutomationId({ id: 'man_card_202_old', titulo: 'Reparo', departamento: 'manutencao', room_number: '202' }), 'auto-man-room-202');
  assert.equal(canonicalKanbanAutomationId({ id: 'mb_card_303_old', titulo: 'Frigobar', departamento: 'governanca', room_number: '303' }), 'auto-minibar-room-303');
});

test('quarto pode ser recuperado do campo location legado', () => {
  assert.equal(kanbanAutomationRoomNumber({ id: 'legacy', location: 'Quarto 404' }), '404');
  assert.equal(canonicalKanbanAutomationId({
    id: 'man_card_legacy',
    titulo: 'Reparo técnico',
    departamento: 'manutencao',
    location: 'Quarto 404',
  }), 'auto-man-room-404');
});

test('IDs já canônicos permanecem estáveis', () => {
  assert.equal(canonicalKanbanAutomationId({ id: 'auto-res-res-1', reservation_id: 'res-1' }), 'auto-res-res-1');
  assert.equal(canonicalKanbanAutomationId({ id: 'auto-gov-room-101', titulo: 'Limpeza', departamento: 'governanca', room_number: '101' }), 'auto-gov-room-101');
});

test('ponte fica montada globalmente no painel administrativo', () => {
  assert.match(layout, /KanbanLocalAutomationBridge/);
  assert.match(layout, /<KanbanLocalAutomationBridge\s*\/>/);
});

test('motor realtime estável continua ouvindo INSERT e UPDATE', () => {
  assert.match(engine, /event\s*:\s*['"]INSERT['"]/);
  assert.match(engine, /event\s*:\s*['"]UPDATE['"]/);
  assert.match(engine, /table\s*:\s*['"]kanban_cards['"]/);
});
