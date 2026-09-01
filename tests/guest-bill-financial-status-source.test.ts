import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/components/admin/GuestBillModal.tsx', 'utf8');

test('GuestBillModal não infere quitação pelo status da reserva', () => {
  assert.doesNotMatch(source, /const isPaid = reserva\.status/);
  assert.doesNotMatch(source, /CONCILIADO \/ PAGO/);
  assert.doesNotMatch(source, /Pagamento Aprovado & Conciliado no PMS/);
  assert.doesNotMatch(source, /QUITADA \/ LIQUIDADA/);
});

test('GuestBillModal expõe estado financeiro neutro até existir vínculo canônico com Folio', () => {
  assert.match(source, /SITUAÇÃO FINANCEIRA NÃO CERTIFICADA/);
  assert.match(source, /consulte o Folio oficial/);
  assert.match(source, /NÃO CERTIFICADA/);
});
