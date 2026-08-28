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

export interface RoomMapWidgetPresentationSettings {
  version: 1;
  visibleStatusIds?: RoomMapStatusId[];
  showGuest: boolean;
  showReservationDates: boolean;
  showRoomType: boolean;
  showFloor: boolean;
  showStatus: boolean;
}

const DEFAULT_PRESENTATION: RoomMapWidgetPresentationSettings = {
  version: 1,
  visibleStatusIds: undefined,
  showGuest: true,
  showReservationDates: true,
  showRoomType: true,
  showFloor: true,
  showStatus: true,
};

export function readRoomMapWidgetPresentation(widget: WorkspaceWidgetDefinition): RoomMapWidgetPresentationSettings {
  const settings = widget.settings && typeof widget.settings === 'object' ? widget.settings : {};
  const raw = settings.roomMapPresentation && typeof settings.roomMapPresentation === 'object'
    ? settings.roomMapPresentation as Partial<RoomMapWidgetPresentationSettings>
    : {};
  const validStatusIds = Array.isArray(raw.visibleStatusIds)
    ? raw.visibleStatusIds.filter((id): id is RoomMapStatusId => ROOM_MAP_STATUS_OPTIONS.some(option => option.id === id))
    : undefined;

  return {
    version: 1,
    visibleStatusIds: validStatusIds,
    showGuest: raw.showGuest !== false,
    showReservationDates: raw.showReservationDates !== false,
    showRoomType: raw.showRoomType !== false,
    showFloor: raw.showFloor !== false,
    showStatus: raw.showStatus !== false,
  };
}

export function withRoomMapWidgetPresentation(
  widget: WorkspaceWidgetDefinition,
  patch: Partial<Omit<RoomMapWidgetPresentationSettings, 'version'>>,
): WorkspaceWidgetDefinition {
  const current = readRoomMapWidgetPresentation(widget);
  return {
    ...widget,
    settings: {
      ...(widget.settings || {}),
      roomMapPresentation: {
        ...current,
        ...patch,
        version: 1,
      },
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
