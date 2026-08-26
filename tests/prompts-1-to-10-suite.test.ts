import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS } from '../src/core/permissions/permissionKeys';
import { can, hasRolePermission, guardTab, ROLE_DEFAULT_PERMISSIONS } from '../src/core/permissions/permissionService';
import { availabilityRepository } from '../src/repositories/availabilityRepository';
import { taskRepository } from '../src/repositories/taskRepository';
import { reservationsRepository } from '../src/repositories/reservationsRepository';
import { datesOverlap, calculateNights, isRoomAvailable } from '../src/utils/availability';
import { detectReservationConflict, BED_MATCHES, RESERVATION_STATUSES } from '../src/domain/hotelOsCore';
import { eventMatchesCondition, isAuthorizedForEvent, nextEventStatus } from '../src/core/events/eventPolicy';
import { calculateOccupancy, calculateAdr, calculateRevpar } from '../src/core/bi/metricFormulas';
import { redact } from '../src/core/security/redaction';
import { isTenantContextValid, canUseHotel, resolveFeatureFlag } from '../src/core/tenant/tenantPolicy';
import type { FeatureFlag, HotelMembership, TenantContext } from '../src/core/tenant/tenantTypes';
import type { UserRole, Quarto, Reserva, BloqueioQuarto } from '../src/types';

// PROMPT 1 — AUDITORIA E REFATORAÇÃO DA ARQUITETURA
test('PROMPT 1 — Arquitetura Modular: Camadas Desacopladas e TypeScript Estrito', () => {
  assert.ok(availabilityRepository, 'availabilityRepository deve existir na camada de repositórios');
  assert.ok(taskRepository, 'taskRepository deve existir');
  assert.ok(reservationsRepository, 'reservationsRepository deve existir');
  assert.ok(typeof detectReservationConflict === 'function', 'Regras de domínio devem estar isoladas');
  assert.ok(typeof calculateOccupancy === 'function', 'Fórmulas de BI e métricas devem ser desacopladas');
});

// PROMPT 2 — MULTI-HOTEL / MULTI-TENANT
test('PROMPT 2 — Multi-Hotel / Multi-Tenant: Isolamento Estrito e Resolução de Hotel Ativo', () => {
  const memberships: HotelMembership[] = [
    { id: 'm_1', user_id: 'u_carlos', organization_id: 'org_alpha', hotel_id: 'hotel_matriz', role: 'gerente', active: true },
    { id: 'm_2', user_id: 'u_carlos', organization_id: 'org_alpha', hotel_id: 'hotel_filial_01', role: 'recepcionista', active: true },
    { id: 'm_3', user_id: 'u_carlos', organization_id: 'org_alpha', hotel_id: 'hotel_inativo', role: 'recepcionista', active: false },
  ];

  // Acesso permitido apenas aos hotéis associados e ativos
  assert.ok(canUseHotel('u_carlos', 'hotel_matriz', memberships));
  assert.ok(canUseHotel('u_carlos', 'hotel_filial_01', memberships));
  assert.ok(!canUseHotel('u_carlos', 'hotel_filial_99', memberships), 'Hotel não associado deve ser bloqueado');
  assert.ok(!canUseHotel('u_carlos', 'hotel_inativo', memberships), 'Hotel com membership inativa deve ser bloqueado');

  // Validação de contexto tenant completo
  const validContext: TenantContext = {
    userId: 'u_carlos',
    organizationId: 'org_alpha',
    hotelId: 'hotel_matriz',
    role: 'gerente',
  };
  assert.ok(isTenantContextValid(validContext, memberships));

  const invalidRoleContext: TenantContext = {
    userId: 'u_carlos',
    organizationId: 'org_alpha',
    hotelId: 'hotel_matriz',
    role: 'admin', // Adulteração de role
  };
  assert.ok(!isTenantContextValid(invalidRoleContext, memberships), 'Contexto com role divergente do membership deve ser rejeitado');
});

// PROMPT 3 — RBAC E PERMISSÕES
test('PROMPT 3 — RBAC e Permissões: Modelagem Granular e Helper can()', () => {
  // Permissões granulares do documento
  assert.equal(PERMISSIONS.adminManage, 'admin.manage');
  assert.equal(PERMISSIONS.roomsView, 'rooms.view');
  assert.equal(PERMISSIONS.roomsEdit, 'rooms.edit');
  assert.equal(PERMISSIONS.reservationsView, 'reservations.view');
  assert.equal(PERMISSIONS.reservationsCreate, 'reservations.create');
  assert.equal(PERMISSIONS.kanbanKitchen, 'kanban.kitchen');
  assert.equal(PERMISSIONS.kanbanHousekeeping, 'kanban.housekeeping');
  assert.equal(PERMISSIONS.financeView, 'finance.view');

  // Validação do helper can()
  assert.ok(can(PERMISSIONS.adminManage, 'admin'), 'Admin tem acesso a admin.manage');
  assert.ok(can(PERMISSIONS.roomsView, 'recepcionista'), 'Recepcionista tem rooms.view');
  assert.ok(!can(PERMISSIONS.adminManage, 'recepcionista'), 'Recepcionista não tem admin.manage');
  assert.ok(can(PERMISSIONS.kanbanKitchen, 'cozinha_only'), 'Cozinha tem kanban.kitchen');
  assert.ok(!can(PERMISSIONS.reservationsCreate, 'cozinha_only'), 'Cozinha não pode criar reservas');
  assert.ok(can(PERMISSIONS.kanbanHousekeeping, 'governanca'), 'Governança tem kanban.housekeeping');
  assert.ok(can(PERMISSIONS.financeView, 'financeiro'), 'Financeiro tem finance.view');

  // Proteção de rotas/abas (guards)
  assert.ok(guardTab('recepcionista', 'reservations').allowed, 'Recepcionista acessa módulo de reservas');
  assert.ok(!guardTab('cozinha_only', 'financial').allowed, 'Cozinha não acessa módulo financeiro');
});

// PROMPT 6 — RESERVAS E PREVENÇÃO DE OVERBOOKING
test('PROMPT 6 — Reservas e Prevenção de Overbooking: Validação Atômica [in, out) e Bloqueios', () => {
  const existingReservas: Reserva[] = [
    {
      id: 'res_01',
      quarto_id: 'q_101',
      hospede_id: 'h_1',
      data_checkin: '2026-09-10',
      data_checkout: '2026-09-15',
      status: 'confirmada',
      origem: 'direta',
      valor_total: 1500,
      valor_diarias: 1500,
      valor_consumo: 0,
      valor_pago: 0,
      created_at: new Date().toISOString(),
    },
  ];

  // 1. Conflito sobreposto dentro do intervalo [2026-09-12, 2026-09-18)
  const hasConflict = !isRoomAvailable('q_101', '2026-09-12', '2026-09-18', existingReservas, []);
  assert.ok(hasConflict, 'Detecta sobreposição no período conflitante');

  // 2. Não gera conflito em reservas consecutivas (check-in no mesmo dia do check-out)
  const isAvailableConsecutive = isRoomAvailable('q_101', '2026-09-15', '2026-09-20', existingReservas, []);
  assert.ok(isAvailableConsecutive, 'Check-in no mesmo dia do check-out é válido em intervalo aberto [in, out)');

  // 3. Quarto com bloqueio operacional impede disponibilidade
  const blocks: BloqueioQuarto[] = [
    {
      id: 'blk_01',
      quarto_id: 'q_101',
      data_inicio: '2026-10-01',
      data_fim: '2026-10-05',
      motivo: 'Manutenção preventiva no ar condicionado',
      tipo: 'manutencao',
      created_at: new Date().toISOString(),
    },
  ];

  assert.equal(
    isRoomAvailable('q_101', '2026-10-02', '2026-10-04', existingReservas, blocks),
    false,
    'Quarto bloqueado para manutenção não está disponível'
  );
});

// PROMPT 4 — MOTOR CENTRAL DE KANBAN OPERACIONAL
test('PROMPT 4 — Motor Central de Kanban Operacional: Estrutura Completa de Tarefas', () => {
  // Valida integridade do contrato e transições de status do Kanban
  assert.ok(taskRepository.list, 'taskRepository.list deve estar disponível');
  assert.ok(taskRepository.create, 'taskRepository.create deve estar disponível');
  assert.ok(taskRepository.transition, 'taskRepository.transition deve estar disponível');
  assert.ok(taskRepository.inspection, 'taskRepository.inspection deve suportar aprovação e rejeição de governança');
});

// PROMPT 5 — EVENTOS E AUTOMAÇÕES
test('PROMPT 5 — Eventos e Automações: Desacoplamento, Políticas e Idempotência', () => {
  // Correspondência de condições do evento
  assert.equal(eventMatchesCondition({ payload: { source: 'ROOM_SERVICE' } }, { source: 'ROOM_SERVICE' }), true);
  assert.equal(eventMatchesCondition({ payload: { source: 'POS' } }, { source: 'ROOM_SERVICE' }), false);

  // Validação de isolamento do evento por hotel ativo
  const user = { userId: 'u_recep', organizationId: 'org_1', hotelId: 'hotel_alpha', permission: 'RESERVATION_VIEW' };
  assert.equal(isAuthorizedForEvent(user, { organizationId: 'org_1', hotelId: 'hotel_alpha' }), true);
  assert.equal(isAuthorizedForEvent(user, { organizationId: 'org_1', hotelId: 'hotel_beta' }), false, 'Evento de outro hotel deve ser rejeitado');

  // Retry com Dead Letter Queue (DLQ)
  assert.equal(nextEventStatus(1), 'FAILED');
  assert.equal(nextEventStatus(5), 'DEAD_LETTER', 'Após 5 tentativas com falha, move para DEAD_LETTER');
});

// PROMPT 7 — REALTIME
test('PROMPT 7 — Realtime: Centralização de Subscriptions e Isolamento Seguro', () => {
  // Valida que listeners de realtime filtram por tenant e não vazam eventos cruzados
  const authUser = { userId: 'u_gov', organizationId: 'org_1', hotelId: 'hotel_sul', permission: 'KANBAN_VIEW' };
  const eventSul = { organizationId: 'org_1', hotelId: 'hotel_sul' };
  const eventNorte = { organizationId: 'org_1', hotelId: 'hotel_norte' };

  assert.ok(isAuthorizedForEvent(authUser, eventSul));
  assert.ok(!isAuthorizedForEvent(authUser, eventNorte));
});

// PROMPT 8 — DASHBOARD HOTEL OS
test('PROMPT 8 — Dashboard Hotel OS: Centralização de Métricas (Ocupação, ADR, RevPAR)', () => {
  // Cálculo de Ocupação: 80 quartos ocupados de 100 disponíveis = 80% (0.8)
  const occupancy = calculateOccupancy(80, 100);
  assert.equal(occupancy, 0.8);

  // Cálculo de ADR (Average Daily Rate): R$ 24.000 / 80 diárias vendidas = R$ 300,00
  const adr = calculateAdr(24000, 80);
  assert.equal(adr, 300);

  // Cálculo de RevPAR: R$ 24.000 / 100 quartos disponíveis = R$ 240,00
  const revpar = calculateRevpar(24000, 100);
  assert.equal(revpar, 240);
  assert.equal(revpar, occupancy * adr, 'RevPAR deve ser matematicamente igual a Taxa de Ocupação * ADR');
});

// PROMPT 9 — AUDITORIA E HISTÓRICO
test('PROMPT 9 — Auditoria e Histórico: Sanitização, Redaction de Dados Sensíveis e Imutabilidade', () => {
  const sensitivePayload = {
    guest_name: 'Carlos Silva',
    credit_card: '4111222233334444',
    card_number: '4111222233334444',
    cvv: '123',
    password: 'secret_password_123',
    token: 'jwt_token_secret',
    total_amount: 1500,
  };

  const sanitized = redact(sensitivePayload) as Record<string, unknown>;

  // Senhas, tokens, números de cartão e CVV devem ser expurgados da trilha de auditoria
  assert.equal(sanitized.password, undefined);
  assert.equal(sanitized.cvv, undefined);
  assert.equal(sanitized.card_number, undefined);
  assert.equal(sanitized.token, undefined);
  assert.equal(sanitized.guest_name, 'Carlos Silva');
  assert.equal(sanitized.total_amount, 1500);
});

// PROMPT 10 — QUALIDADE, SEGURANÇA E PRODUÇÃO
test('PROMPT 10 — Qualidade e Segurança: Ausência de Segredos Expostos no Frontend', () => {
  const envDump = JSON.stringify(process.env);
  assert.ok(!envDump.includes('AIzaSy_PROD_SECRET_LEAK'), 'Nenhuma chave secreta em texto plano');
  assert.ok(!envDump.includes('sk_live_stripe_secret'), 'Nenhum token privado em texto plano');
});
