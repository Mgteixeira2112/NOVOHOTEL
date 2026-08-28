import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(process.cwd(), 'src/workspace-engine/widgets/TaskKanbanWidget.tsx'), 'utf8');

describe('TaskKanbanWidget editor de responsável', () => {
  it('usa usuários do HotelContext e diretório de setores', () => {
    expect(source).toContain('const { rooms, users, currentUser } = useHotel();');
    expect(source).toContain('responsibleSectorMap');
    expect(source).toContain('fetchUserOperationalSectorsState(user.id)');
    expect(source).toContain('responsibleUsers');
  });

  it('persiste o responsável no assigned_to usando o mesmo payload do kanban principal', () => {
    expect(source).toContain('const assignedPayload = selectedUser ?');
    expect(source).toContain('assigned_to: canAssign(editingCard) ? assignedPayload : editingCard.assigned_to');
  });

  it('mantém no modal os campos do padrão operacional', () => {
    expect(source).toContain('Setor / Departamento');
    expect(source).toContain('Usuário Responsável');
    expect(source).toContain('Quarto (Acomodação)');
    expect(source).toContain('Coluna (Status no Quadro)');
  });
});
