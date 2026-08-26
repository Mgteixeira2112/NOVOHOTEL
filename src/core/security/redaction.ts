const SENSITIVE_KEYS = new Set([
  'password','senha','token','access_token','refresh_token','secret','api_key',
  'service_role_key','card_number','numero_cartao','cvv','cvc'
]);

export function redact<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => redact(item)) as T;
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    output[key] = redact(child);
  }
  return output as T;
}
