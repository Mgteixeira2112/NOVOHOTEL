import test from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../src/core/security/redaction';
import { createRequestContext } from '../src/core/security/requestContext';
import { userFacingError } from '../src/core/security/safeError';

test('redaction removes credentials and card data', () => {
  const result = redact({ password: 'x', token: 'y', card_number: '4111', nested: { secret: 'z', ok: true } });
  assert.deepEqual(result, { nested: { ok: true } });
});

test('request context creates unique request id', () => {
  const a = createRequestContext();
  const b = createRequestContext(a.requestId);
  assert.notEqual(a.requestId, b.requestId);
  assert.equal(b.correlationId, a.requestId);
});

test('safe error never exposes internal message', () => {
  const message = userFacingError(new Error('SQL password=secret stack trace'), 'request-123');
  assert.equal(message, 'Não foi possível concluir a operação. Código: request-123');
  assert.equal(message.includes('SQL'), false);
});
