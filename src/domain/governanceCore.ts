export const AUDIT_ACTIONS = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_RESET',
  'MFA',
  'SESSION_EXPIRED',
  'APPROVE',
  'REJECT',
  'VOID',
  'REFUND',
  'CANCEL',
  'PAY',
  'RECEIVE',
  'CLOSE',
  'OPEN',
  'EXPORT',
  'IMPORT',
] as const;
export type AuditAction = typeof AUDIT_ACTIONS[number];

export const DEVICE_TYPES = ['TABLET', 'POS', 'DESKTOP', 'MOBILE', 'KIOSK', 'OTHER'] as const;
export type DeviceType = typeof DEVICE_TYPES[number];

export const DEVICE_STATUSES = ['ACTIVE', 'BLOCKED', 'REVOKED', 'MAINTENANCE'] as const;
export type DeviceStatus = typeof DEVICE_STATUSES[number];

export const ERROR_SEVERITIES = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;
export type ErrorSeverity = typeof ERROR_SEVERITIES[number];

export const GOVERNANCE_ROLES = [
  'SUPER_ADMIN',
  'HOTEL_ADMIN',
  'FINANCE_MANAGER',
  'OPERATIONS_MANAGER',
] as const;
export type GovernanceRole = typeof GOVERNANCE_ROLES[number];

export interface AuditLogEntry {
  id: string;
  hotelId: string;
  userId?: string | null;
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  requestId: string;
  correlationId?: string | null;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  hotelId: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt?: string | null;
}

export interface ManagedDevice {
  id: string;
  hotelId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  tokenHash?: string | null;
  registeredAt: string;
  lastSeenAt?: string | null;
}

export interface ErrorLogEntry {
  id: string;
  hotelId?: string | null;
  userId?: string | null;
  requestId: string;
  severity: ErrorSeverity;
  message: string;
  stack?: string | null;
  endpoint?: string | null;
  createdAt: string;
}

export interface BackupExecution {
  id: string;
  hotelId?: string | null;
  type: 'FULL' | 'INCREMENTAL';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  storageLocation: string;
  isEncrypted: boolean;
  sizeBytes: number;
  rpoTargetMinutes: number;
  rtoTargetMinutes: number;
  createdAt: string;
  verifiedAt?: string | null;
  restoreTestedSuccessfully?: boolean | null;
}

export interface WebhookDelivery {
  id: string;
  hotelId: string;
  endpoint: string;
  event: string;
  payload: Record<string, unknown>;
  signature: string;
  attemptCount: number;
  maxAttempts: number;
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'DEAD_LETTER';
  lastError?: string | null;
  createdAt: string;
  nextRetryAt?: string | null;
}

export interface ApprovalRequest {
  id: string;
  hotelId: string;
  action: 'HIGH_DISCOUNT' | 'REFUND' | 'CANCELLATION' | 'RATE_CHANGE' | 'CRITICAL_FINANCE';
  entityType: string;
  entityId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Sanitiza dados de auditoria e logs para evitar vazamento de credenciais e PCI
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'senha',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'cvv',
  'cvc',
  'card_number',
  'numero_cartao',
  'api_key',
  'authorization',
]);

export function maskAuditPayload<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      continue; // Remove chave sensível
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = maskAuditPayload(value as Record<string, unknown>);
    } else if (typeof value === 'string' && /^\d{13,19}$/.test(value.replace(/\s+/g, ''))) {
      // Mascara cartões de crédito que possam estar em campos sem nome óbvio
      const clean = value.replace(/\s+/g, '');
      sanitized[key] = `****-****-****-${clean.slice(-4)}`;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Limitador de taxa em memória para brute-force e throttling
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 5,
    private windowMs: number = 60000
  ) {}

  public isAllowed(key: string, now: number = Date.now()): boolean {
    const timestamps = this.requests.get(key) || [];
    const valid = timestamps.filter((t) => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      this.requests.set(key, valid);
      return false;
    }

    valid.push(now);
    this.requests.set(key, valid);
    return true;
  }

  public reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Mecanismo de Retry e Dead Letter para Webhooks / Eventos
 */
export function processWebhookRetry(webhook: WebhookDelivery, isSuccess: boolean, errorMessage?: string): WebhookDelivery {
  if (isSuccess) {
    return {
      ...webhook,
      status: 'DELIVERED',
      lastError: null,
    };
  }

  const newAttempts = webhook.attemptCount + 1;
  if (newAttempts >= webhook.maxAttempts) {
    return {
      ...webhook,
      attemptCount: newAttempts,
      status: 'DEAD_LETTER',
      lastError: errorMessage || 'Exceeded max retry attempts',
      nextRetryAt: null,
    };
  }

  // Backoff exponencial simples (ex: 2s, 4s, 8s)
  const backoffMs = Math.pow(2, newAttempts) * 1000;
  const nextRetry = new Date(Date.now() + backoffMs).toISOString();

  return {
    ...webhook,
    attemptCount: newAttempts,
    status: 'PENDING',
    lastError: errorMessage || 'Temporary failure',
    nextRetryAt: nextRetry,
  };
}

/**
 * Validação de integridade de Backup
 */
export function verifyBackupIntegrity(backup: BackupExecution): { isValid: boolean; reason?: string } {
  if (!backup.isEncrypted) {
    return { isValid: false, reason: 'BACKUP_NOT_ENCRYPTED' };
  }
  if (backup.sizeBytes <= 0) {
    return { isValid: false, reason: 'EMPTY_BACKUP_PAYLOAD' };
  }
  if (!backup.restoreTestedSuccessfully) {
    return { isValid: false, reason: 'RESTORE_TEST_FAILED_OR_NOT_PERFORMED' };
  }
  return { isValid: true };
}
