import { OperationalSectorId } from '../domain/operationalSectors';
import { WorkspaceDefinition } from './types';
import { normalizeWorkspaceWidgets } from './widgetCatalog';

export const WORKSPACE_BOARD_OPTIONS = [
  { id: 'kanban-default-board', sector: 'operacao' as OperationalSectorId, label: 'Operação Geral' },
  { id: 'kanban-board-governanca', sector: 'governanca' as OperationalSectorId, label: 'Governança' },
  { id: 'kanban-board-recepcao', sector: 'recepcao' as OperationalSectorId, label: 'Recepção' },
  { id: 'kanban-board-manutencao', sector: 'manutencao' as OperationalSectorId, label: 'Manutenção' },
  { id: 'kanban-board-cozinha', sector: 'cozinha' as OperationalSectorId, label: 'Cozinha & Room Service' },
] as const;

export const defaultBoardForSector = (sector: OperationalSectorId): string =>
  WORKSPACE_BOARD_OPTIONS.find(option => option.sector === sector)?.id || 'kanban-default-board';

const slug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'personalizado';

export const createWorkspaceDefinition = (input: {
  name: string;
  sector: OperationalSectorId;
  boardId?: string;
  id?: string;
}): WorkspaceDefinition => {
  const boardId = input.boardId || defaultBoardForSector(input.sector);
  const id = input.id || `workspace-custom-${slug(input.name)}-${Date.now().toString(36)}`;
  return {
    id,
    name: input.name,
    description: `Ambiente operacional personalizado para ${input.name}.`,
    sectors: [input.sector],
    layout: 'operational',
    defaultScope: 'sector',
    widgets: normalizeWorkspaceWidgets([
      { id: `${id}-metrics`, type: 'metrics', boardId, order: 10, span: 'full', enabled: true },
      { id: `${id}-kanban`, type: 'kanban-cards', boardId, title: 'Fluxo operacional', order: 20, span: 'full', enabled: true },
      { id: `${id}-alerts`, type: 'alerts', title: 'Alertas', order: 30, span: 2, enabled: false },
      { id: `${id}-actions`, type: 'quick-actions', title: 'Ações rápidas', order: 40, span: 2, enabled: false },
    ]),
  };
};

export const duplicateWorkspaceDefinition = (source: WorkspaceDefinition): WorkspaceDefinition => {
  const id = `workspace-custom-${slug(source.name)}-copia-${Date.now().toString(36)}`;
  return {
    ...source,
    id,
    name: `${source.name} — Cópia`,
    widgets: normalizeWorkspaceWidgets(source.widgets.map(widget => ({ ...widget, id: `${id}-${widget.type}-${Math.random().toString(36).slice(2, 7)}` }))),
  };
};

export const setWorkspaceSectorAndBoard = (
  definition: WorkspaceDefinition,
  sector: OperationalSectorId,
  boardId: string = defaultBoardForSector(sector),
): WorkspaceDefinition => ({
  ...definition,
  sectors: [sector],
  widgets: definition.widgets.map(widget =>
    widget.type === 'metrics' || widget.type === 'kanban-cards'
      ? { ...widget, boardId }
      : widget,
  ),
});
