import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPERATIONAL_SECTORS,
  getOperationalSectorLabel,
  inferOperationalSectorFromRole,
  normalizeOperationalSectorIds,
} from '../src/domain/operationalSectors';

test('catálogo operacional mantém os cinco setores previstos pelo Kanban', () => {
  assert.deepEqual(
    OPERATIONAL_SECTORS.map(sector => sector.id),
    ['operacao', 'governanca', 'recepcao', 'manutencao', 'cozinha'],
  );
});

test('normalização remove duplicados e setores desconhecidos', () => {
  assert.deepEqual(
    normalizeOperationalSectorIds(['governanca', 'governanca', 'invalido', 'recepcao']),
    ['governanca', 'recepcao'],
  );
});

test('perfil pode sugerir setor sem transformar perfil em setor', () => {
  assert.equal(inferOperationalSectorFromRole('governanca'), 'governanca');
  assert.equal(inferOperationalSectorFromRole('recepcionista'), 'recepcao');
  assert.equal(inferOperationalSectorFromRole('cozinha_only'), 'cozinha');
  assert.equal(inferOperationalSectorFromRole('gerente'), null);
  assert.equal(getOperationalSectorLabel('manutencao'), 'Manutenção');
});
