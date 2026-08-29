import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const identity = fs.readFileSync('src/services/hotelIdentityService.ts', 'utf8');
const widget = fs.readFileSync('src/workspace-engine/widgets/FrigobarWidget.tsx', 'utf8');

test('frigobar resolve hotel id pela fonte canônica quando config json não possui id', () => {
  assert.match(identity, /from\('hotel_config'\)/);
  assert.match(identity, /select\('id'\)/);
  assert.match(widget, /hotelIdentityService\.getActiveHotelId\(hotelConfig\.id\)/);
  assert.match(widget, /setHotelId\(id\)/);
  assert.doesNotMatch(widget, /default_hotel/);
  assert.doesNotMatch(widget, /não possui ID Supabase disponível/);
});
