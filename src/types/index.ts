export type UserRole = 'admin' | 'gerente' | 'recepcionista' | 'governanca' | 'financeiro' | 'pdv_only' | 'cozinha_only' | 'tablet_quarto';

export type RBACAccessLevel = 'total' | 'readonly' | 'custom' | 'exclusive' | 'none';

export interface RBACRolePermission {
  granted: boolean;
  level: RBACAccessLevel;
  customLabel: string;
  description?: string;
}

export interface RBACResourceRule {
  id: string;
  moduleName: string;
  description?: string;
  category?: string;
  adminTab?: AdminTab;
  isCustom?: boolean;
  permissions: Partial<Record<UserRole, RBACRolePermission>>;
}

export interface RBACMatrixConfig {
  version: number;
  lastUpdated: string;
  updatedBy?: string;
  resources: RBACResourceRule[];
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  tipo_usuario: UserRole;
  cargo_titulo?: string;
  telefone?: string;
  ativo: boolean;
  avatar?: string;
  ultimo_acesso?: string;
  permissoes?: string[];
  created_at: string;
}

export interface TipoQuarto {
  id: string;
  nome: string;
  descricao: string;
  capacidade: number;
  preco_base: number;
  comodidades: string[];
  fotos: string[];
  ativo: boolean;
}

export type RoomStatus = 'disponivel' | 'ocupado' | 'manutencao' | 'sujo' | 'limpeza' | 'vistoria';
export type HousekeepingStatus = 'sujo' | 'limpeza' | 'aguardando_vistoria' | 'aprovado' | 'bloqueado';

export interface Quarto {
  id: string;
  numero: string;
  tipo_quarto_id: string;
  andar: number;
  status: RoomStatus;
  status_housekeeping?: HousekeepingStatus;
  capacidade: number;
  preco_diaria: number;
  descricao: string;
  comodidades: string[];
  fotos: string[];
  ativo: boolean;
}

export interface Hospede {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  preferencia_quarto?: string;
  vip: boolean;
  total_estadias: number;
  ultima_estadia?: string;
  created_at: string;
}

export interface Reserva {
  id: string;
  hospede_id: string;
  quarto_id: string;
  data_checkin: string;
  data_checkout: string;
  checkin?: string;
  checkout?: string;
  checkin_horario?: string;
  checkout_horario?: string;
  adultos: number;
  criancas: number;
  status: 'pendente' | 'confirmada' | 'checkin_realizado' | 'checkout_concluido' | 'cancelada';
  origem: 'direto' | 'booking' | 'airbnb' | 'expedia' | 'telefone' | 'outro';
  valor_total: number;
  valor_pago: number;
  observacoes?: string;
  codigo_reserva?: string;
  created_at: string;
}

export interface Pagamento {
  id: string;
  reserva_id: string;
  valor: number;
  metodo: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia';
  status: 'pendente' | 'aprovado' | 'recusado' | 'estornado';
  data_pagamento?: string;
  transacao_id?: string;
  observacoes?: string;
}

export interface BloqueioQuarto {
  id: string;
  quarto_id: string;
  motivo: string;
  data_inicio: string;
  data_fim: string;
  tipo: 'manutencao' | 'bloqueio' | 'evento';
  ativo: boolean;
}

export type AdminTab = 'dashboard' | 'kanban' | 'reservations' | 'checkin_out' | 'rooms' | 'guests' | 'financial' | 'frigobar' | 'automation' | 'users' | 'settings' | 'design';

export type ThemeColorPalette = 'stone' | 'amber' | 'emerald' | 'blue' | 'violet' | 'rose' | 'slate';
export type TypographyStyle = 'modern' | 'classic' | 'elegant' | 'technical';
export type PropertyType = 'hotel' | 'pousada' | 'resort' | 'hostel' | 'motel' | 'apart-hotel';
