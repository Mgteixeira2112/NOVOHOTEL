import { WorkspaceWidgetDefinition } from '../types';

export const ROOM_MAP_STATUS_OPTIONS = [
  { id: 'room-col-disponivel', label: 'Disponível' },
  { id: 'room-col-ocupado', label: 'Ocupado' },
  { id: 'room-col-sujo', label: 'Sujo' },
  { id: 'room-col-limpeza', label: 'Em limpeza' },
  { id: 'room-col-vistoria', label: 'Vistoria' },
  { id: 'room-col-manutencao', label: 'Manutenção' },
  { id: 'room-col-bloqueado', label: 'Bloqueado' },
  { id: 'room-col-outros', label: 'Outros' },
] as const;

export type RoomMapStatusId = typeof ROOM_MAP_STATUS_OPTIONS[number]['id'];
export type RoomMapGrouping = 'none' | 'floor' | 'type' | 'status';
export type RoomMapOrdering = 'number' | 'floor' | 'status';
export type RoomMapDensity = 'compact' | 'normal' | 'enlarged';
export type RoomMapDesktopMode = 'room-rack' | 'grid' | 'list';
export type RoomMapMobileMode = 'compact-list' | 'cards' | 'summary-popup';
export type RoomMapKdsMode = 'compact-grid' | 'situation-board';

export interface RoomMapDesktopPresentation {
  mode: RoomMapDesktopMode;
  grouping: RoomMapGrouping;
  ordering: RoomMapOrdering;
  density: RoomMapDensity;
}

export interface RoomMapMobilePresentation {
  mode: RoomMapMobileMode;
  ordering: RoomMapOrdering;
  density: RoomMapDensity;
}

export interface RoomMapKdsPresentation {
  mode: RoomMapKdsMode;
  grouping: RoomMapGrouping;
  ordering: RoomMapOrdering;
  density: RoomMapDensity;
}

export interface RoomMapWidgetPresentationSettings {
  version: 2;
  visibleStatusIds?: RoomMapStatusId[];
  showGuest: boolean;
  showReservationDates: boolean;
  showRoomType: boolean;
  showFloor: boolean;
  showStatus: boolean;
  showDailyRate: boolean;
  showReservationCode: boolean;
  showOperationalOwner: boolean;
  showActiveActivity: boolean;
  grouping: RoomMapGrouping;
  ordering: RoomMapOrdering;
  density: RoomMapDensity;
  desktop: RoomMapDesktopPresentation;
  mobile: RoomMapMobilePresentation;
  kds: RoomMapKdsPresentation;
}

type LegacyRoomMapWidgetPresentationSettings = {
  version?: 1;
  visibleStatusIds?: RoomMapStatusId[];
  showGuest?: boolean;
  showReservationDates?: boolean;
  showRoomType?: boolean;
  showFloor?: boolean;
  showStatus?: boolean;
};

const DEFAULT_PRESENTATION: RoomMapWidgetPresentationSettings = {
  version: 2,
  visibleStatusIds: undefined,
  showGuest: true,
  showReservationDates: true,
  showRoomType: true,
  showFloor: true,
  showStatus: true,
  showDailyRate: false,
  showReservationCode: false,
  showOperationalOwner: false,
  showActiveActivity: false,
  grouping: 'none',
  ordering: 'number',
  density: 'normal',
  desktop: {
    mode: 'room-rack',
    grouping: 'none',
    ordering: 'number',
    density: 'normal',
  },
  mobile: {
    mode: 'cards',
    ordering: 'number',
    density: 'normal',
  },
  kds: {
    mode: 'situation-board',
    grouping: 'status',
    ordering: 'status',
    density: 'enlarged',
  },
};

const GROUPINGS: RoomMapGrouping[] = ['none', 'floor', 'type', 'status'];
const ORDERINGS: RoomMapOrdering[] = ['number', 'floor', 'status'];
const DENSITIES: RoomMapDensity[] = ['compact', 'normal', 'enlarged'];
const DESKTOP_MODES: RoomMapDesktopMode[] = ['room-rack', 'grid', 'list'];
const MOBILE_MODES: RoomMapMobileMode[] = ['compact-list', 'cards', 'summary-popup'];
const KDS_MODES: RoomMapKdsMode[] = ['compact-grid', 'situation-board'];

function oneOf<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === 'string' && values.includes(value as T) ? value as T : fallback;
}

function booleanOrDefault(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeVisibleStatusIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((id): id is RoomMapStatusId => ROOM_MAP_STATUS_OPTIONS.some(option => option.id === id))
    : undefined;
}

export function normalizeRoomMapWidgetPresentation(rawValue: unknown): RoomMapWidgetPresentationSettings {
  const raw = rawValue && typeof rawValue === 'object'
    ? rawValue as Partial<RoomMapWidgetPresentationSettings> & LegacyRoomMapWidgetPresentationSettings
    : {};
  const desktop: Partial<RoomMapDesktopPresentation> = raw.desktop && typeof raw.desktop === 'object' ? raw.desktop : {};
  const mobile: Partial<RoomMapMobilePresentation> = raw.mobile && typeof raw.mobile === 'object' ? raw.mobile : {};
  const kds: Partial<RoomMapKdsPresentation> = raw.kds && typeof raw.kds === 'object' ? raw.kds : {};

  const grouping = oneOf(raw.grouping, GROUPINGS, DEFAULT_PRESENTATION.grouping);
  const ordering = oneOf(raw.ordering, ORDERINGS, DEFAULT_PRESENTATION.ordering);
  const density = oneOf(raw.density, DENSITIES, DEFAULT_PRESENTATION.density);

  return {
    version: 2,
    visibleStatusIds: normalizeVisibleStatusIds(raw.visibleStatusIds),
    showGuest: booleanOrDefault(raw.showGuest, DEFAULT_PRESENTATION.showGuest),
    showReservationDates: booleanOrDefault(raw.showReservationDates, DEFAULT_PRESENTATION.showReservationDates),
    showRoomType: booleanOrDefault(raw.showRoomType, DEFAULT_PRESENTATION.showRoomType),
    showFloor: booleanOrDefault(raw.showFloor, DEFAULT_PRESENTATION.showFloor),
    showStatus: booleanOrDefault(raw.showStatus, DEFAULT_PRESENTATION.showStatus),
    showDailyRate: booleanOrDefault(raw.showDailyRate, DEFAULT_PRESENTATION.showDailyRate),
    showReservationCode: booleanOrDefault(raw.showReservationCode, DEFAULT_PRESENTATION.showReservationCode),
    showOperationalOwner: booleanOrDefault(raw.showOperationalOwner, DEFAULT_PRESENTATION.showOperationalOwner),
    showActiveActivity: booleanOrDefault(raw.showActiveActivity, DEFAULT_PRESENTATION.showActiveActivity),
    grouping,
    ordering,
    density,
    desktop: {
      mode: oneOf(desktop.mode, DESKTOP_MODES, DEFAULT_PRESENTATION.desktop.mode),
      grouping: oneOf(desktop.grouping, GROUPINGS, grouping),
      ordering: oneOf(desktop.ordering, ORDERINGS, ordering),
      density: oneOf(desktop.density, DENSITIES, density),
    },
    mobile: {
      mode: oneOf(mobile.mode, MOBILE_MODES, DEFAULT_PRESENTATION.mobile.mode),
      ordering: oneOf(mobile.ordering, ORDERINGS, ordering),
      density: oneOf(mobile.density, DENSITIES, density),
    },
    kds: {
      mode: oneOf(kds.mode, KDS_MODES, DEFAULT_PRESENTATION.kds.mode),
      grouping: oneOf(kds.grouping, GROUPINGS, DEFAULT_PRESENTATION.kds.grouping),
      ordering: oneOf(kds.ordering, ORDERINGS, DEFAULT_PRESENTATION.kds.ordering),
      density: oneOf(kds.density, DENSITIES, DEFAULT_PRESENTATION.kds.density),
    },
  };
}

export function readRoomMapWidgetPresentation(widget: WorkspaceWidgetDefinition): RoomMapWidgetPresentationSettings {
  const settings = widget.settings && typeof widget.settings === 'object' ? widget.settings : {};
  return normalizeRoomMapWidgetPresentation(settings.roomMapPresentation);
}

export function withRoomMapWidgetPresentation(
  widget: WorkspaceWidgetDefinition,
  patch: Partial<Omit<RoomMapWidgetPresentationSettings, 'version'>>,
): WorkspaceWidgetDefinition {
  const current = readRoomMapWidgetPresentation(widget);
  const next = normalizeRoomMapWidgetPresentation({
    ...current,
    ...patch,
    desktop: patch.desktop ? { ...current.desktop, ...patch.desktop } : current.desktop,
    mobile: patch.mobile ? { ...current.mobile, ...patch.mobile } : current.mobile,
    kds: patch.kds ? { ...current.kds, ...patch.kds } : current.kds,
    version: 2,
  });

  return {
    ...widget,
    settings: {
      ...(widget.settings || {}),
      roomMapPresentation: next,
    },
  };
}

export function roomMapActionEnabled(widget: WorkspaceWidgetDefinition, action: 'checkin' | 'checkout' | 'transferRoom' | 'editRoom' | 'deleteRoom') {
  return widget.actions?.[action] === true;
}

export function defaultRoomMapActionsForSector(sector: string) {
  return sector === 'recepcao'
    ? { checkin: true, checkout: true, transferRoom: true, editRoom: false, deleteRoom: false }
    : { checkin: false, checkout: false, transferRoom: false, editRoom: false, deleteRoom: false };
}
