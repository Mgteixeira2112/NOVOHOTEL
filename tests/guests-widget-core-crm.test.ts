import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(path, 'utf8');

test('Widget Hóspedes usa listagem progressiva sem limite fixo de 12 registros', () => {
  const widget = read('src/workspace-engine/widgets/ReceptionGuestStayWidgets.tsx');
  assert.match(widget, /const GUEST_PAGE_SIZE = 12/);
  assert.match(widget, /visibleGuests = filtered\.slice\(0, visibleCount\)/);
  assert.match(widget, /Carregar mais/);
  assert.match(widget, /Exibindo \{Math\.min\(visibleCount, filtered\.length\)\} de \{filtered\.length\}/);
  assert.doesNotMatch(widget, /filtered\.slice\(0, 12\)\.map/);
});

test('Widget Hóspedes possui ficha detalhada e edição pelo mesmo cadastro', () => {
  const widget = read('src/workspace-engine/widgets/ReceptionGuestStayWidgets.tsx');
  assert.match(widget, /Ficha do hóspede/);
  assert.match(widget, /Preferências e observações/);
  assert.match(widget, /Editar hóspede/);
  assert.match(widget, /formFromGuest/);
  assert.match(widget, /receptionGuestStayService\.updateGuest\(editingGuestId, form\)/);
  assert.match(widget, /await syncFromSupabase\(\)/);
});

test('edição de hóspede grava no Supabase antes de sincronizar a tela', () => {
  const service = read('src/modules/recepcao/receptionGuestStayService.ts');
  assert.match(service, /async updateGuest\(guestId: string/);
  assert.match(service, /\.from\('hospedes'\)/);
  assert.match(service, /\.update\(guestPayload\(input\)\)/);
  assert.match(service, /\.eq\('id', guestId\)/);
  assert.match(service, /\.select\('\*'\)/);
  assert.match(service, /\.single\(\)/);
});
