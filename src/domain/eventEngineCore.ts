export const CATALOG_EVENT_TYPES = [
  'RESERVATION_CREATED',
  'RESERVATION_CANCELLED',
  'GUEST_CHECKED_IN',
  'GUEST_CHECKED_OUT',
  'ORDER_CREATED',
  'ORDER_CONFIRMED',
  'ORDER_PREPARING',
  'ORDER_READY',
  'ORDER_DELIVERED',
  'ROOM_DIRTY',
  'ROOM_CLEANING',
  'ROOM_CLEAN',
  'ROOM_INSPECTED',
  'MAINTENANCE_CREATED',
  'MAINTENANCE_STARTED',
  'MAINTENANCE_COMPLETED',
  'MINIBAR_ITEM_ADDED',
  'MINIBAR_REVIEW_REQUIRED',
  'PAYMENT_RECEIVED',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'LOGIN_FAILED',
] as const;
export type CatalogEventType = typeof CATALOG_EVENT_TYPES[number];

export const NOTIFICATION_CHANNELS = [
  'IN_APP',
  'REALTIME',
  'PUSH',
  'EMAIL',
  'SMS',
  'WHATSAPP',
] as const;
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

export const RECIPIENT_TYPES = [
  'USER',
  'ROLE',
  'DEPARTMENT',
  'HOTEL',
  'ROOM',
  'DEVICE',
  'POS',
] as const;
export type RecipientType = typeof RECIPIENT_TYPES[number];

export const NOTIFICATION_PRIORITIES = [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
  'CRITICAL',
] as const;
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[number];

export type EventStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';

export interface DomainEvent<TPayload = Record<string, unknown>> {
  id: string;
  eventType: CatalogEventType | string;
  organizationId?: string | null;
  hotelId: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload: TPayload;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
}

export interface EventLogEntry<TPayload = Record<string, unknown>> {
  id: string;
  eventType: string;
  organizationId?: string | null;
  hotelId: string;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload: TPayload;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  createdAt: string;
  processedAt?: string | null;
  status: EventStatus;
  retryCount: number;
  lastError?: string | null;
}

export interface NotificationRule {
  id: string;
  organizationId?: string | null;
  hotelId?: string | null;
  name: string;
  eventType: string;
  condition?: Record<string, unknown>;
  recipientType: RecipientType;
  recipientConfig?: Record<string, unknown>;
  channel: NotificationChannel;
  priority: NotificationPriority;
  enabled: boolean;
}

export interface NotificationRecord {
  id: string;
  eventId?: string | null;
  organizationId?: string | null;
  hotelId: string;
  recipientType: RecipientType;
  recipientId: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  deliveryStatus: 'PENDING' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELLED';
  readAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  organizationId?: string | null;
  hotelId?: string | null;
  eventType: string;
  channel: NotificationChannel;
  enabled: boolean;
  quietHoursStart?: string | null; // e.g. "22:00"
  quietHoursEnd?: string | null;   // e.g. "07:00"
}

export interface DevicePresenceRecord {
  id: string;
  organizationId?: string | null;
  hotelId: string;
  userId?: string | null;
  deviceId?: string | null;
  presenceType: 'USER' | 'DEVICE' | 'POS' | 'TABLET';
  status: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  metadata?: Record<string, unknown>;
}

export interface OfflineAction {
  id: string;
  deviceId: string;
  hotelId: string;
  actionType: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  clientTimestamp: string;
  version: number;
}

/**
 * 1. Processamento e Avaliação de Condição de Regras
 */
export function evaluateRuleCondition(
  eventPayload: Record<string, unknown>,
  condition?: Record<string, unknown>
): boolean {
  if (!condition || Object.keys(condition).length === 0) return true;
  return Object.entries(condition).every(([k, expected]) => eventPayload[k] === expected);
}

/**
 * 2. Motor de Regras: Avalia evento e gera notificações derivadas
 */
export function processEventRules(
  event: DomainEvent,
  rules: NotificationRule[],
  resolveRecipients: (rule: NotificationRule, event: DomainEvent) => { type: RecipientType; id: string }[]
): NotificationRecord[] {
  const matchingRules = rules.filter(
    (r) =>
      r.enabled &&
      r.eventType === event.eventType &&
      evaluateRuleCondition(event.payload as Record<string, unknown>, r.condition)
  );

  const notifications: NotificationRecord[] = [];
  const now = new Date().toISOString();

  for (const rule of matchingRules) {
    const recipients = resolveRecipients(rule, event);
    for (const rec of recipients) {
      notifications.push({
        id: `notif-${crypto.randomUUID()}`,
        eventId: event.id,
        organizationId: event.organizationId ?? null,
        hotelId: event.hotelId,
        recipientType: rec.type,
        recipientId: rec.id,
        channel: rule.channel,
        priority: rule.priority,
        title: `${event.eventType}`,
        body: `Evento ${event.eventType} registrado para ${event.entityType || 'entidade'} ${event.entityId || ''}`.trim(),
        data: event.payload as Record<string, unknown>,
        deliveryStatus: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return notifications;
}

/**
 * 3. Quiet Hours: Verifica se notificação deve ser silenciada (nunca silencia críticas ou de segurança)
 */
export function isQuietHoursActive(
  currentTimeStr: string, // "HH:MM"
  startStr?: string | null,
  endStr?: string | null,
  priority: NotificationPriority = 'NORMAL',
  isSecurityOrCriticalEvent: boolean = false
): boolean {
  // Notificações CRITICAL ou de segurança nunca são suprimidas
  if (priority === 'CRITICAL' || priority === 'URGENT' || isSecurityOrCriticalEvent) {
    return false;
  }

  if (!startStr || !endStr) return false;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const current = toMinutes(currentTimeStr);
  const start = toMinutes(startStr);
  const end = toMinutes(endStr);

  if (start <= end) {
    return current >= start && current < end;
  }
  // Atravessa a meia-noite (ex: 22:00 às 07:00)
  return current >= start || current < end;
}

/**
 * 4. Máquina de Estados do Event Pipeline (com Retry e Dead Letter)
 */
export function processEventStep(
  eventLog: EventLogEntry,
  isSuccess: boolean,
  errorMessage?: string,
  maxRetries = 3
): EventLogEntry {
  const now = new Date().toISOString();

  if (isSuccess) {
    return {
      ...eventLog,
      status: 'PROCESSED',
      processedAt: now,
      lastError: null,
    };
  }

  const nextRetry = eventLog.retryCount + 1;
  if (nextRetry >= maxRetries) {
    return {
      ...eventLog,
      status: 'DEAD_LETTER',
      retryCount: nextRetry,
      lastError: errorMessage || 'Exceeded max retry limit',
      processedAt: now,
    };
  }

  return {
    ...eventLog,
    status: 'FAILED',
    retryCount: nextRetry,
    lastError: errorMessage || 'Processing failed',
  };
}

/**
 * 5. Reprocessamento de Eventos em Falha ou Dead Letter
 */
export function reprocessEvent(eventLog: EventLogEntry): EventLogEntry {
  if (eventLog.status !== 'FAILED' && eventLog.status !== 'DEAD_LETTER') {
    throw new Error('ONLY_FAILED_OR_DEAD_LETTER_EVENTS_CAN_BE_REPROCESSED');
  }

  return {
    ...eventLog,
    status: 'PROCESSING',
    lastError: null,
  };
}

/**
 * 6. Sincronização Offline e Resolução de Conflitos
 */
export interface SyncResult {
  appliedCount: number;
  conflictCount: number;
  conflicts: { actionId: string; reason: string }[];
  processedKeys: string[];
}

export function synchronizeOfflineQueue(
  incomingActions: OfflineAction[],
  serverStateMap: Map<string, { version: number; data: Record<string, unknown> }>,
  existingIdempotencyKeys: Set<string>
): SyncResult {
  let appliedCount = 0;
  let conflictCount = 0;
  const conflicts: { actionId: string; reason: string }[] = [];
  const processedKeys: string[] = [];

  for (const action of incomingActions) {
    // 1. Idempotência
    if (existingIdempotencyKeys.has(action.idempotencyKey)) {
      // Já foi aplicado, ignorar duplicidade sem erro
      continue;
    }

    // 2. Detecção de conflito de concorrência por versão
    const targetKey = `${action.hotelId}:${action.payload.entityId || action.id}`;
    const serverCurrent = serverStateMap.get(targetKey);

    if (serverCurrent && serverCurrent.version > action.version) {
      conflictCount++;
      conflicts.push({
        actionId: action.id,
        reason: `CONCURRENT_MODIFICATION: Server is on version ${serverCurrent.version}, client action is on version ${action.version}`,
      });
      continue; // Não sobrescreve silenciosamente
    }

    // Aplica com sucesso
    appliedCount++;
    existingIdempotencyKeys.add(action.idempotencyKey);
    processedKeys.push(action.idempotencyKey);
    serverStateMap.set(targetKey, {
      version: (serverCurrent?.version || 0) + 1,
      data: action.payload,
    });
  }

  return {
    appliedCount,
    conflictCount,
    conflicts,
    processedKeys,
  };
}

/**
 * 7. Formatação de Canais Realtime por Hotel
 */
export function formatRealtimeChannel(hotelId: string, scope: 'orders' | 'kanban' | 'rooms' | 'maintenance' | 'notifications'): string {
  if (!hotelId || !hotelId.trim()) throw new Error('HOTEL_ID_REQUIRED');
  return `hotel:${hotelId}:${scope}`;
}
