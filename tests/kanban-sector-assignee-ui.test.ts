import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/KanbanModule.tsx', 'utf8');

test('Responsáveis são filtrados pelos setores operacionais quando a estrutura está disponível', () => {
  assert.ok(source.includes('responsibleSectorMap'));
  assert.ok(source.includes('responsibleDirectoryAvailable'));
  assert.match(source, /responsibleSectorMap\[user\.id\]\?\.includes\(formDepartment\)/);
  assert.ok(source.includes('-- Sem responsável --'));
});

test('Troca de setor seleciona o quadro e a primeira coluna correspondentes', () => {
  assert.ok(source.includes('const handleDepartmentChange ='));
  assert.match(source, /boards\.find\(board => board\.departamento === department\)/);
  assert.match(source, /columns\s*\.filter\(column => column\.board_id === targetBoard\?\.id\)/);
  assert.ok(source.includes("setFormColumnId(firstColumn.id)"));
});

test('Criação usa o quadro do setor selecionado e edição não duplica movimentação de status', () => {
  assert.ok(source.includes('boardId: targetBoard.id'));
  assert.ok(source.includes('columnId: targetColumn'));
  assert.match(source, /if \(!changingDepartment && canMove && editingCard\.column_id !== targetColumn\)/);
  assert.ok(source.includes('kanbanCardGovernance.moveCard(persisted, targetColumn'));
  assert.equal(source.includes('column_id: effectiveColumnId'), false);
});
