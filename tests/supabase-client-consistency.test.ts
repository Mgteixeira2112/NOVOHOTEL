import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const realtimeClient = readFileSync('src/lib/supabase.ts', 'utf8');
const hotelService = readFileSync('src/services/supabase.ts', 'utf8');

const PRIMARY_PROJECT_URL = 'https://awyxubhwtdgwnssvajnr.supabase.co';
const STALE_PROJECT_URL = 'https://kdrptnryuqvksftwuxvv.supabase.co';

test('cliente realtime e serviço principal usam o mesmo projeto Supabase padrão', () => {
  assert.ok(realtimeClient.includes(PRIMARY_PROJECT_URL));
  assert.ok(hotelService.includes(PRIMARY_PROJECT_URL));
  assert.equal(realtimeClient.includes(STALE_PROJECT_URL), false);
});

test('cliente realtime preserva override por variáveis Vite', () => {
  assert.ok(realtimeClient.includes('VITE_SUPABASE_URL'));
  assert.ok(realtimeClient.includes('VITE_SUPABASE_ANON_KEY'));
});
