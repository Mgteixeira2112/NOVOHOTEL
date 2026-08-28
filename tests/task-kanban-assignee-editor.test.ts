import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/workspace-engine/widgets/TaskKanbanWidget.tsx', 'utf8');

test('TaskKanbanWidget usa usuários do HotelContext e diretório de setores', () => {
  assert.match(source, /const \{ rooms, users, currentUser \} = useHotel\(\);/);
  assert.match(source, /responsibleSectorMap/);
  assert.match(source, /fetchUserOperationalSectorsState\(user\.id\)/);
  assert.match(source, /responsibleUsers/);
});

test('TaskKanbanWidget persiste responsável em assigned_to', () => {
  assert.match(source, /const assignedPayload = selectedUser \?/);
  assert.match(source, /assigned_to: canAssign\(editingCard\) \? assignedPayload : editingCard\.assigned_to/);
});

test('TaskKanbanWidget mantém os campos do padrão operacional no modal', () => {
  assert.match(source, /Setor \/ Departamento/);
  assert.match(source, /Usuário Responsável/);
  assert.match(source, /Quarto \(Acomodação\)/);
  assert.match(source, /Coluna \(Status no Quadro\)/);
});
