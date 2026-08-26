import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('client MFA helper has no universal bypass codes or shared secret', () => {
  const source = read('src/utils/securityHelper.ts');
  assert.equal(source.includes('HOTEL_PMS_SECRET_SALT'), false);
  assert.equal(source.includes('backupCodes'), false);
  assert.equal(source.includes("'123456'"), false);
  assert.equal(source.includes("'888888'"), false);
  assert.match(source, /server_mfa_required/);
});

test('service worker does not access browser data stores', () => {
  const source = read('public/sw.js');
  assert.equal(/localStorage|sessionStorage|indexedDB/i.test(source), false);
});

test('validation workflow uses the repository Bun lockfile', () => {
  const workflow = read('.github/workflows/hotel-os-validation.yml');
  assert.match(workflow, /bun install --frozen-lockfile/);
  assert.equal(workflow.includes('npm ci'), false);
});

test('phase 17 database hardening contains append-only audit protection', () => {
  const migration = read('supabase/migrations/20260826170000_phase17_final_hardening.sql');
  assert.match(migration, /hotel_os_audit_log_immutable/);
  assert.match(migration, /AUDIT_LOG_IMMUTABLE/);
  assert.match(migration, /idempotency_key/);
});
