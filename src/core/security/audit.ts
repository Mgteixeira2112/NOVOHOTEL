import { supabase } from '../../services/supabase';
import { redact } from './redaction';
import { createRequestContext, type RequestContext } from './requestContext';

export type AuditAction = 'CREATE'|'READ'|'UPDATE'|'DELETE'|'LOGIN'|'LOGOUT'|'LOGIN_FAILED'|'PASSWORD_RESET'|'MFA'|'SESSION_EXPIRED'|'APPROVE'|'REJECT'|'VOID'|'REFUND'|'CANCEL'|'PAY'|'RECEIVE'|'CLOSE'|'OPEN'|'EXPORT'|'IMPORT';

export async function recordAudit(input: {
  action: AuditAction;
  hotelId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  context?: RequestContext;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const context = input.context ?? createRequestContext(undefined, input.deviceId ?? undefined);
  const { data, error } = await supabase.rpc('hotel_os_audit_secure', {
    p_action: input.action,
    p_hotel_id: input.hotelId ?? null,
    p_entity_type: input.entityType ?? null,
    p_entity_id: input.entityId ?? null,
    p_before_data: redact(input.beforeData ?? {}),
    p_after_data: redact(input.afterData ?? {}),
    p_request_id: context.requestId,
    p_correlation_id: context.correlationId ?? null,
    p_device_id: input.deviceId ?? context.deviceId ?? null,
    p_ip_address: input.ipAddress ?? null,
    p_user_agent: input.userAgent ?? null,
  });
  if (error) throw error;
  return String(data);
}
