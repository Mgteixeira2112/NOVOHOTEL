export type OperationalSectorId =
  | 'operacao'
  | 'governanca'
  | 'recepcao'
  | 'manutencao'
  | 'cozinha';

export interface OperationalSectorDefinition {
  id: OperationalSectorId;
  label: string;
  description: string;
  order: number;
}

export const OPERATIONAL_SECTORS: readonly OperationalSectorDefinition[] = [
  { id: 'operacao', label: 'Operação Geral', description: 'Visão transversal da operação do hotel.', order: 0 },
  { id: 'governanca', label: 'Governança', description: 'Limpeza, inspeção, enxoval e liberação de acomodações.', order: 1 },
  { id: 'recepcao', label: 'Recepção', description: 'Atendimento, check-in, check-out e solicitações de hóspedes.', order: 2 },
  { id: 'manutencao', label: 'Manutenção', description: 'Chamados, reparos e ordens de serviço técnicas.', order: 3 },
  { id: 'cozinha', label: 'Cozinha & Room Service', description: 'Pedidos, preparo e entrega de alimentos e bebidas.', order: 4 },
] as const;

const VALID_SECTOR_IDS = new Set<string>(OPERATIONAL_SECTORS.map(sector => sector.id));

export function isOperationalSectorId(value: unknown): value is OperationalSectorId {
  return typeof value === 'string' && VALID_SECTOR_IDS.has(value);
}

export function normalizeOperationalSectorIds(values: unknown): OperationalSectorId[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(isOperationalSectorId)));
}

export function getOperationalSectorLabel(value?: string | null): string {
  return OPERATIONAL_SECTORS.find(sector => sector.id === value)?.label || 'Sem setor';
}

export function inferOperationalSectorFromRole(role?: string | null): OperationalSectorId | null {
  switch (role) {
    case 'governanca':
      return 'governanca';
    case 'recepcionista':
      return 'recepcao';
    case 'cozinha_only':
      return 'cozinha';
    default:
      return null;
  }
}
