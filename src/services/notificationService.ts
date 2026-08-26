import type {
  HotelOsEvent,
  HotelOsNotificationChannel,
  HotelOsNotificationPriority,
} from '../core/events/eventTypes';
import { eventMatchesCondition, type NotificationRuleDefinition } from '../core/events/eventPolicy';

export interface NotificationRecipient {
  type: NotificationRuleDefinition['recipientType'];
  id: string | null;
}

export interface NotificationDraft {
  eventId: string;
  organizationId: string | null;
  hotelId: string | null;
  recipient: NotificationRecipient;
  channel: HotelOsNotificationChannel;
  priority: HotelOsNotificationPriority;
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export class NotificationService {
  buildDrafts(
    event: HotelOsEvent,
    rules: NotificationRuleDefinition[],
    resolveRecipients: (rule: NotificationRuleDefinition, event: HotelOsEvent) => NotificationRecipient[],
  ): NotificationDraft[] {
    return rules
      .filter((rule) => rule.eventType === event.eventType && eventMatchesCondition(event, rule.condition))
      .flatMap((rule) =>
        resolveRecipients(rule, event).map((recipient) => ({
          eventId: event.id,
          organizationId: event.organizationId,
          hotelId: event.hotelId,
          recipient,
          channel: rule.channel,
          priority: rule.priority,
          title: event.eventType,
          body: `${event.eventType} ocorreu${event.entityId ? ` para ${event.entityType ?? 'entidade'} ${event.entityId}` : ''}.`,
          data: event.payload,
        })),
      );
  }

  shouldSuppressForQuietHours(
    priority: HotelOsNotificationPriority,
    now: Date,
    start: string | null,
    end: string | null,
  ): boolean {
    if (priority === 'CRITICAL' || !start || !end) return false;
    const current = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return startMinutes <= endMinutes
      ? current >= startMinutes && current < endMinutes
      : current >= startMinutes || current < endMinutes;
  }
}

export const notificationService = new NotificationService();
