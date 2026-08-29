import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modal = readFileSync('src/components/admin/UserProfileModal.tsx', 'utf8');

test('modal de perfil é portado para document.body e não fica preso ao header sticky', () => {
  assert.match(modal, /createPortal\(modal, document\.body\)/);
  assert.match(modal, /z-\[1000\]/);
});

test('modal respeita a viewport e mantém corpo rolável', () => {
  assert.match(modal, /max-h-\[calc\(100dvh-1\.5rem\)\]/);
  assert.match(modal, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(modal, /document\.body\.style\.overflow = 'hidden'/);
});

test('modal pode ser fechado por botão, ESC e clique no fundo', () => {
  assert.match(modal, /event\.key === 'Escape'/);
  assert.match(modal, /if \(event\.target === event\.currentTarget\) onClose\(\)/);
  assert.match(modal, /aria-label="Fechar perfil"/);
});

test('campos acompanham o usuário operacional atual', () => {
  assert.match(modal, /\[isOpen, currentUser\?\.id\]/);
  assert.match(modal, /setNome\(currentUser\.nome/);
  assert.match(modal, /setTelefone\(currentUser\.telefone/);
});
