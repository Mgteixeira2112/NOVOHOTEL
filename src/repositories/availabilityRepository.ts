import { supabase } from '../services/supabase';
import type { BedMatch, BookingMode, AvailabilityResult } from '../domain/hotelOsCore';

export interface AvailabilitySearch {
  hotelId: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  ratePlanId?: string | null;
  discountCode?: string | null;
  reservationId?: string | null;
}

export interface PriceInput {
  hotelId: string;
  roomTypeId: string;
  checkin: string;
  checkout: string;
  ratePlanId: string;
  discountCode?: string | null;
}

export interface HoldInput {
  hotelId: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  roomTypeId: string;
  ratePlanId: string;
  bookingMode?: BookingMode;
  holdMinutes?: number;
}

export const availabilityRepository = {
  async search(input: AvailabilitySearch): Promise<AvailabilityResult[]> {
    const { data, error } = await supabase.rpc('hotel_os_availability', {
      p_hotel_id: input.hotelId,
      p_checkin: input.checkin,
      p_checkout: input.checkout,
      p_adults: input.adults,
      p_children: input.children,
      p_rate_plan_id: input.ratePlanId ?? null,
      p_discount_code: input.discountCode ?? null,
      p_reservation_id: input.reservationId ?? null,
    });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      roomTypeId: row.room_type_id,
      roomTypeName: row.room_type_name,
      roomId: row.room_id,
      roomNumber: row.room_number,
      capacity: row.capacity,
      maxAdults: row.max_adults,
      maxChildren: row.max_children,
      maxGuests: row.max_guests,
      beds: row.beds ?? [],
      bedMatch: row.bed_match as BedMatch,
      price: row.price ?? null,
      rankingScore: row.ranking_score,
    }));
  },
  async calculatePrice(input: PriceInput) {
    const { data, error } = await supabase.rpc('hotel_os_calculate_reservation_price', {
      p_hotel_id: input.hotelId,
      p_room_type_id: input.roomTypeId,
      p_checkin: input.checkin,
      p_checkout: input.checkout,
      p_rate_plan_id: input.ratePlanId,
      p_discount_code: input.discountCode ?? null,
    });
    if (error) throw error;
    return data;
  },
  async createHold(input: HoldInput): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_create_reservation_hold', {
      p_hotel_id: input.hotelId,
      p_checkin: input.checkin,
      p_checkout: input.checkout,
      p_adults: input.adults,
      p_children: input.children,
      p_room_type_id: input.roomTypeId,
      p_rate_plan_id: input.ratePlanId,
      p_booking_mode: input.bookingMode ?? 'AUTO',
      p_hold_minutes: input.holdMinutes ?? 15,
    });
    if (error) throw error;
    return data as string;
  },
  async confirm(reservationId: string): Promise<string> {
    const { data, error } = await supabase.rpc('hotel_os_confirm_reservation', { p_reservation_id: reservationId });
    if (error) throw error;
    return data as string;
  },
};
