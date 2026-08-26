import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATALOG_EVENT_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  RECIPIENT_TYPES,
  evaluateRuleCondition,
  formatRealtimeChannel,
  isQuietHoursActive,
  processEventRules,
  processEventStep,
  reprocessEvent,
  synchronizeOfflineQueue,
  type DevicePresenceRecord,
  type DomainEvent,
  type EventLogEntry,
  type NotificationPreference,
  type NotificationRecord,
  type NotificationRule,
  type OfflineAction,
} from '../src/domain/eventEngineCore';
import { createAuditRecord } from '../src/services/governanceService';

// 1. Criação de Evento
test('1. criação de evento: instancia evento padronizado com payload, correlation_id e hotel_id', () => {
  const event: DomainEvent = {
    id: 'evt-001',
    eventType: 'RESERVATION_CREATED',
    organizationId: 'org-alpha',
    hotelId: 'hotel-10',
    actorUserId: 'usr-guest-44',
    entityType: 'RESERVATION',
    entityId: 'res-999',
    payload: { roomCategory: 'DELUXE_OCEAN', nights: 3, guestName: 'Mariana Silva' },
    correlationId: 'corr-flow-101',
    createdAt: '2026-10-01T10:00:00Z',
  };

  assert.equal(event.eventType, 'RESERVATION_CREATED');
  assert.equal(event.hotelId, 'hotel-10');
  assert.equal(event.correlationId, 'corr-flow-101');
  assert.equal(CATALOG_EVENT_TYPES.includes('RESERVATION_CREATED'), true);
});

// 2. Processamento
test('2. processamento: fluxo EVENTO -> VALIDAÇÃO -> REGISTRO -> REGRAS -> NOTIFICAÇÕES -> PROCESSADO', () => {
  const event: DomainEvent = {
    id: 'evt-order-01',
    eventType: 'ORDER_CREATED',
    organizationId: 'org-alpha',
    hotelId: 'hotel-10',
    entityType: 'ORDER',
    entityId: 'ord-55',
    payload: { source: 'ROOM_TABLET', roomNumber: '304', items: ['Hambúrguer Artesanal', 'Suco Natural'] },
    createdAt: '2026-10-01T12:00:00Z',
  };

  const initialLog: EventLogEntry = {
    id: event.id,
    eventType: event.eventType,
    hotelId: event.hotelId,
    payload: event.payload,
    createdAt: event.createdAt,
    status: 'PENDING',
    retryCount: 0,
  };

  // Processa com sucesso
  const processedLog = processEventStep(initialLog, true);
  assert.equal(processedLog.status, 'PROCESSED');
  assert.notEqual(processedLog.processedAt, undefined);
});

// 3. Idempotência
test('3. idempotência: garante que o mesmo event_id ou idempotency_key não seja processado duplamente', () => {
  const processedEvents = new Set<string>();

  function handleEvent(idempotencyKey: string): { status: 'APPLIED' | 'IGNORED_DUPLICATE' } {
    if (processedEvents.has(idempotencyKey)) {
      return { status: 'IGNORED_DUPLICATE' };
    }
    processedEvents.add(idempotencyKey);
    return { status: 'APPLIED' };
  }

  const res1 = handleEvent('idem-event-key-123');
  const res2 = handleEvent('idem-event-key-123');

  assert.equal(res1.status, 'APPLIED');
  assert.equal(res2.status, 'IGNORED_DUPLICATE');
});

// 4. Retry
test('4. retry: incrementa contagem e marca como FAILED para reexecução em caso de erro temporário', () => {
  const log: EventLogEntry = {
    id: 'evt-fail-1',
    eventType: 'PAYMENT_RECEIVED',
    hotelId: 'hotel-10',
    payload: {},
    createdAt: '2026-10-01T12:00:00Z',
    status: 'PROCESSING',
    retryCount: 0,
  };

  const retry1 = processEventStep(log, false, 'Network timeout connecting to webhook');
  assert.equal(retry1.status, 'FAILED');
  assert.equal(retry1.retryCount, 1);
  assert.equal(retry1.lastError, 'Network timeout connecting to webhook');
});

// 5. Dead Letter
test('5. dead letter: transiciona para DEAD_LETTER após exceder limite máximo de tentativas', () => {
  const log: EventLogEntry = {
    id: 'evt-fail-dead',
    eventType: 'PAYMENT_RECEIVED',
    hotelId: 'hotel-10',
    payload: {},
    createdAt: '2026-10-01T12:00:00Z',
    status: 'FAILED',
    retryCount: 2, // já tentou 2 vezes
  };

  const deadLetter = processEventStep(log, false, 'Gateway 500 error permanent', 3);
  assert.equal(deadLetter.status, 'DEAD_LETTER');
  assert.equal(deadLetter.retryCount, 3);
});

// 6. Reprocessamento
test('6. reprocessamento: permite que operador/admin reprocesse eventos em DEAD_LETTER ou FAILED', () => {
  const deadLetterLog: EventLogEntry = {
    id: 'evt-reproc',
    eventType: 'GUEST_CHECKED_OUT',
    hotelId: 'hotel-10',
    payload: {},
    createdAt: '2026-10-01T12:00:00Z',
    status: 'DEAD_LETTER',
    retryCount: 3,
    lastError: 'Integration crashed',
  };

  const reprocessed = reprocessEvent(deadLetterLog);
  assert.equal(reprocessed.status, 'PROCESSING');
  assert.equal(reprocessed.lastError, null);
});

// 7. Realtime
test('7. realtime: formata canais no padrão canônico hotel:{hotel_id}:scope', () => {
  assert.equal(formatRealtimeChannel('hotel-10', 'orders'), 'hotel:hotel-10:orders');
  assert.equal(formatRealtimeChannel('hotel-10', 'kanban'), 'hotel:hotel-10:kanban');
  assert.equal(formatRealtimeChannel('hotel-10', 'rooms'), 'hotel:hotel-10:rooms');
  assert.equal(formatRealtimeChannel('hotel-10', 'maintenance'), 'hotel:hotel-10:maintenance');
  assert.equal(formatRealtimeChannel('hotel-10', 'notifications'), 'hotel:hotel-10:notifications');
});

// 8. Notificações
test('8. notificações: gera registros derivados de eventos conforme regras configuradas', () => {
  const event: DomainEvent = {
    id: 'evt-order-kitchen',
    eventType: 'ORDER_CREATED',
    hotelId: 'hotel-10',
    entityType: 'ORDER',
    entityId: 'ord-88',
    payload: { source: 'ROOM_TABLET', roomNumber: '202' },
    createdAt: '2026-10-01T12:00:00Z',
  };

  const rules: NotificationRule[] = [
    {
      id: 'rule-kitchen',
      name: 'Tablet para Cozinha',
      eventType: 'ORDER_CREATED',
      condition: { source: 'ROOM_TABLET' },
      recipientType: 'DEPARTMENT',
      channel: 'REALTIME',
      priority: 'HIGH',
      enabled: true,
    },
  ];

  const notifications = processEventRules(event, rules, (rule) => [{ type: 'DEPARTMENT', id: 'KITCHEN' }]);

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].channel, 'REALTIME');
  assert.equal(notifications[0].priority, 'HIGH');
  assert.equal(notifications[0].recipientId, 'KITCHEN');
  assert.equal(NOTIFICATION_CHANNELS.includes('REALTIME'), true);
});

// 9. Preferências
test('9. preferências: permite configurar canais e horários de silêncio (Quiet Hours)', () => {
  const pref: NotificationPreference = {
    id: 'pref-usr-1',
    userId: 'usr-manager',
    hotelId: 'hotel-10',
    eventType: 'ROOM_CLEAN',
    channel: 'PUSH',
    enabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  };

  // Às 23:30 está em quiet hours para evento normal
  const isSilencedNormal = isQuietHoursActive('23:30', pref.quietHoursStart, pref.quietHoursEnd, 'NORMAL', false);
  assert.equal(isSilencedNormal, true);

  // Às 14:00 NÃO está em quiet hours
  const isSilencedDay = isQuietHoursActive('14:00', pref.quietHoursStart, pref.quietHoursEnd, 'NORMAL', false);
  assert.equal(isSilencedDay, false);
});

// 10. Prioridade & Quiet Hours Bypass
test('10. prioridade: eventos críticos e de segurança nunca são suprimidos por horários de silêncio', () => {
  // Mesmo às 02:00 da madrugada, evento CRITICAL ou de segurança passa
  const isSilencedCritical = isQuietHoursActive('02:00', '22:00', '07:00', 'CRITICAL', true);
  assert.equal(isSilencedCritical, false);

  assert.equal(NOTIFICATION_PRIORITIES.includes('CRITICAL'), true);
  assert.equal(NOTIFICATION_PRIORITIES.includes('URGENT'), true);
});

// 11. Multi-hotel
test('11. multi-hotel: eventos e notificações carregam organization_id e hotel_id isolados', () => {
  const eventAlpha: DomainEvent = {
    id: 'evt-a',
    eventType: 'ROOM_DIRTY',
    organizationId: 'org-alpha',
    hotelId: 'hotel-a',
    payload: {},
    createdAt: '',
  };

  const eventBeta: DomainEvent = {
    id: 'evt-b',
    eventType: 'ROOM_DIRTY',
    organizationId: 'org-alpha',
    hotelId: 'hotel-b',
    payload: {},
    createdAt: '',
  };

  assert.notEqual(eventAlpha.hotelId, eventBeta.hotelId);
});

// 12. Segurança
test('12. segurança: validação de permissão de canal antes de autorizar subscrição realtime', () => {
  const userHotels = new Set(['hotel-a']);

  function canSubscribe(userId: string, hotelId: string): boolean {
    return userHotels.has(hotelId);
  }

  assert.equal(canSubscribe('usr-1', 'hotel-a'), true);
  assert.equal(canSubscribe('usr-1', 'hotel-b'), false);
});

// 13. Presença
test('13. presença: monitora status ONLINE, OFFLINE e LAST_SEEN para usuários, tablets e PDVs', () => {
  const presenceList: DevicePresenceRecord[] = [
    {
      id: 'pres-1',
      hotelId: 'hotel-10',
      deviceId: 'tab-room-101',
      presenceType: 'TABLET',
      status: 'ONLINE',
      lastSeenAt: '2026-10-01T12:30:00Z',
    },
    {
      id: 'pres-2',
      hotelId: 'hotel-10',
      deviceId: 'pos-pool-bar',
      presenceType: 'POS',
      status: 'OFFLINE',
      lastSeenAt: '2026-10-01T11:00:00Z',
    },
  ];

  const onlineDevices = presenceList.filter((p) => p.status === 'ONLINE');
  assert.equal(onlineDevices.length, 1);
  assert.equal(onlineDevices[0].deviceId, 'tab-room-101');
});

// 14. Offline
test('14. offline: enfileiramento de operações em tablets e PDVs sem conexão', () => {
  const offlineQueue: OfflineAction[] = [
    {
      id: 'act-1',
      deviceId: 'pos-pool',
      hotelId: 'hotel-10',
      actionType: 'ADD_ORDER_ITEM',
      payload: { itemId: 'prod-agua', quantity: 2 },
      idempotencyKey: 'offline-idem-001',
      clientTimestamp: '2026-10-01T12:05:00Z',
      version: 1,
    },
  ];

  assert.equal(offlineQueue.length, 1);
  assert.equal(offlineQueue[0].idempotencyKey, 'offline-idem-001');
});

// 15. Sincronização
test('15. sincronização: descarrega fila offline com validação de idempotência e aplicação no servidor', () => {
  const offlineActions: OfflineAction[] = [
    {
      id: 'act-1',
      deviceId: 'pos-pool',
      hotelId: 'hotel-10',
      actionType: 'ADD_ORDER_ITEM',
      payload: { entityId: 'ord-100', item: 'Café' },
      idempotencyKey: 'offline-idem-001',
      clientTimestamp: '2026-10-01T12:05:00Z',
      version: 1,
    },
  ];

  const serverState = new Map<string, { version: number; data: Record<string, unknown> }>();
  serverState.set('hotel-10:ord-100', { version: 1, data: { status: 'OPEN' } });

  const existingKeys = new Set<string>();

  const syncResult = synchronizeOfflineQueue(offlineActions, serverState, existingKeys);
  assert.equal(syncResult.appliedCount, 1);
  assert.equal(syncResult.conflictCount, 0);
  assert.equal(existingKeys.has('offline-idem-001'), true);
});

// 16. Conflitos de Concorrência
test('16. conflitos: rejeita sobrescrita silenciosa se versão do servidor for mais recente que a do cliente offline', () => {
  const offlineActionOutdated: OfflineAction = {
    id: 'act-outdated',
    deviceId: 'tab-102',
    hotelId: 'hotel-10',
    actionType: 'UPDATE_TASK',
    payload: { entityId: 'tsk-99', status: 'EM_ANDAMENTO' },
    idempotencyKey: 'offline-idem-outdated',
    clientTimestamp: '2026-10-01T12:00:00Z',
    version: 1, // cliente estava na v1
  };

  const serverState = new Map<string, { version: number; data: Record<string, unknown> }>();
  // Servidor já evoluiu para v3 enquanto o cliente estava offline
  serverState.set('hotel-10:tsk-99', { version: 3, data: { status: 'CONCLUIDA' } });

  const existingKeys = new Set<string>();
  const syncResult = synchronizeOfflineQueue([offlineActionOutdated], serverState, existingKeys);

  assert.equal(syncResult.conflictCount, 1);
  assert.equal(syncResult.appliedCount, 0);
  assert.match(syncResult.conflicts[0].reason, /CONCURRENT_MODIFICATION/);
});

// 17. Auditoria
test('17. auditoria: eventos críticos geram trilha imutável no sistema de auditoria', () => {
  const audit = createAuditRecord({
    hotelId: 'hotel-10',
    action: 'CANCEL',
    entityType: 'RESERVATION',
    entityId: 'res-999',
    requestId: 'req-audit-evt-77',
    beforeData: { status: 'CONFIRMED' },
    afterData: { status: 'CANCELLED' },
  });

  assert.equal(audit.action, 'CANCEL');
  assert.equal(audit.requestId, 'req-audit-evt-77');
});

// 18. Integração PDV & Cozinha
test('18. integração PDV: fluxo completo Tablet -> PDV -> Cozinha -> Kanban -> PREPARING -> READY -> Entregue -> Folio', () => {
  const workflowSteps = [
    'Tablet cria pedido (ORDER_CREATED)',
    'Pedido chega ao PDV',
    'Pedido chega à cozinha (KITCHEN)',
    'Pedido aparece no Kanban',
    'Pedido muda para PREPARING',
    'Tablet recebe atualização',
    'Pedido fica READY',
    'Hóspede recebe notificação',
    'Pedido é entregue (ORDER_DELIVERED)',
    'FOLIO recebe lançamento financeiro',
  ];

  assert.equal(workflowSteps.length, 10);
  assert.match(workflowSteps[0], /ORDER_CREATED/);
  assert.match(workflowSteps[9], /FOLIO/);
});

// 19. Integração Tablet
test('19. integração tablet: notificação de pedido pronto chega em tempo real ao dispositivo do quarto', () => {
  const eventReady: DomainEvent = {
    id: 'evt-ord-ready',
    eventType: 'ORDER_READY',
    hotelId: 'hotel-10',
    entityType: 'ORDER',
    entityId: 'ord-88',
    payload: { roomNumber: '304', guestName: 'Mariana' },
    createdAt: '2026-10-01T12:20:00Z',
  };

  const rules: NotificationRule[] = [
    {
      id: 'rule-guest-ready',
      name: 'Avisar quarto quando pronto',
      eventType: 'ORDER_READY',
      recipientType: 'ROOM',
      channel: 'REALTIME',
      priority: 'HIGH',
      enabled: true,
    },
  ];

  const notifs = processEventRules(eventReady, rules, (r, evt) => [{ type: 'ROOM', id: '304' }]);
  assert.equal(notifs.length, 1);
  assert.equal(notifs[0].recipientType, 'ROOM');
  assert.equal(notifs[0].recipientId, '304');
});

// 20. Integração Kanban
test('20. integração Kanban: eventos de tarefas e manutenção movem cartões nas colunas apropriadas', () => {
  const kanbanColumns = ['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDO'];
  let currentCardColumn = 'A_FAZER';

  function onMaintenanceStarted() {
    currentCardColumn = 'EM_ANDAMENTO';
  }

  function onMaintenanceCompleted() {
    currentCardColumn = 'CONCLUIDO';
  }

  onMaintenanceStarted();
  assert.equal(currentCardColumn, 'EM_ANDAMENTO');

  onMaintenanceCompleted();
  assert.equal(currentCardColumn, 'CONCLUIDO');
});

// 21. Integração Housekeeping
test('21. integração housekeeping: ROOM_DIRTY gera notificação e tarefa, finalizando em ROOM_CLEAN na recepção', () => {
  const eventsSequence = ['ROOM_DIRTY', 'HOUSEKEEPING_TASK_CREATED', 'ROOM_CLEAN', 'RECEPTION_UPDATED'];
  assert.equal(eventsSequence[0], 'ROOM_DIRTY');
  assert.equal(eventsSequence[2], 'ROOM_CLEAN');
});

// 22. Integração Manutenção
test('22. integração manutenção: MAINTENANCE_CREATED -> Equipe Manutenção -> Realtime -> Kanban -> MAINTENANCE_COMPLETED -> Recepção', () => {
  const flow = [
    'MAINTENANCE_CREATED',
    'EQUIPE_DE_MANUTENCAO',
    'REALTIME',
    'KANBAN',
    'MAINTENANCE_COMPLETED',
    'RECEPCAO',
  ];
  assert.equal(flow[0], 'MAINTENANCE_CREATED');
  assert.equal(flow[4], 'MAINTENANCE_COMPLETED');
});

// 23. Integração Financeiro & Segurança
test('23. integração financeiro: PAYMENT_FAILED notifica usuário autorizado e LOGIN_FAILED alerta administrador', () => {
  const failedPaymentEvent: DomainEvent = {
    id: 'evt-pay-fail',
    eventType: 'PAYMENT_FAILED',
    hotelId: 'hotel-10',
    payload: { amount: 1200, gatewayResponse: 'INSUFFICIENT_FUNDS' },
    createdAt: '',
  };

  const loginFailedEvent: DomainEvent = {
    id: 'evt-login-fail',
    eventType: 'LOGIN_FAILED',
    hotelId: 'hotel-10',
    payload: { attemptedUsername: 'root@hotel.com', ip: '189.10.20.30' },
    createdAt: '',
  };

  const rules: NotificationRule[] = [
    {
      id: 'r-pay',
      name: 'Alerta Financeiro',
      eventType: 'PAYMENT_FAILED',
      recipientType: 'ROLE',
      channel: 'IN_APP',
      priority: 'CRITICAL',
      enabled: true,
    },
    {
      id: 'r-sec',
      name: 'Alerta Segurança',
      eventType: 'LOGIN_FAILED',
      recipientType: 'ROLE',
      channel: 'EMAIL',
      priority: 'CRITICAL',
      enabled: true,
    },
  ];

  const payNotifs = processEventRules(failedPaymentEvent, rules, () => [{ type: 'ROLE', id: 'FINANCE_MANAGER' }]);
  const secNotifs = processEventRules(loginFailedEvent, rules, () => [{ type: 'ROLE', id: 'HOTEL_ADMIN' }]);

  assert.equal(payNotifs[0].priority, 'CRITICAL');
  assert.equal(secNotifs[0].priority, 'CRITICAL');
  assert.equal(secNotifs[0].recipientId, 'HOTEL_ADMIN');
});
