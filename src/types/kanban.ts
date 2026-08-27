import { UserRole } from './index';

export type KanbanDepartment = 'recepcao' | 'governanca' | 'cozinha' | 'manutencao' | 'financeiro' | 'almoxarifado' | string;

export type KanbanPriority = 'critica' | 'atencao' | 'normal';

export interface KanbanCardComment {
  id: string;
  author_id?: string;
  author_name: string;
  author_role?: UserRole | string;
  content: string;
  created_at: string;
  is_system?: boolean;
}

export interface KanbanChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
}

export interface KanbanCardAssignee {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface KanbanCard {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  location: string;
  priority: KanbanPriority;
  sla_target_minutes: number;
  created_at: string;
  /** Versão temporal retornada pelo PostgreSQL. Usada para impedir regressão por evento atrasado. */
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  assigned_to?: KanbanCardAssignee | null;
  origin_department?: string;
  delegated_to_department?: string;
  guest_name?: string;
  reservation_id?: string;
  room_number?: string;
  order_items?: string[];
  service_details?: string[];
  summary_category?: string;
  amount?: number;
  comments: KanbanCardComment[];
  checklist: KanbanChecklistItem[];
  tags?: string[];
  is_archived?: boolean;
  order: number;
  just_created?: boolean;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  title: string;
  color?: string;
  order: number;
  wip_limit?: number;
  is_final?: boolean;
  is_in_progress?: boolean;
  is_delegated?: boolean;
}

export interface KanbanBoard {
  id: string;
  title: string;
  department: KanbanDepartment;
  icon_name: 'ConciergeBell' | 'Sparkles' | 'UtensilsCrossed' | 'Wrench' | 'DollarSign' | 'Package' | 'Boxes' | 'Layers' | string;
  description: string;
  default_sla_minutes: number;
  allowed_roles_manage: UserRole[];
  allowed_roles_view: UserRole[];
  columns: KanbanColumn[];
  is_custom?: boolean;
}

export interface KanbanSlaMetrics {
  total_cards_today: number;
  completed_cards_today: number;
  on_time_percentage: number;
  avg_resolution_minutes: number;
  active_urgent_count: number;
  bottlenecks_by_column: { column_title: string; count: number; department: string }[];
}

export type KanbanViewMode = 'board' | 'kds_monitor' | 'metrics' | 'table';
