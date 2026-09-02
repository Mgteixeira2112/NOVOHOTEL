import type { AdminTab, UserRole } from '../types';

export type SaaSMenuSectionId =
  | 'inicio'
  | 'recepcao'
  | 'hospedagem'
  | 'operacao'
  | 'alimentos-bebidas'
  | 'estoque'
  | 'financeiro'
  | 'gestao'
  | 'configuracoes';

export interface SaaSMenuItem {
  id: string;
  label: string;
  adminTab: AdminTab;
  path: string;
  allowedRoles?: readonly UserRole[];
}

export interface SaaSMenuSection {
  id: SaaSMenuSectionId;
  label: string;
  items: readonly SaaSMenuItem[];
}

export const SAAS_FIXED_MENU: readonly SaaSMenuSection[] = [
  {
    id: 'inicio',
    label: 'Início',
    items: [{ id: 'dashboard', label: 'Visão Geral', adminTab: 'dashboard', path: '/app' }],
  },
  {
    id: 'recepcao',
    label: 'Recepção',
    items: [{ id: 'checkin-out', label: 'Check-in / Out', adminTab: 'checkin_out', path: '/app/recepcao' }],
  },
  {
    id: 'hospedagem',
    label: 'Hospedagem',
    items: [
      { id: 'reservas', label: 'Reservas', adminTab: 'reservations', path: '/app/reservas' },
      { id: 'quartos', label: 'Quartos', adminTab: 'rooms', path: '/app/quartos' },
      { id: 'hospedes', label: 'Hóspedes', adminTab: 'guests', path: '/app/hospedes' },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    items: [{ id: 'kanban', label: 'Kanban Operacional', adminTab: 'kanban', path: '/app/kanban' }],
  },
  {
    id: 'alimentos-bebidas',
    label: 'Alimentos & Bebidas',
    items: [
      { id: 'pdv', label: 'PDV & Caixa', adminTab: 'pdv', path: '/app/pdv' },
      { id: 'kds', label: 'KDS • Cozinha', adminTab: 'kds', path: '/app/kds' },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    items: [{ id: 'estoque-frigobar', label: 'Frigobar & Estoque', adminTab: 'frigobar', path: '/app/estoque' }],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [{ id: 'financeiro', label: 'Financeiro & Folio', adminTab: 'financial', path: '/app/financeiro', allowedRoles: ['admin', 'gerente', 'financeiro'] }],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: [
      { id: 'bi', label: 'BI & KPIs', adminTab: 'management_bi', path: '/app/gestao', allowedRoles: ['admin', 'gerente', 'financeiro'] },
      { id: 'equipe', label: 'Equipe & Acessos', adminTab: 'users', path: '/app/gestao/equipe', allowedRoles: ['admin', 'gerente'] },
      { id: 'hotel-os', label: 'Central Hotel OS', adminTab: 'command_center', path: '/app/gestao/hotel-os', allowedRoles: ['admin', 'gerente'] },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    items: [
      { id: 'configuracoes', label: 'Hotel & Sistema', adminTab: 'settings', path: '/app/configuracoes', allowedRoles: ['admin', 'gerente'] },
      { id: 'automacoes', label: 'Automações', adminTab: 'automation', path: '/app/configuracoes/automacoes', allowedRoles: ['admin', 'gerente'] },
    ],
  },
] as const;

export const menuSectionForTab = (tab: string): SaaSMenuSection | undefined =>
  SAAS_FIXED_MENU.find(section => section.items.some(item => item.adminTab === tab));

export const menuItemForTab = (tab: string): SaaSMenuItem | undefined =>
  SAAS_FIXED_MENU.flatMap(section => section.items).find(item => item.adminTab === tab);

export const roleCanSeeMenuItem = (role: UserRole, item: SaaSMenuItem): boolean =>
  !item.allowedRoles || item.allowedRoles.includes(role);
