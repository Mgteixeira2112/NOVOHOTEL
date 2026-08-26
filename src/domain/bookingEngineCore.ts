export const BED_TYPE_CODES = [
  'SINGLE',
  'DOUBLE',
  'QUEEN',
  'KING',
  'SUPER_KING',
  'BUNK',
  'SOFA_BED',
  'FUTON',
  'CRIB',
  'EXTRA_BED',
] as const;
export type StandardBedTypeCode = typeof BED_TYPE_CODES[number];
export type BedTypeCode = StandardBedTypeCode | string;

export const MATCH_RESULTS = ['EXACT_MATCH', 'GOOD_MATCH', 'PARTIAL_MATCH', 'NO_MATCH'] as const;
export type MatchResult = typeof MATCH_RESULTS[number];

export const RESERVATION_ENGINE_STATUSES = [
  'PENDING',
  'HELD',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'NO_SHOW',
  'EXPIRED',
] as const;
export type ReservationEngineStatus = typeof RESERVATION_ENGINE_STATUSES[number];

export const GUEST_ROLES = ['PRIMARY', 'COMPANION', 'CHILD', 'INFANT'] as const;
export type GuestRole = typeof GUEST_ROLES[number];

export interface RoomTypeEngine {
  id: string;
  hotelId: string;
  name: string;
  description?: string | null;
  maxAdults: number;
  maxChildren: number;
  maxOccupants: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RoomEngine {
  id: string;
  hotelId: string;
  roomTypeId: string;
  number: string;
  floor?: number | string | null;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'DIRTY' | 'CLEANING' | 'OUT_OF_ORDER' | 'OUT_OF_SERVICE';
}

export interface BedTypeEngine {
  id: string;
  code: BedTypeCode;
  name: string;
  capacity: number;
  isActive: boolean;
}

export interface RoomBedEngine {
  id: string;
  roomId: string;
  bedTypeId: string;
  bedTypeCode: BedTypeCode;
  quantity: number;
  width?: number | null;
  length?: number | null;
  capacity: number;
  isExtra: boolean;
  isActive: boolean;
}

export interface SearchCriteria {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants?: number;
  childrenAges?: number[];
  bedPreferences?: { bedTypeCode: BedTypeCode; quantity: number }[];
  roomTypeFilter?: string[];
  amenities?: string[];
}

export interface RoomBlockEngine {
  id: string;
  hotelId: string;
  roomId?: string | null;
  roomTypeId?: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  isActive: boolean;
}

export interface HoldEngine {
  id: string;
  reservationId: string;
  heldAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface ReservationGuestEngine {
  id: string;
  reservationId: string;
  guestId?: string | null;
  name: string;
  role: GuestRole;
  age?: number | null;
  birthDate?: string | null;
}

export interface ReservationNightEngine {
  id: string;
  reservationId: string;
  date: string;
  amount: number;
}

export interface RatePlanEngine {
  id: string;
  hotelId: string;
  name: string;
  minimumStay: number;
  maximumStay?: number | null;
  cancellationPolicy?: string | null;
  paymentPolicy?: string | null;
  mealPlan?: string | null;
  isActive: boolean;
}

export interface ReservationEngine {
  id: string;
  hotelId: string;
  guestId?: string | null;
  roomTypeId: string;
  roomId?: string | null;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  status: ReservationEngineStatus;
  source: string;
  totalAmount: number;
  ratePlanId?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  guests?: ReservationGuestEngine[];
  nights?: ReservationNightEngine[];
}

export interface MatchScoreEvaluation {
  matchScore: number;
  matchResult: MatchResult;
  reasons: string[];
}

/**
 * Validação de intervalo de datas para reservas.
 * Intervalo de estadia tratado como [check_in, check_out).
 * Rejeita check_out <= check_in.
 */
export function validateBookingDates(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  const start = new Date(checkIn + 'T00:00:00Z');
  const end = new Date(checkOut + 'T00:00:00Z');
  return end.getTime() > start.getTime();
}

/**
 * Verifica sobreposição de intervalo [A_in, A_out) com [B_in, B_out).
 * Reservas consecutivas (ex: A_out === B_in) NÃO são conflitantes.
 */
export function isDateRangeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = new Date(startA + 'T00:00:00Z').getTime();
  const aEnd = new Date(endA + 'T00:00:00Z').getTime();
  const bStart = new Date(startB + 'T00:00:00Z').getTime();
  const bEnd = new Date(endB + 'T00:00:00Z').getTime();

  return aStart < bEnd && aEnd > bStart;
}

/**
 * Avalia se o quarto físico está livre e disponível no intervalo especificado.
 */
export function isRoomEngineAvailable(
  room: RoomEngine,
  checkIn: string,
  checkOut: string,
  existingReservations: ReservationEngine[],
  blocks: RoomBlockEngine[],
  holds: HoldEngine[],
  now: Date = new Date()
): { available: boolean; reason?: string } {
  // 1. Quarto em manutenção ou bloqueio físico permanente
  if (room.status === 'OUT_OF_ORDER' || room.status === 'OUT_OF_SERVICE' || room.status === 'MAINTENANCE') {
    return { available: false, reason: `Quarto em status ${room.status}` };
  }

  // 2. Bloqueios de quarto ou categoria
  const activeBlock = blocks.find(
    (b) =>
      b.isActive &&
      (b.roomId === room.id || b.roomTypeId === room.roomTypeId) &&
      isDateRangeOverlap(checkIn, checkOut, b.startDate, b.endDate)
  );
  if (activeBlock) {
    return { available: false, reason: `Quarto com bloqueio ativo: ${activeBlock.reason}` };
  }

  // 3. Holds temporários ativos (não expirados)
  const activeHold = holds.find((h) => {
    if (!h.isActive) return false;
    const exp = new Date(h.expiresAt).getTime();
    if (exp <= now.getTime()) return false; // Expirado

    const heldReservation = existingReservations.find((r) => r.id === h.reservationId);
    if (!heldReservation || heldReservation.roomId !== room.id) return false;
    return isDateRangeOverlap(checkIn, checkOut, heldReservation.checkIn, heldReservation.checkOut);
  });
  if (activeHold) {
    return { available: false, reason: 'Quarto com retenção temporária (Hold ativo)' };
  }

  // 4. Reservas existentes ativas
  const activeReservation = existingReservations.find((r) => {
    if (r.roomId !== room.id) return false;
    if (
      r.status === 'CANCELLED' ||
      r.status === 'CHECKED_OUT' ||
      r.status === 'NO_SHOW' ||
      r.status === 'EXPIRED' ||
      r.status === 'HELD'
    ) {
      return false;
    }
    return isDateRangeOverlap(checkIn, checkOut, r.checkIn, r.checkOut);
  });
  if (activeReservation) {
    return { available: false, reason: `Quarto já reservado (Reserva ${activeReservation.id})` };
  }

  return { available: true };
}

/**
 * Avaliação inteligente de camas e capacidade (Match Score).
 * Compara configuração solicitada com a configuração física das camas do quarto.
 */
export function evaluateBedMatch(
  requestedPreferences: { bedTypeCode: BedTypeCode; quantity: number }[] | undefined,
  roomBeds: RoomBedEngine[],
  totalGuests: { adults: number; children: number; infants: number }
): MatchScoreEvaluation {
  const reasons: string[] = [];
  const activeBeds = roomBeds.filter((b) => b.isActive);

  // Calcula capacidade total das camas
  const totalBedCapacity = activeBeds.reduce((sum, b) => sum + b.capacity * b.quantity, 0);
  const requiredAdultsChildren = totalGuests.adults + totalGuests.children;

  if (totalBedCapacity < requiredAdultsChildren) {
    return {
      matchScore: 0,
      matchResult: 'NO_MATCH',
      reasons: [`Capacidade das camas (${totalBedCapacity}) insuficiente para ${requiredAdultsChildren} hóspedes`],
    };
  }

  reasons.push('capacidade compatível');

  // Sem preferências específicas de cama -> Good Match se capacidade couber
  if (!requestedPreferences || requestedPreferences.length === 0) {
    return {
      matchScore: 85,
      matchResult: 'GOOD_MATCH',
      reasons: [...reasons, 'quarto disponível'],
    };
  }

  // Verifica correspondência exata de camas
  let exactCount = 0;
  let superiorCount = 0;
  let missingCount = 0;

  for (const pref of requestedPreferences) {
    const matchingBed = activeBeds.find((b) => b.bedTypeCode === pref.bedTypeCode && b.quantity >= pref.quantity);
    if (matchingBed) {
      exactCount++;
    } else {
      // Regra de equivalência superior: King substitui Queen, Queen substitui Double
      const isUpgradeAvailable =
        (pref.bedTypeCode === 'QUEEN' && activeBeds.some((b) => ['KING', 'SUPER_KING'].includes(b.bedTypeCode))) ||
        (pref.bedTypeCode === 'DOUBLE' &&
          activeBeds.some((b) => ['QUEEN', 'KING', 'SUPER_KING'].includes(b.bedTypeCode)));

      if (isUpgradeAvailable) {
        superiorCount++;
      } else {
        missingCount++;
      }
    }
  }

  if (missingCount === 0 && exactCount === requestedPreferences.length) {
    return {
      matchScore: 100,
      matchResult: 'EXACT_MATCH',
      reasons: [...reasons, 'configuração de camas exata', 'quarto disponível'],
    };
  }

  if (missingCount === 0 && (exactCount > 0 || superiorCount > 0)) {
    return {
      matchScore: 90,
      matchResult: 'GOOD_MATCH',
      reasons: [...reasons, 'configuração de camas superior/equivalente', 'quarto disponível'],
    };
  }

  if (exactCount > 0 || superiorCount > 0) {
    return {
      matchScore: 60,
      matchResult: 'PARTIAL_MATCH',
      reasons: [...reasons, 'configuração de camas parcialmente compatível'],
    };
  }

  return {
    matchScore: 30,
    matchResult: 'PARTIAL_MATCH',
    reasons: [...reasons, 'camas diferentes do solicitado mas com capacidade suficiente'],
  };
}

/**
 * Recálculo autoritativo de valores de diárias, descontos e taxas no backend.
 */
export function recalculateAuthoritativePrice(
  nightsPrices: number[],
  discountPercent?: number | null,
  fixedDiscount?: number | null,
  feesAmount?: number | null
): { subtotal: number; discountTotal: number; feesTotal: number; totalAmount: number } {
  const subtotal = nightsPrices.reduce((sum, p) => sum + p, 0);

  let discountTotal = 0;
  if (discountPercent && discountPercent > 0) {
    discountTotal += Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  }
  if (fixedDiscount && fixedDiscount > 0) {
    discountTotal += fixedDiscount;
  }
  discountTotal = Math.min(discountTotal, subtotal);

  const feesTotal = feesAmount && feesAmount > 0 ? feesAmount : 0;
  const totalAmount = Math.max(0, Math.round((subtotal - discountTotal + feesTotal) * 100) / 100);

  return {
    subtotal,
    discountTotal,
    feesTotal,
    totalAmount,
  };
}
