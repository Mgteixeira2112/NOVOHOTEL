import { supabase } from '../../lib/supabase';

export const AVAILABILITY_EVENTS = [
  'reservation.created',
  'reservation.cancelled',
  'stay.checked_in',
  'stay.checked_out',
  'room.blocked',
  'room.unblocked',
] as const;

export function subscribeToAvailability(hotelId: string, onChange: () => void) {
  const channel = supabase
    .channel(`availability:${hotelId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas', filter: `hotel_id=eq.${hotelId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bloqueios', filter: `hotel_id=eq.${hotelId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_os_stays', filter: `hotel_id=eq.${hotelId}` }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
