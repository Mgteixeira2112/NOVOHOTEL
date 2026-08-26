import type {
  HotelOsEvent,
  HotelOsEventType,
  HotelOsNotificationChannel,
  HotelOsNotificationPriority,
} from './eventTypes';

export type EventStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';

export interface EventProcessingPolicy {
  maxRetries: number;
  retryDelayMs: number;
}

export const DEFAULT_EVENT_PROCESSING_POLICY: EventProcessingPolicy = {
  maxRetries: 5,
  retryDelayMs: 2_000,
};

export const SECURITY_CRITICAL_EVENTS = new Set<HotelOsEventType>([
  'LOGIN_FAILED',
  'PAYMENT_FAILED',
]);

export const isCriticalEvent = (eventType: string) => SECURITY_CRITICAL_EVENTS.has(eventType as HotelOsEventType);

export const canRetryEvent = (retryCount: number, policy = DEFAULT_EVENT_PROCESSING_POLICY) =>
  retryCount < policy.maxRetries;

export const nextEventStatus = (retryCount: number, policy = DEFAULT_EVENT_PROCESSING_POLICY): EventStatus =>
  canRetryEvent(retryCount, policy) ? 'FAILED' : 'DEAD_LETTER';

export interface RealtimeChannelContext {
  userId: string;
  organizationId: string | null;
  hotelId: string | null;
  permission: string;
}

export const isAuthorizedForEvent = (
  context: RealtimeChannelContext,
  event: Pick<HotelOsEvent, 'organizationId' | 'hotelId'>,
): boolean => {
  if (event.hotelId && context.hotelId !== event.hotelId) return false;
  if (event.organizationId && context.organizationId !== event.organizationId) return false;
  return true;
};

export interface NotificationRuleDefinition {
  eventType: string;
  condition?: Record<string, unknown>;
  recipientType: 'USER' | 'ROLE' | 'DEPARTMENT' | 'HOTEL' | 'ROOM' | 'DEVICE' | 'POS';
  recipientConfig?: Record<string, unknown>;
  channel: HotelOsNotificationChannel;
  priority: HotelOsNotificationPriority;
}

export const eventMatchesCondition = (
  event: Pick<HotelOsEvent, 'payload'>,
  condition: Record<string, unknown> = {},
): boolean => Object.entries(condition).every(([key, expected]) => event.payload[key] === expected);
