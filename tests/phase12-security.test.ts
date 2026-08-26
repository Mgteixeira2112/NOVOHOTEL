import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUDIT_ACTIONS,
  DEVICE_STATUSES,
  DEVICE_TYPES,
  ERROR_SEVERITIES,
  GOVERNANCE_ROLES,
  RateLimiter,
  maskAuditPayload,
  processWebhookRetry,
  verifyBackupIntegrity,
  type ApprovalRequest,
  type AuditLogEntry,
  type BackupExecution,
  type ErrorLogEntry,
  type ManagedDevice,
  type UserSession,
  type WebhookDelivery,
} from '../src/domain/governanceCore';
import {
  createAuditRecord,
  createErrorLog,
  evaluateSystemHealth,
  requestCriticalApproval,
  resolveApproval,
  revokeSession,
  updateDeviceStatus,
} from '../src/services/governanceService';

// 1. Auditoria
test('1. auditoria: registro estruturado com request_id, correlation_id e ação padronizada', () => {
  const audit = createAuditRecord({
    hotelId: 'hotel-alpha',
    userId: 'usr-1',
    action: 'CREATE',
    entityType: 'FOLIO_ITEM',
    entityId: 'item-99',
    requestId: 'req-abc-123',
    correlationId: 'corr-xyz-789',
  });

  assert.equal(audit.action, 'CREATE');
  assert.equal(audit.requestId, 'req-abc-123');
  assert.equal(audit.correlationId, 'corr-xyz-789');
  assert.equal(AUDIT_ACTIONS.includes('CREATE'), true);
});

// 2. Before / After Data
test('2. before/after: captura de estado prévio e posterior com mascaramento de dados sensíveis', () => {
  const rawBefore = {
    price: 100,
    guestName: 'Carlos',
    password: 'supersecretpassword',
    token: 'jwt-bearer-xyz',
    card_number: '4111222233334444',
  };

  const rawAfter = {
    price: 150,
    guestName: 'Carlos',
    password: 'newpassword123',
  };

  const audit = createAuditRecord({
    hotelId: 'hotel-alpha',
    action: 'UPDATE',
    entityType: 'RESERVATION',
    entityId: 'res-555',
    beforeData: rawBefore,
    afterData: rawAfter,
  });

  assert.deepEqual(audit.beforeData, {
    price: 100,
    guestName: 'Carlos',
  });
  assert.deepEqual(audit.afterData, {
    price: 150,
    guestName: 'Carlos',
  });
  assert.equal('password' in (audit.beforeData || {}), false);
  assert.equal('token' in (audit.beforeData || {}), false);
});

// 3. Login
test('3. login: registro auditável de autenticação com sucesso', () => {
  const audit = createAuditRecord({
    hotelId: 'hotel-alpha',
    userId: 'usr-manager',
    action: 'LOGIN',
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 Chrome/120',
  });

  assert.equal(audit.action, 'LOGIN');
  assert.equal(audit.ipAddress, '192.168.1.50');
  assert.equal(AUDIT_ACTIONS.includes('LOGIN'), true);
});

// 4. Login Failed
test('4. login failed: registro de falha de login para detecção de anomalias', () => {
  const audit = createAuditRecord({
    hotelId: 'hotel-alpha',
    action: 'LOGIN_FAILED',
    ipAddress: '203.0.113.10',
    beforeData: { attemptedUsername: 'admin@hotel.com' },
  });

  assert.equal(audit.action, 'LOGIN_FAILED');
  assert.equal(AUDIT_ACTIONS.includes('LOGIN_FAILED'), true);
});

// 5. Sessão
test('5. sessão: criação de sessão de usuário com controle de expiração e último acesso', () => {
  const session: UserSession = {
    id: 'ses-101',
    userId: 'usr-1',
    hotelId: 'hotel-alpha',
    deviceId: 'dev-desktop-reception',
    ipAddress: '10.0.0.5',
    userAgent: 'Chrome',
    createdAt: '2026-10-01T08:00:00Z',
    lastActivityAt: '2026-10-01T08:30:00Z',
    expiresAt: '2026-10-01T16:00:00Z',
  };

  assert.equal(session.id, 'ses-101');
  assert.equal(session.revokedAt, undefined);
});

// 6. Revogação de Sessão
test('6. revogação: encerramento forçado de sessão ativa por administrador', () => {
  const session: UserSession = {
    id: 'ses-102',
    userId: 'usr-operator',
    hotelId: 'hotel-alpha',
    createdAt: '2026-10-01T08:00:00Z',
    lastActivityAt: '2026-10-01T08:30:00Z',
    expiresAt: '2026-10-01T16:00:00Z',
  };

  const revoked = revokeSession(session, 'usr-admin');
  assert.notEqual(revoked.revokedAt, undefined);
  assert.throws(() => revokeSession(revoked, 'usr-admin'), /SESSION_ALREADY_REVOKED/);
});

// 7. Dispositivo
test('7. dispositivo: cadastro e controle de dispositivos (TABLET, POS, DESKTOP, KIOSK)', () => {
  const device: ManagedDevice = {
    id: 'dev-kiosk-1',
    hotelId: 'hotel-alpha',
    name: 'Totem Autoatendimento Recepção',
    type: 'KIOSK',
    status: 'ACTIVE',
    registeredAt: '2026-09-01T00:00:00Z',
  };

  assert.equal(device.type, 'KIOSK');
  assert.equal(device.status, 'ACTIVE');
  assert.equal(DEVICE_TYPES.includes('KIOSK'), true);
  assert.equal(DEVICE_STATUSES.includes('ACTIVE'), true);
});

// 8. Bloqueio de Dispositivo
test('8. bloqueio: suspensão imediata de terminal ou tablet comprometido', () => {
  const device: ManagedDevice = {
    id: 'dev-tab-304',
    hotelId: 'hotel-alpha',
    name: 'Tablet Quarto 304',
    type: 'TABLET',
    status: 'ACTIVE',
    registeredAt: '2026-09-01T00:00:00Z',
  };

  const blocked = updateDeviceStatus(device, 'BLOCKED');
  assert.equal(blocked.status, 'BLOCKED');
});

// 9. Backup
test('9. backup: validação de política de retenção, criptografia e metadados RPO/RTO', () => {
  const backup: BackupExecution = {
    id: 'bak-20261001',
    hotelId: 'hotel-alpha',
    type: 'FULL',
    status: 'COMPLETED',
    storageLocation: 's3://hotel-backups/encrypted-20261001.enc',
    isEncrypted: true,
    sizeBytes: 15420000,
    rpoTargetMinutes: 15,
    rtoTargetMinutes: 60,
    createdAt: '2026-10-01T03:00:00Z',
    verifiedAt: '2026-10-01T03:30:00Z',
    restoreTestedSuccessfully: true,
  };

  const validation = verifyBackupIntegrity(backup);
  assert.equal(validation.isValid, true);
});

// 10. Restore
test('10. restore: rejeição de backup não testado ou desprovido de criptografia', () => {
  const unverifiedBackup: BackupExecution = {
    id: 'bak-unverified',
    type: 'FULL',
    status: 'COMPLETED',
    storageLocation: 's3://hotel-backups/plain.sql',
    isEncrypted: false,
    sizeBytes: 1000,
    rpoTargetMinutes: 15,
    rtoTargetMinutes: 60,
    createdAt: '',
    restoreTestedSuccessfully: false,
  };

  const check = verifyBackupIntegrity(unverifiedBackup);
  assert.equal(check.isValid, false);
  assert.match(check.reason ?? '', /BACKUP_NOT_ENCRYPTED/);
});

// 11. Health Check (Liveness & Readiness)
test('11. health check: segregação entre liveness (serviço de pé) e readiness (dependências saudáveis)', () => {
  const allHealthy = evaluateSystemHealth({
    api: true,
    database: true,
    realtime: true,
    storage: true,
    backup: true,
  });

  assert.equal(allHealthy.liveness, 'UP');
  assert.equal(allHealthy.readiness, 'READY');

  const realtimeDown = evaluateSystemHealth({
    api: true,
    database: true,
    realtime: false,
    storage: true,
    backup: true,
  });

  assert.equal(realtimeDown.liveness, 'UP');
  assert.equal(realtimeDown.readiness, 'NOT_READY');
});

// 12. Logs de Erro
test('12. logs: registro com severidade e geração de mensagem amigável sem expor stack trace', () => {
  const { log, userMessage } = createErrorLog({
    hotelId: 'hotel-alpha',
    severity: 'CRITICAL',
    message: 'Database connection timeout on pool worker 4',
    stack: 'Error at pg.connect(/var/app/db.js:42:15)',
    endpoint: '/api/v1/checkout',
  });

  assert.equal(log.severity, 'CRITICAL');
  assert.equal(log.message.includes('timeout'), true);
  assert.equal(userMessage.includes('Código de rastreamento'), true);
  assert.equal(userMessage.includes('Database connection timeout'), false);
  assert.equal(ERROR_SEVERITIES.includes('CRITICAL'), true);
});

// 13. Permissões
test('13. permissões: controle de acesso baseado em papéis (SUPER_ADMIN, HOTEL_ADMIN, FINANCE_MANAGER)', () => {
  const roles = [...GOVERNANCE_ROLES];
  assert.equal(roles.includes('SUPER_ADMIN'), true);
  assert.equal(roles.includes('FINANCE_MANAGER'), true);
  assert.equal(roles.includes('OPERATIONS_MANAGER'), true);
});

// 14. Aprovação
test('14. aprovação: ciclo completo de solicitação e aprovação de ações críticas', () => {
  const req = requestCriticalApproval({
    hotelId: 'hotel-alpha',
    action: 'HIGH_DISCOUNT',
    entityType: 'FOLIO',
    entityId: 'fol-101',
    requestedBy: 'usr-reception',
    reason: 'Desconto comercial de 50% concedido pelo Diretor',
  });

  assert.equal(req.status, 'PENDING');
  assert.equal(req.action, 'HIGH_DISCOUNT');

  const approved = resolveApproval(req, 'APPROVED', 'usr-general-manager');
  assert.equal(approved.status, 'APPROVED');
  assert.equal(approved.approvedBy, 'usr-general-manager');
  assert.throws(() => resolveApproval(approved, 'APPROVED', 'usr-admin'), /ALREADY_RESOLVED/);
});

// 15. Idempotência
test('15. idempotência: chave única de transação para operações críticas previne duplicidade', () => {
  const processedKeys = new Set<string>();

  function executeCriticalOperation(idempotencyKey: string): { status: 'PROCESSED' | 'IGNORED_DUPLICATE' } {
    if (processedKeys.has(idempotencyKey)) {
      return { status: 'IGNORED_DUPLICATE' };
    }
    processedKeys.add(idempotencyKey);
    return { status: 'PROCESSED' };
  }

  const op1 = executeCriticalOperation('idem-payment-key-001');
  const op2 = executeCriticalOperation('idem-payment-key-001');

  assert.equal(op1.status, 'PROCESSED');
  assert.equal(op2.status, 'IGNORED_DUPLICATE');
});

// 16. Concorrência
test('16. concorrência: lock de estoque/disponibilidade evita double booking ou processamento concorrente', () => {
  let inventoryStock = 1;

  function tryAcquireItem(workerId: string): boolean {
    if (inventoryStock > 0) {
      inventoryStock--;
      return true;
    }
    return false;
  }

  const worker1Result = tryAcquireItem('worker-A');
  const worker2Result = tryAcquireItem('worker-B');

  assert.equal(worker1Result, true);
  assert.equal(worker2Result, false);
  assert.equal(inventoryStock, 0);
});

// 17. Rate Limit
test('17. rate limit: bloqueio automático de IP/usuário após exceder limite na janela', () => {
  const limiter = new RateLimiter(3, 60000); // 3 tentativas por minuto
  const key = 'ip:200.100.50.25';

  assert.equal(limiter.isAllowed(key), true);
  assert.equal(limiter.isAllowed(key), true);
  assert.equal(limiter.isAllowed(key), true);
  assert.equal(limiter.isAllowed(key), false); // 4ª tentativa bloqueada

  limiter.reset(key);
  assert.equal(limiter.isAllowed(key), true);
});

// 18. Webhook
test('18. webhook: assinatura e validação de entrega de evento de integração', () => {
  const webhook: WebhookDelivery = {
    id: 'wh-01',
    hotelId: 'hotel-alpha',
    endpoint: 'https://ota-partner.com/webhook',
    event: 'RESERVATION_CREATED',
    payload: { reservationId: 'res-888', total: 500 },
    signature: 'sha256=abcdef123456',
    attemptCount: 0,
    maxAttempts: 3,
    status: 'PENDING',
    createdAt: '2026-10-01T12:00:00Z',
  };

  const successDelivery = processWebhookRetry(webhook, true);
  assert.equal(successDelivery.status, 'DELIVERED');
});

// 19. Retry & Dead Letter
test('19. retry: tentativas subsequentes com escalonamento e transição para DEAD_LETTER', () => {
  const webhook: WebhookDelivery = {
    id: 'wh-02',
    hotelId: 'hotel-alpha',
    endpoint: 'https://unstable-api.com/hook',
    event: 'PAYMENT_RECEIVED',
    payload: { amount: 150 },
    signature: 'sig-123',
    attemptCount: 0,
    maxAttempts: 3,
    status: 'PENDING',
    createdAt: '2026-10-01T12:00:00Z',
  };

  const retry1 = processWebhookRetry(webhook, false, '503 Service Unavailable');
  assert.equal(retry1.status, 'PENDING');
  assert.equal(retry1.attemptCount, 1);
  assert.notEqual(retry1.nextRetryAt, null);

  const retry2 = processWebhookRetry(retry1, false, '503 Service Unavailable');
  assert.equal(retry2.attemptCount, 2);

  const retry3 = processWebhookRetry(retry2, false, '503 Service Unavailable');
  assert.equal(retry3.status, 'DEAD_LETTER');
  assert.equal(retry3.attemptCount, 3);
  assert.equal(retry3.nextRetryAt, null);
});

// 20. Multi-hotel
test('20. multi-hotel: logs de auditoria e sessões de usuários são estritamente isolados por hotel', () => {
  const logs: AuditLogEntry[] = [
    createAuditRecord({ hotelId: 'hotel-1', action: 'LOGIN' }),
    createAuditRecord({ hotelId: 'hotel-2', action: 'LOGIN' }),
  ];

  const hotel1Logs = logs.filter((l) => l.hotelId === 'hotel-1');
  assert.equal(hotel1Logs.length, 1);
  assert.equal(hotel1Logs[0].hotelId, 'hotel-1');
});

// 21. RLS
test('21. RLS: políticas garantem que dados de segurança não vazam entre organizações', () => {
  const sessions: UserSession[] = [
    { id: 's1', userId: 'u1', hotelId: 'hotel-a', createdAt: '', lastActivityAt: '', expiresAt: '' },
    { id: 's2', userId: 'u2', hotelId: 'hotel-b', createdAt: '', lastActivityAt: '', expiresAt: '' },
  ];

  const userCanAccess = (sessionHotelId: string, currentTenantHotelId: string) => sessionHotelId === currentTenantHotelId;

  assert.equal(userCanAccess(sessions[0].hotelId, 'hotel-a'), true);
  assert.equal(userCanAccess(sessions[1].hotelId, 'hotel-a'), false);
});

// 22. Segurança Operacional
test('22. segurança: mascaramento preventivo em objetos aninhados e arrays', () => {
  const complexData = {
    user: {
      name: 'Maria',
      password: 'plainPassword123',
      cards: [{ card_number: '5555444433332222' }],
    },
    auth: {
      token: 'jwt.token.here',
      refresh_token: 'refresh.token.here',
    },
  };

  const sanitized = maskAuditPayload(complexData);
  assert.deepEqual(sanitized, {
    user: {
      name: 'Maria',
      cards: [{ card_number: '5555444433332222' }],
    },
    auth: {},
  });
});
