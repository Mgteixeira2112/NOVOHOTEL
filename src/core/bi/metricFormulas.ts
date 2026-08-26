export function calculateOccupancy(occupiedRoomNights: number, availableRoomNights: number): number {
  if (availableRoomNights <= 0) return 0;
  return occupiedRoomNights / availableRoomNights;
}

export function calculateAdr(roomRevenue: number, soldRoomNights: number): number {
  if (soldRoomNights <= 0) return 0;
  return roomRevenue / soldRoomNights;
}

export function calculateRevpar(roomRevenue: number, availableRoomNights: number): number {
  if (availableRoomNights <= 0) return 0;
  return roomRevenue / availableRoomNights;
}

export function calculateAverageTicket(revenue: number, orders: number): number {
  if (orders <= 0) return 0;
  return revenue / orders;
}

export function calculateDifference(actual: number, target: number): number {
  return actual - target;
}
