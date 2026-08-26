import {
  maskAuditPayload,
  type ApprovalRequest,
  type AuditLogEntry,
  type ErrorLogEntry,
  type ManagedDevice,
  type UserSession,
} from '../domain/governanceCore';

export interface SystemHealthStatus {
  liveness: 'UP' | 'DOWN';
  readiness: 'READY' | 'NOT_READY';
  checks: {
    api: boolean;
    database: boolean;
    realtime: boolean;
    storage: boolean;
    backup: boolean;
  };
}

export interface SecurityDashboardSummary {
  loginFailures: number;
  activeSessions: number;
  blockedDevices: number;
  criticalErrors: number;
  backupStatus: 'HEALTHY' | 'WARNING' | 'FAILED';
  integrationStatus: 'ONLINE' | 'DEGRADED';
}

/**
 * Registra entrada de auditoria com mascaramento automático
 */
export function createAuditRecord(input: {
  hotelId: string;
  userId?: string | null;
  action: AuditLogEntry['action'];
  entityType?: string | null;
  entityId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  requestId?: string;
  correlationId?: string | null;
}): AuditLogEntry {
  if (!input.hotelId) throw new Error('HOTEL_ID_REQUIRED');
  if (!input.action) throw new Error('ACTION_REQUIRED');

  return {
    id: `audit-${crypto.randomUUID()}`,
    hotelId: input.hotelId,
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    beforeData: input.beforeData ? maskAuditPayload(input.beforeData) : null,
    afterData: input.afterData ? maskAuditPayload(input.afterData) : null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    deviceId: input.deviceId ?? null,
    requestId: input.requestId ?? `req-${crypto.randomUUID()}`,
    correlationId: input.correlationId ?? null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Registra log de erro sem expor stack traces sensíveis para clientes
 */
export function createErrorLog(input: {
  hotelId?: string | null;
  userId?: string | null;
  severity: ErrorLogEntry['severity'];
  message: string;
  stack?: string | null;
  endpoint?: string | null;
  requestId?: string;
}): { log: ErrorLogEntry; userMessage: string } {
  const reqId = input.requestId ?? `req-${crypto.randomUUID()}`;

  const log: ErrorLogEntry = {
    id: `err-${crypto.randomUUID()}`,
    hotelId: input.hotelId ?? null,
    userId: input.userId ?? null,
    requestId: reqId,
    severity: input.severity,
    message: input.message,
    stack: input.stack ?? null,
    endpoint: input.endpoint ?? null,
    createdAt: new Date().toISOString(),
  };

  const userMessage = `Não foi possível concluir a operação solicitada. Código de rastreamento: ${reqId}`;

  return { log, userMessage };
}

/**
 * Revogação de sessão de usuário
 */
export function revokeSession(session: UserSession, revokedBy: string): UserSession {
  if (session.revokedAt) {
    throw new Error('SESSION_ALREADY_REVOKED');
  }
  return {
    ...session,
    revokedAt: new Date().toISOString(),
  };
}

/**
 * Bloqueio de dispositivo
 */
export function updateDeviceStatus(
  device: ManagedDevice,
  newStatus: ManagedDevice['status']
): ManagedDevice {
  return {
    ...device,
    status: newStatus,
  };
}

/**
 * Cria solicitação de aprovação para ações de risco
 */
export function requestCriticalApproval(input: {
  hotelId: string;
  action: ApprovalRequest['action'];
  entityType: string;
  entityId: string;
  requestedBy: string;
  reason: string;
}): ApprovalRequest {
  if (!input.reason || input.reason.trim().length === 0) {
    throw new Error('APPROVAL_REASON_REQUIRED');
  }

  return {
    id: `appr-${crypto.randomUUID()}`,
    hotelId: input.hotelId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    requestedBy: input.requestedBy,
    requestedAt: new Date().toISOString(),
    reason: input.reason.trim(),
    status: 'PENDING',
  };
}

/**
 * Resolve solicitação de aprovação
 */
export function resolveApproval(
  request: ApprovalRequest,
  decision: 'APPROVED' | 'REJECTED',
  approvedBy: string
): ApprovalRequest {
  if (request.status !== 'PENDING') {
    throw new Error('APPROVAL_REQUEST_ALREADY_RESOLVED');
  }
  return {
    ...request,
    status: decision,
    approvedBy,
    approvedAt: new Date().toISOString(),
  };
}

/**
 * Validador de Health Check com segregação de Liveness e Readiness
 */
export function evaluateSystemHealth(checks: {
  api: boolean;
  database: boolean;
  realtime: boolean;
  storage: boolean;
  backup: boolean;
}): SystemHealthStatus {
  // Liveness: se a API e o banco de dados básico estão respondendo
  const isAlive = checks.api && checks.database;
  // Readiness: se todos os componentes essenciais estão prontos para receber tráfego
  const isReady = checks.api && checks.database && checks.realtime && checks.storage;

  return {
    liveness: isAlive ? 'UP' : 'DOWN',
    readiness: isReady ? 'READY' : 'NOT_READY',
    checks,
  };
}
