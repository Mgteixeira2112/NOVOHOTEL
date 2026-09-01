import { useHotel } from '../../context/HotelContext';
import { ROOM_OPERATIONAL_STATUS, normalizeRoomOperationalStatus } from '../../domain/roomOperationalStatus';
import { localDateKey } from './localDate';

type HotelState = ReturnType<typeof useHotel>;
type Reservations = HotelState['reservations'];
type Rooms = HotelState['rooms'];

const dateKey = (value?: string | null) => String(value || '').slice(0, 10);
const ALERT_STATUSES = new Set(['manutencao', 'sujo', 'limpeza', 'vistoria', 'bloqueado']);

export const selectReceptionReservationItems = (
  reservations: Reservations,
  mode: 'arrivals' | 'departures',
  today = localDateKey(),
) => reservations.filter(reservation => {
  const value = mode === 'arrivals'
    ? reservation.data_checkin || reservation.checkin
    : reservation.data_checkout || reservation.checkout;
  if (dateKey(value) !== today || ['cancelada', 'checkout_concluido'].includes(reservation.status)) return false;
  return mode === 'arrivals'
    ? ['confirmada', 'pendente'].includes(reservation.status)
    : reservation.status === 'checkin_realizado';
});

export const selectReceptionRoomAlerts = (rooms: Rooms) => rooms
  .filter(room => room.ativo !== false)
  .map(room => {
    const roomStatus = normalizeRoomOperationalStatus(room.status);
    const governanceStatus = normalizeRoomOperationalStatus(room.status_governanca || room.status_housekeeping);
    const alertStatus = ALERT_STATUSES.has(roomStatus)
      ? roomStatus
      : ALERT_STATUSES.has(governanceStatus)
        ? governanceStatus
        : null;
    return alertStatus ? { room, alertStatus } : null;
  })
  .filter(Boolean) as Array<{ room: Rooms[number]; alertStatus: keyof typeof ROOM_OPERATIONAL_STATUS }>;

export const selectReceptionSummary = (rooms: Rooms, reservations: Reservations) => {
  const activeRooms = rooms.filter(room => room.ativo !== false);
  const activeRoomIds = new Set(activeRooms.map(room => room.id));
  const occupied = reservations.filter(item => item.status === 'checkin_realizado' && activeRoomIds.has(item.quarto_id)).length;
  const available = activeRooms.filter(item => normalizeRoomOperationalStatus(item.status) === 'disponivel').length;
  return {
    totalRooms: activeRooms.length,
    available,
    occupied,
  };
};
