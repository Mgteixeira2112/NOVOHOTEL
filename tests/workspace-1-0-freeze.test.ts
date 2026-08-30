import assert from 'node:assert/strict';
import test from 'node:test';
import { getWidgetAvailability, getWidgetCatalogItem } from '../src/workspace-engine/widgetCatalog';
import { createWorkspaceDefinition, defaultBoardForSector } from '../src/workspace-engine/workspaceFactory';
import type { WorkspaceWidgetType } from '../src/workspace-engine/types';
import type { OperationalSectorId } from '../src/domain/operationalSectors';

const sectors: OperationalSectorId[] = ['operacao', 'recepcao', 'governanca', 'manutencao', 'cozinha'];

test('Workspace 1.0: todo template setorial nasce sem widget incompatível ou planned', () => {
  for (const sector of sectors) {
    const workspace = createWorkspaceDefinition({ name: `Freeze ${sector}`, sector, id: `freeze-${sector}` });
    for (const widget of workspace.widgets.filter(item => item.enabled !== false)) {
      const availability = getWidgetAvailability(widget.type, sector);
      assert.equal(availability.allowed, true, `${sector} não pode nascer com ${widget.type}: ${availability.reason}`);
      assert.notEqual(getWidgetCatalogItem(widget.type)?.readiness, 'planned', `${sector} não pode incluir ${widget.type} planned`);
    }
  }
});

test('Workspace 1.0: todos os setores têm Ações rápidas e Equipe exatamente uma vez', () => {
  for (const sector of sectors) {
    const workspace = createWorkspaceDefinition({ name: `Freeze ${sector}`, sector, id: `freeze-actions-${sector}` });
    const active = workspace.widgets.filter(item => item.enabled !== false);
    assert.equal(active.filter(widget => widget.type === 'quick-actions').length, 1, `Ações rápidas divergentes em ${sector}`);
    assert.equal(active.filter(widget => widget.type === 'team').length, 1, `Equipe divergente em ${sector}`);
  }
});

test('Workspace 1.0: widgets baseados em board usam o board oficial do setor', () => {
  const boardTypes = new Set<WorkspaceWidgetType>(['task-kanban', 'maintenance', 'kanban-cards']);
  for (const sector of sectors) {
    const workspace = createWorkspaceDefinition({ name: `Freeze ${sector}`, sector, id: `freeze-board-${sector}` });
    const expectedBoard = defaultBoardForSector(sector);
    for (const widget of workspace.widgets.filter(item => item.enabled !== false && boardTypes.has(item.type))) {
      assert.equal(widget.boardId, expectedBoard, `${widget.type} em ${sector} deve usar ${expectedBoard}`);
    }
  }
});

test('Workspace 1.0: Pedidos e Atalhos ficam fora até existir contrato funcional consolidado', () => {
  for (const type of ['orders', 'shortcuts'] as const) {
    assert.equal(getWidgetCatalogItem(type)?.readiness, 'planned');
    for (const sector of sectors) {
      assert.equal(getWidgetAvailability(type, sector).allowed, false);
    }
  }
});
