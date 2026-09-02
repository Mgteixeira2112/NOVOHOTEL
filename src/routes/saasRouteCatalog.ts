export type SaaSEnvironment = 'public' | 'hotel' | 'platform';

export type SaaSRouteId =
  | 'public-home'
  | 'public-rooms'
  | 'public-services'
  | 'public-location'
  | 'public-contact'
  | 'public-booking'
  | 'hotel-home'
  | 'hotel-reception'
  | 'hotel-reservations'
  | 'hotel-rooms'
  | 'hotel-guests'
  | 'hotel-operations'
  | 'hotel-kanban'
  | 'hotel-pdv'
  | 'hotel-kds'
  | 'hotel-inventory'
  | 'hotel-finance'
  | 'hotel-management'
  | 'hotel-team'
  | 'hotel-command-center'
  | 'hotel-settings'
  | 'hotel-automations'
  | 'platform-home'
  | 'platform-organizations'
  | 'platform-hotels'
  | 'platform-plans'
  | 'platform-subscriptions'
  | 'platform-feature-flags'
  | 'platform-audit';

export interface SaaSRouteDefinition {
  id: SaaSRouteId;
  environment: SaaSEnvironment;
  path: string;
  label: string;
  authenticated: boolean;
  menu: boolean;
  operationalSector?: boolean;
}

export const PUBLIC_ROUTES: readonly SaaSRouteDefinition[] = [
  { id: 'public-home', environment: 'public', path: '/', label: 'Início', authenticated: false, menu: true },
  { id: 'public-rooms', environment: 'public', path: '/quartos', label: 'Quartos', authenticated: false, menu: true },
  { id: 'public-services', environment: 'public', path: '/servicos', label: 'Serviços', authenticated: false, menu: true },
  { id: 'public-location', environment: 'public', path: '/localizacao', label: 'Localização', authenticated: false, menu: true },
  { id: 'public-contact', environment: 'public', path: '/contato', label: 'Contato', authenticated: false, menu: true },
  { id: 'public-booking', environment: 'public', path: '/reservar', label: 'Reservar', authenticated: false, menu: true },
] as const;

export const HOTEL_ROUTES: readonly SaaSRouteDefinition[] = [
  { id: 'hotel-home', environment: 'hotel', path: '/app', label: 'Início', authenticated: true, menu: true },
  { id: 'hotel-reception', environment: 'hotel', path: '/app/recepcao', label: 'Recepção', authenticated: true, menu: true },
  { id: 'hotel-reservations', environment: 'hotel', path: '/app/reservas', label: 'Reservas', authenticated: true, menu: true },
  { id: 'hotel-rooms', environment: 'hotel', path: '/app/quartos', label: 'Quartos', authenticated: true, menu: true },
  { id: 'hotel-guests', environment: 'hotel', path: '/app/hospedes', label: 'Hóspedes', authenticated: true, menu: true },
  { id: 'hotel-operations', environment: 'hotel', path: '/app/operacao', label: 'Operação', authenticated: true, menu: true, operationalSector: true },
  { id: 'hotel-kanban', environment: 'hotel', path: '/app/kanban', label: 'Kanban', authenticated: true, menu: true, operationalSector: true },
  { id: 'hotel-pdv', environment: 'hotel', path: '/app/pdv', label: 'PDV', authenticated: true, menu: true },
  { id: 'hotel-kds', environment: 'hotel', path: '/app/kds', label: 'KDS', authenticated: true, menu: true, operationalSector: true },
  { id: 'hotel-inventory', environment: 'hotel', path: '/app/estoque', label: 'Estoque', authenticated: true, menu: true },
  { id: 'hotel-finance', environment: 'hotel', path: '/app/financeiro', label: 'Financeiro', authenticated: true, menu: true },
  { id: 'hotel-management', environment: 'hotel', path: '/app/gestao', label: 'Gestão', authenticated: true, menu: true },
  { id: 'hotel-team', environment: 'hotel', path: '/app/gestao/equipe', label: 'Equipe & Acessos', authenticated: true, menu: false },
  { id: 'hotel-command-center', environment: 'hotel', path: '/app/gestao/hotel-os', label: 'Central Hotel OS', authenticated: true, menu: false },
  { id: 'hotel-settings', environment: 'hotel', path: '/app/configuracoes', label: 'Configurações', authenticated: true, menu: true },
  { id: 'hotel-automations', environment: 'hotel', path: '/app/configuracoes/automacoes', label: 'Automações', authenticated: true, menu: false },
] as const;

export const PLATFORM_ROUTES: readonly SaaSRouteDefinition[] = [
  { id: 'platform-home', environment: 'platform', path: '/platform', label: 'Plataforma', authenticated: true, menu: true },
  { id: 'platform-organizations', environment: 'platform', path: '/platform/organizacoes', label: 'Organizações', authenticated: true, menu: true },
  { id: 'platform-hotels', environment: 'platform', path: '/platform/hoteis', label: 'Hotéis', authenticated: true, menu: true },
  { id: 'platform-plans', environment: 'platform', path: '/platform/planos', label: 'Planos', authenticated: true, menu: true },
  { id: 'platform-subscriptions', environment: 'platform', path: '/platform/assinaturas', label: 'Assinaturas', authenticated: true, menu: true },
  { id: 'platform-feature-flags', environment: 'platform', path: '/platform/feature-flags', label: 'Feature Flags', authenticated: true, menu: true },
  { id: 'platform-audit', environment: 'platform', path: '/platform/auditoria', label: 'Auditoria', authenticated: true, menu: true },
] as const;

export const SAAS_ROUTES: readonly SaaSRouteDefinition[] = [
  ...PUBLIC_ROUTES,
  ...HOTEL_ROUTES,
  ...PLATFORM_ROUTES,
] as const;

export const routesForEnvironment = (environment: SaaSEnvironment): SaaSRouteDefinition[] =>
  SAAS_ROUTES.filter(route => route.environment === environment);

export const findSaaSRoute = (path: string): SaaSRouteDefinition | undefined =>
  SAAS_ROUTES.find(route => route.path === path);
