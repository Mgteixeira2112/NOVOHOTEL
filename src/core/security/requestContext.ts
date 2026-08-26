export interface RequestContext {
  requestId: string;
  correlationId?: string;
  deviceId?: string;
}

export function createRequestContext(correlationId?: string, deviceId?: string): RequestContext {
  const requestId = crypto.randomUUID();
  return { requestId, correlationId, deviceId };
}
